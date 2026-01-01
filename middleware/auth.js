// File: middleware/auth.js

const jwt = require('jsonwebtoken');
const pool = require('../db/db');

// Middleware untuk melindungi halaman, memastikan user sudah login & ada di DB
exports.protectPage = async (req, res, next) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.redirect('/login');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [rows] = await pool.query('SELECT * FROM user WHERE name = ?', [decoded.name]);
        
        if (rows.length === 0) {
            // Jika user tidak ada di DB, hapus cookie-nya & paksa login
            res.clearCookie('authToken');
            return res.redirect('/login');
        }
        
        req.user = rows[0]; // Simpan data user untuk dipakai di controller
        next();
    } catch (err) {
        res.clearCookie('authToken');
        return res.redirect('/login');
    }
};

// Middleware untuk halaman admin, memastikan user adalah admin
exports.checkAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Akses ditolak');
    }
};

// Middleware untuk redirect jika user SUDAH login
exports.redirectIfLoggedIn = async (req, res, next) => {
    const token = req.cookies.authToken;
    if (!token) {
        return next(); // Jika tidak ada token, biarkan user melihat halaman login
    }
    try {
        // Cek token DAN cek ke database (logika disamakan dengan protectPage)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [rows] = await pool.query('SELECT * FROM user WHERE name = ?', [decoded.name]);

        if (rows.length > 0) {
            // Jika user valid dan ada di DB, redirect dia dari halaman login
            const user = rows[0];
            if (user.role === 'admin') {
                return res.redirect('/admin');
            } else {
                return res.redirect('/id'); // Untuk user biasa
            }
        }
        // Jika user tidak ada di DB, biarkan dia di halaman login
        return next();
    } catch (err) {
        // Jika token tidak valid, biarkan dia di halaman login
        return next();
    }
};