// Routes userValidation

const express = require('express');
const router = express.Router();
const userValidation = require('../controllers/userValidation');

// Validate user
router.post('/', userValidation.validateUser);

module.exports = router;
