// Controller paymentMethods

// /controllers/paymentMethods.js
const pool = require('../db/db');
const path = require('path');
const fs = require('fs');

// Get all payment methods
exports.getPaymentMethods = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;

    try {
        const [totalRows] = await pool.query("SELECT COUNT(*) as total FROM payment_methods");
        const totalItems = totalRows[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        const query = `
            SELECT pm.*
            FROM payment_methods pm
            LEFT JOIN payment_group_order pgo ON pm.group_name = pgo.group_name
            ORDER BY pgo.display_order ASC, pm.name ASC
            LIMIT ? OFFSET ?;
        `;
        const [rows] = await pool.query(query, [limit, offset]);
        
        res.json({
            success: true,
            data: rows,
            pagination: { currentPage: page, totalPages: totalPages, totalItems: totalItems }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data.' });
    }
};

// Create payment method
exports.createPaymentMethod = async (req, res) => {
    // 1. Ambil HANYA data yang ada di tabel 'payment_methods'
    const { name, code, fee, group_name, icon_url, is_active, display_order } = req.body;

    // 2. Siapkan data bersih untuk database
    const newMethodData = {
        name,
        code,
        fee: fee || 0,
        group_name,
        icon_url,
        is_active: is_active ? 1 : 0, // Konversi boolean ke integer (1 atau 0)
        display_order: display_order || 0
    };

    try {
        await pool.query("INSERT INTO payment_methods SET ?", [newMethodData]);
        res.status(201).json({ success: true, message: 'Metode pembayaran baru berhasil ditambahkan!' });
    } catch (error) {
        console.error('Error saat membuat metode pembayaran:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan metode pembayaran.' });
    }
};

// Update payment method
exports.updatePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, fee, group_name, icon_url, is_active, display_order } = req.body;
        const updatedMethodData = {
            name,
            code,
            fee: fee || 0,
            group_name: group_name || 'Lainnya',
            icon_url,
            is_active: is_active ? 1 : 0,
            display_order: display_order || 0
        };
        await pool.query("UPDATE payment_methods SET ? WHERE id = ?", [updatedMethodData, id]);
        res.json({ success: true, message: 'Metode pembayaran berhasil diperbarui.' });
    } catch (error) {
        console.error('Error saat update metode pembayaran:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui metode pembayaran.' });
    }
};

// Delete payment method
exports.deletePaymentMethod = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM payment_methods WHERE id = ?", [id]);
        res.json({ success: true, message: 'Metode pembayaran berhasil dihapus.' });
    } catch (error) {
        console.error('Error saat menghapus metode pembayaran:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus metode pembayaran.' });
    }
};

// Fungsi untuk mengambil urutan grup saat ini
exports.getGroupOrder = async (req, res) => {
    try {
        let [orderRows] = await pool.query("SELECT group_name FROM payment_group_order ORDER BY display_order ASC");

        // Fallback jika tabel order masih kosong
        if (orderRows.length === 0) {
            [orderRows] = await pool.query("SELECT DISTINCT group_name FROM payment_methods");
        }
        
        const groupNames = orderRows.map(row => row.group_name);
        res.json({ success: true, data: groupNames });
    } catch (error) {
        console.error('Error getGroupOrder:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil urutan grup.' });
    }
};

// Fungsi untuk menyimpan urutan grup yang baru
exports.saveGroupOrder = async (req, res) => {
    const { order } = req.body; // order adalah array: ["E-Wallet", "Virtual Account", "Lainnya"]
    if (!order || !Array.isArray(order)) {
        return res.status(400).json({ success: false, message: 'Data urutan tidak valid.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Hapus urutan lama
        await connection.query("DELETE FROM payment_group_order");
        // Masukkan urutan baru
        for (let i = 0; i < order.length; i++) {
            const groupName = order[i];
            const displayOrder = i;
            await connection.query("INSERT INTO payment_group_order (group_name, display_order) VALUES (?, ?)", [groupName, displayOrder]);
        }
        await connection.commit();
        res.json({ success: true, message: 'Urutan grup berhasil disimpan.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error saveGroupOrder:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan urutan grup.' });
    } finally {
        connection.release();
    }
};

// FUNGSI BARU UNTUK HAPUS MASSAL
exports.deleteBulkPaymentMethods = async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'ID tidak valid.' });
    }
    try {
        const [deleteResult] = await pool.query("DELETE FROM payment_methods WHERE id IN (?)", [ids]);
        if (deleteResult.affectedRows > 0) {
            res.json({ success: true, message: `${deleteResult.affectedRows} metode pembayaran berhasil dihapus.` });
        } else {
            res.status(404).json({ success: false, message: 'Tidak ada item yang ditemukan.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menghapus data.' });
    }
};

// FUNGSI BARU UNTUK TOGGLE STATUS
exports.toggleActiveStatus = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Ambil status saat ini
        const [rows] = await pool.query("SELECT is_active FROM payment_methods WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Metode tidak ditemukan.' });
        }

        // 2. Balik nilainya (jika 1 jadi 0, jika 0 jadi 1)
        const newStatus = !rows[0].is_active;

        // 3. Update ke database
        await pool.query("UPDATE payment_methods SET is_active = ? WHERE id = ?", [newStatus, id]);

        res.json({ success: true, message: `Status berhasil diubah.` });
    } catch (error) {
        console.error('Error toggle status:', error);
        res.status(500).json({ success: false, message: 'Gagal mengubah status.' });
    }
};