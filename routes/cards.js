// Routes Cards

const express = require('express');
const router = express.Router();
const cardsController = require('../controllers/cards');

// Panggil FUNGSI dari middleware kita
const createUploader = require('../middleware/uploadMiddleware');

// BUAT INSTANCE uploader khusus untuk 'card'
const cardUpload = createUploader('card');

// Get Card
router.get('/', cardsController.getCards);

// Search & list
router.get('/search', cardsController.searchCards);

// By identifier & config
router.get('/:identifier', cardsController.getCardByIdentifier);
router.put('/:code/config', cardsController.updateUserInputConfig);

// Create, Update, Delete
router.post('/', cardUpload.single('imageFile'), cardsController.createCard);
router.put('/:originalCode', cardUpload.single('imageFile'), cardsController.updateCard);
router.delete('/:code', cardsController.deleteCard);

// RUTE BARU UNTUK HAPUS MASSAL
router.delete('/bulk-delete', cardsController.deleteBulkCards);

module.exports = router;