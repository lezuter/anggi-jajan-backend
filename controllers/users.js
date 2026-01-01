// Controller Users

const pool = require('../db/db');

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM users");
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("Get users error:", err);
        res.status(500).json({ success: false, message: "Gagal mengambil data user" });
    }
};

// Get user by id
exports.getUserById = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error("Get user by id error:", err);
        res.status(500).json({ success: false, message: "Gagal mengambil user" });
    }
};

// Create user
exports.createUser = async (req, res) => {
    try {
        await pool.query("INSERT INTO users SET ?", [req.body]);
        res.json({ success: true, message: "User berhasil dibuat" });
    } catch (err) {
        console.error("Create user error:", err);
        res.status(500).json({ success: false, message: "Gagal membuat user" });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        await pool.query("UPDATE users SET ? WHERE id = ?", [req.body, req.params.id]);
        res.json({ success: true, message: "User berhasil diupdate" });
    } catch (err) {
        console.error("Update user error:", err);
        res.status(500).json({ success: false, message: "Gagal update user" });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: "User berhasil dihapus" });
    } catch (err) {
        console.error("Delete user error:", err);
        res.status(500).json({ success: false, message: "Gagal hapus user" });
    }
};
