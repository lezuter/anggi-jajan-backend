// Routes Users

const express = require('express');
const router = express.Router();
const users = require('../controllers/users');

// Contoh basic endpoint user (bisa ditambah sesuai kebutuhan)
router.get('/', users.getAllUsers);
router.get('/:id', users.getUserById);
router.post('/', users.createUser);
router.put('/:id', users.updateUser);
router.delete('/:id', users.deleteUser);

module.exports = router;
