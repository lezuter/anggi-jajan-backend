// Controller Carousel

const pool = require('../db/db');
const path = require('path');
const fs = require('fs');

// Fungsi untuk mengambil semua carousel untuk admin
exports.getCarousels = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, image_filename, link_url, display_order, is_active FROM carousel ORDER BY display_order ASC");
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data carousel' });
    }
};

// Fungsi untuk mengambil carousel yang aktif untuk publik
exports.getPublicCarousels = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM carousel WHERE is_active = 1 ORDER BY display_order ASC");
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data carousel publik' });
    }
};

exports.createCarousel = async (req, res) => {
    // 1. Ambil HANYA data yang relevan dari form
    const { link_url } = req.body;

    // 2. Cek apakah ada file yang di-upload
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Gambar wajib di-upload!' });
    }

    // 3. Siapkan data bersih untuk database
    const newCarouselData = {
        link_url: link_url || null, // Jika link_url kosong, simpan sebagai NULL
        image_filename: req.file.filename,
        is_active: 1, // Defaultnya aktif
        display_order: 0 // Defaultnya di urutan pertama
    };

    try {
        await pool.query("INSERT INTO carousel SET ?", [newCarouselData]);
        res.status(201).json({ success: true, message: 'Carousel baru berhasil ditambahkan!' });
    } catch (error) {
        console.error('Error saat membuat carousel:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan carousel ke database.' });
    }
};

exports.updateCarousel = async (req, res) => {
    const { id } = req.params;
    const { link_url, oldImage } = req.body;

    const updatedCarouselData = {
        link_url: link_url || null
    };

    // Jika ada gambar BARU yang di-upload
    if (req.file) {
        updatedCarouselData.image_filename = req.file.filename;
        // Hapus gambar LAMA dari server
        if (oldImage) {
            const oldImagePath = path.join(__dirname, '../public/images/carousel', oldImage);
            fs.unlink(oldImagePath, (err) => {
                if (err) console.error("Gagal hapus gambar lama carousel:", err);
            });
        }
    }

    try {
        await pool.query("UPDATE carousel SET ? WHERE id = ?", [updatedCarouselData, id]);
        res.json({ success: true, message: 'Carousel berhasil diperbarui.' });
    } catch (error) {
        console.error('Error saat update carousel:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui carousel.' });
    }
};

// Fungsi untuk menghapus carousel (sudah termasuk hapus file)
exports.deleteCarousel = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT image_filename FROM carousel WHERE id = ?", [id]);
        await pool.query("DELETE FROM carousel WHERE id = ?", [id]);

        if (rows.length > 0 && rows[0].image_filename) {
            const imagePath = path.join(__dirname, '../public/images/carousel', rows[0].image_filename);
            fs.unlink(imagePath, (err) => {
                if (err) console.error("Gagal hapus file gambar carousel:", err);
            });
        }
        res.json({ success: true, message: 'Carousel berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menghapus carousel.' });
    }
};

// Fungsi untuk menyimpan urutan carousel
exports.saveCarouselOrder = async (req, res) => {
    const { order } = req.body; // order adalah array of IDs: [3, 1, 2]
    if (!order || !Array.isArray(order)) {
        return res.status(400).json({ success: false, message: 'Data urutan tidak valid.' });
    }
    try {
        const queries = order.map((id, index) => {
            return pool.query("UPDATE carousel SET display_order = ? WHERE id = ?", [index, id]);
        });
        await Promise.all(queries);
        res.json({ success: true, message: 'Urutan carousel berhasil disimpan.' });
    } catch (error) {
        console.error('Error menyimpan urutan carousel:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan urutan.' });
    }
};

// FUNGSI BARU UNTUK HAPUS MASSAL
exports.deleteBulkCarousels = async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'ID tidak valid.' });
    }

    try {
        const [rows] = await pool.query("SELECT image_filename FROM carousel WHERE id IN (?)", [ids]);
        const [deleteResult] = await pool.query("DELETE FROM carousel WHERE id IN (?)", [ids]);

        if (deleteResult.affectedRows > 0) {
            rows.forEach(row => {
                if (row.image_filename) {
                    const imagePath = path.join(__dirname, '../public/images/carousel', row.image_filename);
                    fs.unlink(imagePath, (err) => {
                        if (err) console.error("Gagal hapus file gambar:", err);
                    });
                }
            });
            res.json({ success: true, message: `${deleteResult.affectedRows} item berhasil dihapus.` });
        } else {
            res.status(404).json({ success: false, message: 'Tidak ada item yang ditemukan.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menghapus data.' });
    }
};