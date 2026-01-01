// Routes Admin

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');

// =======================================================
// == 1. PANGGIL "SATPAM"-NYA DI SINI ==
// =======================================================
const { protectPage, checkAdmin } = require('../middleware/auth');

// Rute login TIDAK perlu dijaga, karena ini adalah pintu masuk utama
router.post('/login', adminController.login);

// Rute untuk cek saldo (wajib diproteksi)
router.get('/balance', protectPage, checkAdmin, adminController.checkDigiflazzBalance);

// Rute ini WAJIB dijaga, hanya admin yang sudah login yang boleh akses
router.post('/manual-transaction', protectPage, checkAdmin, adminController.createManualTransaction);

module.exports = router;