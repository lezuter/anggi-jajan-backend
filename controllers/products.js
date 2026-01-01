// Controller Products

const pool = require('../db/db');
const path = require('path');
const fs = require('fs');

// Search products
exports.searchProducts = async (req, res) => {
    const { q } = req.query;
    try {
        const [rows] = await pool.query("SELECT * FROM products WHERE name LIKE ?", [`%${q}%`]);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("Search products error:", err);
        res.status(500).json({ success: false, message: "Gagal mencari produk" });
    }
};

// Get products by gameSlug
exports.getProductsByGameSlug = async (req, res) => {
    try {
        const [rows] = await pool.query(`
    SELECT p.* 
    FROM products p
    JOIN cardcontent c ON p.card_code = c.code
    WHERE c.slug = ?
`, [req.params.gameSlug]);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("Get products by slug error:", err);
        res.status(500).json({ success: false, message: "Gagal mengambil produk" });
    }
};

// Get all products
exports.getProducts = async (req, res) => {
    // Ambil parameter dari query URL, dengan nilai default 25
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;

    try {
        // Query pertama: hitung total semua produk
        const [totalRows] = await pool.query("SELECT COUNT(*) as total FROM products");
        const totalItems = totalRows[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Query kedua: ambil data sesuai halaman dan limit
        const [products] = await pool.query(
            "SELECT * FROM products ORDER BY id DESC LIMIT ? OFFSET ?",
            [limit, offset]
        );

        // Kirim respons baru yang berisi data dan info halaman
        res.json({
            success: true,
            data: products,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems
            }
        });
    } catch (error) {
        console.error("Error mengambil produk:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data produk' });
    }
};

// Create product
exports.createProduct = async (req, res) => {
    // Ambil 'harga_coret' bukan 'discount'
    const {
        kategori, card_code, group_name, product_code,
        product_name, description, price, price_sell, harga_coret
    } = req.body;

    const newProductData = {
        kategori, card_code, group_name, product_code,
        product_name, description,
        price: price || 0,
        price_sell: price_sell || null,
        harga_coret: harga_coret || null,
        image: req.file ? req.file.filename : null
    };

    try {
        await pool.query("INSERT INTO products SET ?", [newProductData]);
        res.status(201).json({ success: true, message: 'Produk baru berhasil ditambahkan!' });
    } catch (error) {
        console.error('Error saat membuat produk:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan produk ke database.' });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const {
        kategori, card_code, group_name, product_code,
        product_name, description, price, price_sell, harga_coret, oldImage
    } = req.body;

    const updatedProductData = {
        kategori, card_code, group_name, product_code,
        product_name, description, 
        price: price || 0,
        price_sell: price_sell || null,
        harga_coret: harga_coret || null
    };

    if (req.file) {
        updatedProductData.image = req.file.filename;
        if (oldImage) {
            const oldImagePath = path.join(__dirname, '../public/images/product', oldImage);
            fs.unlink(oldImagePath, (err) => {
                if (err) console.error("Gagal hapus gambar produk lama:", err);
            });
        }
    }

    try {
        await pool.query("UPDATE products SET ? WHERE id = ?", [updatedProductData, id]);
        res.json({ success: true, message: 'Produk berhasil diperbarui.' });
    } catch (error) {
        console.error('Error saat update produk:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui produk.' });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Cari dulu nama file gambarnya sebelum data dihapus
        const [rows] = await pool.query("SELECT image FROM products WHERE id = ?", [id]);

        // 2. Hapus data dari database
        await pool.query("DELETE FROM products WHERE id = ?", [id]);

        // 3. Jika ada file gambar, hapus filenya dari server
        if (rows.length > 0 && rows[0].image) {
            const imagePath = path.join(__dirname, '../public/images/product', rows[0].image);
            fs.unlink(imagePath, (err) => {
                if (err) console.error("Gagal hapus file gambar produk:", err);
            });
        }

        res.json({ success: true, message: 'Produk berhasil dihapus.' });
    } catch (err) {
        console.error("Delete product error:", err);
        res.status(500).json({ success: false, message: "Gagal hapus produk" });
    }
};

// Mengambil produk berdasarkan kode game
exports.getProductsByGameCode = async (req, res) => {
    try {
        const { code } = req.params;
        const [rows] = await pool.query("SELECT * FROM products WHERE card_code = ?", [code]);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("Gagal mengambil produk berdasarkan kode:", err);
        res.status(500).json({ success: false, message: "Kesalahan server" });
    }
};

exports.updateUserInputConfig = async (req, res) => {
    const { code } = req.params;
    const { config } = req.body; // Kita akan kirim data config di dalam body

    try {
        // Query ini akan meng-update jika sudah ada, atau membuat baru jika belum ada
        await pool.query(
            "INSERT INTO userid_input_config (game_code, input_fields) VALUES (?, ?) ON DUPLICATE KEY UPDATE input_fields = ?",
            [code, config, config]
        );
        res.json({ success: true, message: 'Konfigurasi form berhasil disimpan!' });
    } catch (error) {
        console.error('Error update user input config:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan konfigurasi.' });
    }
};

// FUNGSI BARU UNTUK HAPUS MASSAL
exports.deleteBulkProducts = async (req, res) => {
    const { ids } = req.body; // ids adalah array: [1, 2, 3]
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'ID tidak valid.' });
    }

    try {
        // Ambil nama file gambar sebelum dihapus
        const [rows] = await pool.query("SELECT image FROM products WHERE id IN (?)", [ids]);
        
        // Hapus data dari database
        const [deleteResult] = await pool.query("DELETE FROM products WHERE id IN (?)", [ids]);

        if (deleteResult.affectedRows > 0) {
            // Hapus file gambar terkait
            rows.forEach(row => {
                if (row.image) {
                    const imagePath = path.join(__dirname, '../public/images/product', row.image);
                    fs.unlink(imagePath, (err) => {
                        if (err) console.error("Gagal hapus file gambar:", err);
                    });
                }
            });
            res.json({ success: true, message: `${deleteResult.affectedRows} produk berhasil dihapus.` });
        } else {
            res.status(404).json({ success: false, message: 'Tidak ada produk yang ditemukan untuk dihapus.' });
        }
    } catch (error) {
        console.error('Error saat hapus massal:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus data produk.' });
    }
};