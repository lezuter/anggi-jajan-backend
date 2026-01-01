// Controllers/admin.js

const pool = require('../db/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Admin login
exports.login = async (req, res) => {
    const email = req.body.email ? req.body.email.toLowerCase().trim() : ''; // <-- UBAH DI SINI
    const password = req.body.password ? req.body.password.trim() : '';
    console.log(`Variabel email berisi: "${email}"`); // Kita pakai tanda kutip untuk melihat spasi
    console.log(`Variabel password berisi: "${password}"`);

    try {
        // --- Langkah 2: Jalankan Query ---
        console.log(`Menjalankan query: SELECT * FROM user WHERE email = '${email}' AND role = 'admin'`);
        const [users] = await pool.query("SELECT * FROM user WHERE email = ? AND role = 'admin'", [email]);

        // --- Langkah 3: Periksa Hasil Query ---
        if (users.length === 0) {
            console.error('HASIL: Query tidak menemukan user. Mengirim "Admin tidak ditemukan".');
            return res.status(401).json({ success: false, message: 'Admin tidak ditemukan' });
        }

        console.log('HASIL: User ditemukan!', users[0]);
        const admin = users[0];

        // --- Langkah 4: Bandingkan Password ---
        console.log('Membandingkan password...');
        const match = await bcrypt.compare(password, admin.password);
        console.log('Hasil perbandingan bcrypt:', match); // Ini harusnya true

        if (!match) {
            console.error('HASIL: Perbandingan password gagal. Mengirim "Password salah".');
            return res.status(401).json({ success: false, message: 'Password salah' });
        }

        // --- Langkah 5: Buat Token ---
        console.log('HASIL: Password cocok! Membuat token...');
        const token = jwt.sign({ name: admin.name, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        // Atur token sebagai cookie di browser
        res.cookie('authToken', token, {
            httpOnly: true, // Penting untuk keamanan, cookie tidak bisa diakses JS di frontend
            secure: false, // Ganti menjadi 'true' jika websitemu sudah menggunakan HTTPS
            sameSite: 'strict', // Pilihan keamanan yang bagus
            maxAge: 24 * 60 * 60 * 1000 // Cookie berlaku selama 1 hari (sesuaikan dengan 'expiresIn' token)
        });

        // Kirim respons sukses beserta tujuan redirect
        return res.json({ success: true, redirect: '/admin' });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// Manual Transaction untuk admin
exports.createManualTransaction = async (req, res) => {
    // Ambil nama admin dari data yang sudah disiapkan oleh middleware protectPage
    const adminName = req.user.name;

    if (!adminName) {
        return res.status(403).json({ success: false, message: 'Akses ditolak. Tidak bisa mengidentifikasi admin.' });
    }

    const { product_code, userInputFields, manual_price } = req.body;
    const { user_id, zone_id } = userInputFields;

    // Gabungkan User ID dan Zone ID (jika ada) untuk disimpan ke DB
    const combinedUserId = zone_id ? `${user_id}(${zone_id})` : user_id;

    // Siapkan customer_no untuk API Digiflazz (tanpa tanda kurung)
    const customerNo = zone_id ? `${user_id}${zone_id}` : user_id;

    const merchantRef = `AJ-${Date.now()}`;
    const digiflazzUsername = process.env.DIGIFLAZZ_USERNAME;
    const digiflazzApiKey = process.env.DIGIFLAZZ_API_KEY;

    // --- (Ini sisa logika signature Digiflazz) ---
    const signature = crypto.createHash('md5')
        .update(digiflazzUsername + digiflazzApiKey + merchantRef) // <-- Gunakan 'digiflazzApiKey'
        .digest('hex');

    const digiflazzPayload = {
        username: digiflazzUsername,
        buyer_sku_code: product_code,
        customer_no: customerNo,
        ref_id: merchantRef,
        sign: signature,
        testing: process.env.DUMMY_MODE === 'true'
    };

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const initialTransaction = {
            merchant_ref: merchantRef,
            product_code: product_code,
            user_id: combinedUserId,
            total_amount: manual_price,
            status: 'PENDING',
            source: 'digiflazz',
            created_by: adminName
        };
        await connection.query("INSERT INTO transactions SET ?", [initialTransaction]);

        // --- (Ini sisa logika fetch ke Digiflazz) ---
        const digiflazzUrl = 'https://api.digiflazz.com/v1/transaction';
        const response = await fetch(digiflazzUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(digiflazzPayload)
        });

        const result = await response.json();
        const responseData = result.data;

        if (responseData.status && (responseData.status === 'Sukses' || responseData.status === 'Pending')) {
            const finalTransactionData = {
                status: responseData.status.toUpperCase(),
                trx_id: responseData.trx_id,
                message: responseData.message,
                sn: responseData.sn || null
            };
            await connection.query("UPDATE transactions SET ? WHERE merchant_ref = ?", [finalTransactionData, merchantRef]);
            await connection.commit();
            res.status(200).json({ success: true, message: `Transaksi Berhasil! Status: ${responseData.status}. SN: ${responseData.sn || 'Menunggu'}` });
        } else {
            const failedTransactionData = {
                status: 'FAILED',
                message: responseData.message || 'Transaksi gagal di Digiflazz.'
            };
            await connection.query("UPDATE transactions SET ? WHERE merchant_ref = ?", [failedTransactionData, merchantRef]);
            await connection.commit();
            res.status(400).json({ success: false, message: `Transaksi Gagal! Pesan: ${responseData.message}` });
        }

    } catch (error) {
        // --- (Ini sisa logika Error handling) ---
        await connection.rollback();
        console.error('Error saat membuat transaksi manual:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan di server.' });
    } finally {
        connection.release();
    }
};

// Fungsi BARU untuk cek saldo Digiflazz
exports.checkDigiflazzBalance = async (req, res) => {
    try {
        const digiflazzUsername = process.env.DIGIFLAZZ_USERNAME;
        const digiflazzApiKey = process.env.DIGIFLAZZ_API_KEY;

        // Signature untuk cek saldo/deposit di Digiflazz adalah username + apiKey + "depo"
        const signature = crypto.createHash('md5')
            .update(digiflazzUsername + digiflazzApiKey + "depo")
            .digest('hex');

        const payload = {
            cmd: 'deposit',
            username: digiflazzUsername,
            sign: signature
        };

        const digiflazzUrl = 'https://api.digiflazz.com/v1/cek-saldo';
        const response = await fetch(digiflazzUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        // Kirim kembali saldo ke frontend
        if (result.data && result.data.deposit !== undefined) {
            res.json({ success: true, balance: result.data.deposit });
        } else {
            throw new Error('Respons dari Digiflazz tidak valid.');
        }

    } catch (error) {
        console.error('Error saat cek saldo Digiflazz:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data saldo.' });
    }
};