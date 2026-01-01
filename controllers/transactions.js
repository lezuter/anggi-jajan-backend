// File: controllers/transactions.js

const pool = require('../db/db');

exports.createTransaction = async (req, res) => {
    try {
        const { product_code, user_id, zone_id, email, payment_code } = req.body;

        if (!product_code || !user_id || !payment_code) {
            return res.status(400).json({ success: false, message: "Data permintaan tidak lengkap." });
        }

        // 1. Ambil harga produk dari database (SUMBER KEBENARAN 1)
        // Pastikan nama tabel (misal: 'products') dan kolomnya ('price', 'product_name', 'product_code') sesuai dengan DB-mu
        const [products] = await pool.query("SELECT price, product_name FROM products WHERE product_code = ?", [product_code]);
        if (products.length === 0) {
            return res.status(404).json({ success: false, message: "Produk tidak ditemukan." });
        }
        const product = products[0];

        // 2. Ambil biaya layanan dari database (SUMBER KEBENARAN 2)
        const [paymentMethods] = await pool.query("SELECT fee, name FROM payment_methods WHERE code = ? AND is_active = 1", [payment_code]);
        if (paymentMethods.length === 0) {
            return res.status(404).json({ success: false, message: "Metode pembayaran tidak valid atau tidak aktif." });
        }
        const paymentMethod = paymentMethods[0];

        // 3. Kalkulasi harga final di server (AMAN)
        const finalPrice = parseFloat(product.price) + parseFloat(paymentMethod.fee);

        // Untuk sekarang, kita simpan dulu ke DB sebagai placeholder
        const newTransaction = {
            // ref_id: paymentResponse.reference, // ID dari payment gateway
            produk: product.product_name,
            amount: finalPrice,
            user_id: `${user_id}${zone_id ? `(${zone_id})` : ''}`,
            payment_method: paymentMethod.name,
            status: "pending"
        };

        await pool.query("INSERT INTO transactions SET ?", [newTransaction]);

        // Kirim balik data pembayaran (misal dari payment gateway) ke front-end untuk ditampilkan
        // Data di bawah ini hanya contoh, sesuaikan dengan respons asli dari payment gateway
        res.json({
            success: true,
            message: "Transaksi berhasil dibuat",
            data: {
                reference: "DUMMY-" + Date.now(), // Contoh ID
                order_items: [{ name: product.product_name }],
                amount: finalPrice,
                payment_name: paymentMethod.name,
                qr_url: null, // Isi jika ada QR code
                checkout_url: "#" // Isi dengan link pembayaran
            }
        });

    } catch (err) {
        console.error("Create transaction error:", err);
        res.status(500).json({ success: false, message: "Terjadi kesalahan internal di server." });
    }
};


exports.createPayment = async (req, res) => {
    try {
        const { trx_id, payment_method } = req.body;

        if (!trx_id || !payment_method) {
            return res.status(400).json({ success: false, message: "Data pembayaran tidak lengkap" });
        }

        await pool.query("UPDATE transactions SET payment_method = ?, status = 'waiting_payment' WHERE trx_id = ?",
            [payment_method, trx_id]);

        res.json({ success: true, message: "Pembayaran berhasil dibuat" });
    } catch (err) {
        console.error("Create payment error:", err);
        res.status(500).json({ success: false, message: "Gagal membuat pembayaran" });
    }
};

// Fungsi untuk mengambil semua transaksi untuk admin panel
exports.getAllTransactions = async (req, res) => {
    // Ambil parameter dari query URL
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const filter = req.query.filter || 'all'; // <-- Parameter baru untuk filter
    const offset = (page - 1) * limit;

    try {
        let whereClause = '';
        const params = [];

        // Tentukan klausa WHERE berdasarkan filter
        if (filter === 'today') {
            whereClause = ' WHERE DATE(t.created_at) = CURDATE()';
        } else if (filter === 'month') {
            whereClause = ' WHERE MONTH(t.created_at) = MONTH(CURDATE()) AND YEAR(t.created_at) = YEAR(CURDATE())';
        } else if (filter === 'year') {
            whereClause = ' WHERE YEAR(t.created_at) = YEAR(CURDATE())';
        }
        // Jika 'all', whereClause tetap kosong

        // Query untuk menghitung total transaksi (sudah difilter)
        const countQuery = `SELECT COUNT(*) as total FROM transactions t${whereClause}`;
        const [totalRows] = await pool.query(countQuery, params);
        const totalItems = totalRows[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Query untuk mengambil data transaksi (sudah difilter)
        const dataQuery = `
            SELECT t.*, p.product_name 
            FROM transactions t
            LEFT JOIN products p ON t.product_code = p.product_code
            ${whereClause}
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?;
        `;

        // Tambahkan limit dan offset ke parameter untuk query data
        const dataParams = [...params, limit, offset];
        const [transactions] = await pool.query(dataQuery, dataParams);

        res.json({
            success: true,
            data: transactions,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems
            }
        });
    } catch (error) {
        console.error("Error mengambil transaksi:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data transaksi' });
    }
};

// FUNGSI BARU UNTUK DASHBOARD
exports.getRecentTransactions = async (req, res) => {
    try {
        // Query ini sekarang menggabungkan (JOIN) tabel transactions dan products
        const query = `
            SELECT 
                t.merchant_ref as reference, 
                p.product_name, 
                t.total_amount, 
                t.status 
            FROM transactions t
            LEFT JOIN products p ON t.product_code = p.product_code
            ORDER BY t.created_at DESC 
            LIMIT 4;
        `;
        const [rows] = await pool.query(query);
        return rows;
    } catch (error) {
        console.error('Error mengambil transaksi terbaru:', error);
        return [];
    }
};