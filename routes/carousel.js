// Routes Carousel

const express = require('express');
const router = express.Router();
const carouselController = require('../controllers/carousel');
const createUploader = require('../middleware/uploadMiddleware');

// Membuat instance uploader khusus untuk carousel
const carouselUpload = createUploader('carousel');

// Rute untuk publik (tidak butuh middleware)
router.get('/public', carouselController.getPublicCarousels);

// Rute untuk admin panel
router.get('/', carouselController.getCarousels);
router.post('/order', carouselController.saveCarouselOrder);

// Rute CRUD yang butuh upload file
router.post('/', carouselUpload.single('imageFile'), carouselController.createCarousel);
router.put('/:id', carouselUpload.single('imageFile'), carouselController.updateCarousel);
router.delete('/:id', carouselController.deleteCarousel);

// RUTE BARU UNTUK HAPUS MASSAL
router.delete('/bulk-delete', carouselController.deleteBulkCarousels);

module.exports = router;