// Controller Sections

const pool = require('../db/db');

// GET: Ambil daftar section sesuai urutan
exports.getSectionOrder = async (req, res) => {
    try {
        const sql = "SELECT section_name FROM section_order ORDER BY display_order ASC";
        const [sections] = await pool.query(sql);
        res.json({ success: true, data: sections.map(s => s.section_name) });
    } catch (err) {
        console.error('Error fetching section order:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil urutan section' });
    }
};

// POST: Simpan urutan section baru
exports.saveSectionOrder = async (req, res) => {
    const { order } = req.body;
    if (!order || !Array.isArray(order)) {
        return res.status(400).json({ success: false, message: 'Data urutan tidak valid.' });
    }
    try {
        for (let i = 0; i < order.length; i++) {
            await pool.query("UPDATE section_order SET display_order = ? WHERE section_name = ?", [i + 1, order[i]]);
        }
        res.json({ success: true, message: 'Urutan section berhasil disimpan!' });
    } catch (err) {
        console.error('Error saving section order:', err);
        res.status(500).json({ success: false, message: 'Gagal menyimpan urutan section' });
    }
};

// GET: Ambil daftar nama section
exports.getSectionNames = async (req, res) => {
    try {
        const [sections] = await pool.query("SELECT section_name FROM section_order ORDER BY section_name ASC");
        res.json({ success: true, data: sections.map(s => s.section_name) });
    } catch (err) {
        console.error('Error fetching section names:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil nama section' });
    }
};

// GET: Ambil game per section untuk homepage
exports.getSections = async (req, res) => {
    try {
        const [orderedSections] = await pool.query("SELECT section_name FROM section_order ORDER BY display_order ASC");
        const [allCards] = await pool.query("SELECT * FROM cardcontent");

        const response = orderedSections.map(sec => ({
            sectionName: sec.section_name,
            games: allCards.filter(c => c.section === sec.section_name)
        }));

        res.json({ success: true, data: response });
    } catch (err) {
        console.error('Error get sections:', err);
        res.status(500).json({ success: false, message: 'Gagal mengambil section' });
    }
};
