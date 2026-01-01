// File: controllers/cards.js

const pool = require('../db/db');
const path = require('path');
const fs = require('fs');

// Fungsi utama untuk mengambil data dengan pagination dan search
exports.getCards = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    try {
        const countParams = [];
        const dataParams = [];
        let whereClause = '';

        if (search) {
            whereClause = " WHERE name LIKE ?";
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm);
            dataParams.push(searchTerm);
        }

        const countQuery = `SELECT COUNT(*) as total FROM cardcontent${whereClause}`;
        const [totalRows] = await pool.query(countQuery, countParams);
        const totalItems = totalRows[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        dataParams.push(limit, offset);
        const dataQuery = `SELECT * FROM cardcontent${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`;
        const [cards] = await pool.query(dataQuery, dataParams);

        res.json({
            success: true,
            data: cards,
            pagination: { currentPage: page, totalPages: totalPages, totalItems: totalItems }
        });

    } catch (error) {
        console.error("Error getCards:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data cards' });
    }
};

exports.searchCards = async (req, res) => {
    const { q } = req.query;
    try {
        const [rows] = await pool.query("SELECT * FROM cardcontent WHERE name LIKE ?", [`%${q}%`]);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("Search cards error:", err);
        res.status(500).json({ success: false, message: "Gagal mencari card" });
    }
};

exports.getCardByIdentifier = async (req, res) => {
    try {
        const identifier = req.params.identifier;
        const [results] = await pool.query("SELECT * FROM cardcontent WHERE slug = ? OR code = ?", [identifier, identifier]);
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: `Game '${identifier}' tidak ditemukan.` });
        }
        const gameData = results[0];
        const [configResult] = await pool.query('SELECT input_fields FROM userid_input_config WHERE game_code = ?', [gameData.code]);
        gameData.input_fields = configResult.length > 0 ? configResult[0].input_fields : '[]';
        res.json({ success: true, data: gameData });
    } catch (err) {
        console.error("Get card by identifier error:", err);
        res.status(500).json({ success: false, message: "Gagal mengambil card" });
    }
};

// =======================================================
// == FUNGSI YANG HILANG SEBELUMNYA, SEKARANG ADA LAGI ==
// =======================================================
exports.getUserIdInputConfig = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT input_fields FROM userid_input_config WHERE game_code = ?",
            [req.params.code]
        );
        if (rows.length === 0) {
            return res.json({ success: true, data: "[]" });
        }
        res.json({ success: true, data: rows[0].input_fields || "[]" });
    } catch (err) {
        console.error("Get config error:", err);
        res.status(500).json({ success: false, message: "Gagal mengambil config" });
    }
};

exports.updateUserInputConfig = async (req, res) => {
    const { code } = req.params;
    const { config } = req.body; // Mengambil data config dari body

    if (typeof config === 'undefined') {
        return res.status(400).json({ success: false, message: 'Data config tidak ditemukan.' });
    }

    try {
        // Query ini akan meng-update jika game_code sudah ada, atau membuat baru jika belum ada
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

// Fungsi Create, Update, Delete
const generateSmartCode = (name) => {
    // 1. Bersihin nama (Hapus simbol, jadiin huruf besar)
    const cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase().trim();
    
    // 2. Pecah jadi kata-kata
    const words = cleanName.split(/\s+/); 

    if (words.length === 1) {
        // Kalau cuma 1 kata (misal: Indosat), ambil FULL
        return cleanName; 
    } else {
        // Kalau banyak kata (misal: PUBG Mobile), ambil HURUF DEPANNYA AJA
        return words.map(w => w[0]).join('');
    }
};

exports.createCard = async (req, res) => {
    const { name, section, publisher, description, actionType } = req.body;

    // 1. Generate SLUG (buat URL) -> "pubg-mobile"
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    // 2. Generate CODE (Singkatan Pintar) -> "PM" atau "PUBGM"
    const baseCode = generateSmartCode(name);

    let finalSlug = baseSlug;
    let finalCode = baseCode;

    try {
        // --- CEK DUPLIKAT DATA ---
        // Kita cek dulu apakah nama gamenya udah ada persis?
        const [exactMatch] = await pool.query("SELECT * FROM cardcontent WHERE name = ?", [name]);

        // Kalau ada DAN user belum kasih konfirmasi (overwrite/new)
        if (exactMatch.length > 0 && !actionType) {
            return res.status(409).json({ 
                success: false, 
                code: 'DUPLICATE_NAME',
                message: `Game "${name}" sudah ada!`,
                existingData: exactMatch[0]
            });
        }

        // --- LOGIC PENYIMPANAN ---
        if (actionType === 'overwrite') {
            // CASE A: TIMPA DATA LAMA
            const existingId = exactMatch[0].id;
            const updateData = {
                section,
                publisher,
                description,
                slug: finalSlug, // Update slug biar sinkron
                code: finalCode  // Update code biar sinkron
            };
            if (req.file) updateData.image = req.file.filename;

            await pool.query("UPDATE cardcontent SET ? WHERE id = ?", [updateData, existingId]);
            return res.json({ success: true, message: 'Data berhasil diperbarui (Overwrite)!' });

        } else {
            // CASE B: BUAT DATA BARU (AUTO NUMBER JIKA CODE BENTROK)
            let counter = 1;
            let isUnique = false;

            // Loop sampai nemu Code & Slug yang belum dipake
            while (!isUnique) {
                const [existing] = await pool.query(
                    "SELECT id FROM cardcontent WHERE slug = ? OR code = ?", 
                    [finalSlug, finalCode]
                );
                
                if (existing.length === 0) {
                    isUnique = true; // Aman, gak ada yang sama
                } else {
                    // Kalau nabrak, tambahin angka (Misal: PM1, PM2)
                    finalSlug = `${baseSlug}-${counter}`;
                    finalCode = `${baseCode}${counter}`;
                    counter++;
                }
            }

            const newCardData = {
                name,
                section,
                publisher,
                description,
                slug: finalSlug,
                code: finalCode, // <-- Nah, sekarang ini isinya singkatan, bukan slug lagi
                image: req.file ? req.file.filename : null,
            };

            await pool.query("INSERT INTO cardcontent SET ?", [newCardData]);
            
            return res.status(201).json({ 
                success: true, 
                message: `Berhasil! Code: ${finalCode}` 
            });
        }

    } catch (error) {
        console.error('Error createCard:', error);
        res.status(500).json({ success: false, message: 'Gagal memproses database.' });
    }
};

exports.updateCard = async (req, res) => {
    const { originalCode } = req.params;
    const { name, section, publisher, description, oldImage } = req.body;
    const updatedCardData = {
        name,
        section,
        publisher,
        description,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    };
    if (req.file) {
        updatedCardData.image = req.file.filename;
        if (oldImage) {
            const oldImagePath = path.join(__dirname, '../public/images/card', oldImage);
            fs.unlink(oldImagePath, (err) => {
                if (err) console.error("Gagal hapus gambar lama:", err);
            });
        }
    }
    try {
        await pool.query("UPDATE cardcontent SET ? WHERE code = ?", [updatedCardData, originalCode]);
        res.json({ success: true, message: `Card ${originalCode} berhasil diperbarui.` });
    } catch (error) {
        console.error('Error saat update card:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui card.' });
    }
};

exports.deleteCard = async (req, res) => {
    const { code } = req.params;
    try {
        const [rows] = await pool.query("SELECT image FROM cardcontent WHERE code = ?", [code]);
        await pool.query("DELETE FROM cardcontent WHERE code = ?", [code]);
        if (rows.length > 0 && rows[0].image) {
            const imagePath = path.join(__dirname, '../public/images/card', rows[0].image);
            fs.unlink(imagePath, (err) => {
                if (err) console.error("Gagal hapus file gambar terkait:", err);
            });
        }
        res.json({ success: true, message: `Card ${code} berhasil dihapus.` });
    } catch (error) {
        console.error('Error saat menghapus card:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus card.' });
    }
};

// FUNGSI BARU UNTUK HAPUS MASSAL
exports.deleteBulkCards = async (req, res) => {
    const { ids } = req.body; // ids adalah array: [1, 2, 3]
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'ID tidak valid.' });
    }

    try {
        // Ambil nama file gambar sebelum dihapus
        const [rows] = await pool.query("SELECT image FROM cardcontent WHERE id IN (?)", [ids]);

        // Hapus data dari database
        const [deleteResult] = await pool.query("DELETE FROM cardcontent WHERE id IN (?)", [ids]);

        if (deleteResult.affectedRows > 0) {
            // Hapus file gambar terkait
            rows.forEach(row => {
                if (row.image) {
                    const imagePath = path.join(__dirname, '../public/images/card', row.image);
                    fs.unlink(imagePath, (err) => {
                        if (err) console.error("Gagal hapus file gambar:", err);
                    });
                }
            });
            res.json({ success: true, message: `${deleteResult.affectedRows} item berhasil dihapus.` });
        } else {
            res.status(404).json({ success: false, message: 'Tidak ada item yang ditemukan untuk dihapus.' });
        }
    } catch (error) {
        console.error('Error saat hapus massal:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus data.' });
    }
};