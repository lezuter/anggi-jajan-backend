// Routes Sections

const express = require('express');
const router = express.Router();
const sections = require('../controllers/sections');

// Urutan section
router.get('/order', sections.getSectionOrder);
router.post('/order', sections.saveSectionOrder);

// Nama section
router.get('/names', sections.getSectionNames);

// Section dengan daftar game
router.get('/', sections.getSections);

module.exports = router;
