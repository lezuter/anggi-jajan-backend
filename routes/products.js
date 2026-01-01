// Routes Products

const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products');

// 1. Panggil FUNGSI dari SATU file middleware andalan kita
const createUploader = require('../middleware/uploadMiddleware');

// 2. BUAT INSTANCE uploader khusus untuk 'product'
const productUpload = createUploader('product');

// Search & list (tidak butuh upload)
router.get('/search', productsController.searchProducts);
router.get('/by-code/:code', productsController.getProductsByGameCode);
router.get('/:gameSlug', productsController.getProductsByGameSlug);
router.get('/', productsController.getProducts);

// CRUD (butuh upload)
// 3. GUNAKAN 'productUpload' di sini
router.post('/', productUpload.single('image'), productsController.createProduct);
router.put('/:id', productUpload.single('image'), productsController.updateProduct);
router.delete('/:id', productsController.deleteProduct);
router.put('/:id', productUpload.single('image'), productsController.updateProduct);

// RUTE BARU UNTUK HAPUS MASSAL
router.delete('/bulk-delete', productsController.deleteBulkProducts);

module.exports = router;