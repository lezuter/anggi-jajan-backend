// Routes Transaction

const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactions');
const { protectPage, checkAdmin } = require('../middleware/auth');

// Rute BARU untuk mengambil semua data transaksi (diproteksi)
router.get('/', protectPage, checkAdmin, transactionsController.getAllTransactions);

// Transaction & payment
router.post('/create-transaction', transactionsController.createTransaction);
//router.post('/create-payment', transactions.createPayment);

module.exports = router;
