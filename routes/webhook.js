// Routes Webhook

const express = require('express');
const router = express.Router();
const webhook = require('../controllers/webhook');

// Webhooks
router.post('/digiflazz', webhook.handleDigiflazz); 
router.post('/tripay-callback', webhook.handleTripayCallback);

module.exports = router;
