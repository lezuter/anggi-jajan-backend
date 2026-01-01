// Controller auth.js

const pool = require('../db/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    try {
        // Cari user berdasarkan email (bisa user biasa atau admin)
        const [users] = await pool.query("SELECT * FROM user WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }

        const user = users[0];

        // Jika user tidak punya password (misal, daftar via Google), tolak login
        if (!user.password) {
            return res.status(401).json({ success: false, message: 'Akun ini terdaftar melalui Google. Silakan masuk dengan Google.' });
        }

        // Bandingkan password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }

        // Buat token
        const tokenPayload = { 
            id: user.id, 
            name: user.name, 
            role: user.role 
        };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Set cookie dan kirim respons
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 hari
        });

        return res.json({ 
            success: true, 
            token: token,
            userName: user.name,
            userRole: user.role
        });

    } catch (err) {
        console.error("User login error:", err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};