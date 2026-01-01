// Routes paymentMethods

const express = require('express');
const router = express.Router();
const paymentMethods = require('../controllers/paymentMethods')

router.get('/group-order', paymentMethods.getGroupOrder);
router.post('/group-order', paymentMethods.saveGroupOrder);

// CRUD Payment Methods
router.get('/', paymentMethods.getPaymentMethods);
router.post('/', paymentMethods.createPaymentMethod);
router.put('/:id', paymentMethods.updatePaymentMethod);
router.delete('/:id', paymentMethods.deletePaymentMethod);

// RUTE BARU UNTUK HAPUS MASSAL
router.delete('/bulk-delete', paymentMethods.deleteBulkPaymentMethods);
// RUTE BARU UNTUK TOGGLE STATUS
router.patch('/:id/toggle-status', paymentMethods.toggleActiveStatus);

module.exports = router;
