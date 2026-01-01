// File: middleware/uploadMiddleware.js

const multer = require('multer');
const path = require('path');

// Fungsi ini akan menjadi middleware kita
const createUploader = (folderName) => {
    // Tentukan lokasi penyimpanan berdasarkan parameter 'folderName'
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            // Path tujuan sekarang dinamis sesuai folderName yang diberikan
            const uploadPath = path.join(__dirname, `../public/images/${folderName}`);
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            // Membuat nama file yang unik
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    const fileFilter = (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
        }
    };

    // Kembalikan middleware multer yang sudah dikonfigurasi
    return multer({ storage: storage, fileFilter: fileFilter });
};

module.exports = createUploader;