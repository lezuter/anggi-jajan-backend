// Controller Webhook

const crypto = require('crypto');
const pool = require('../db/db');

let io;
exports.init = (socketIoInstance) => {
    io = socketIoInstance;
};

exports.handleDigiflazz = async (req, res) => { // <-- Diganti dari handleTokoVoucher
    const signature = req.headers['x-hub-signature'];
    const webhookSecret = process.env.DIGIFLAZZ_WEBHOOK_SECRET;

    const calculatedSignature = 'sha1=' + crypto.createHmac('sha1', webhookSecret).update(JSON.stringify(req.body)).digest('hex');
    if (signature !== calculatedSignature) {
        return res.status(403).json({ success: false, message: 'Invalid signature.' });
    }

    const { ref_id, status, message, sn } = req.body.data;

    try {
        const updatedData = {
            status: status.toUpperCase(),
            message: message,
            sn: sn || null
        };
        
        await pool.query("UPDATE transactions SET ? WHERE merchant_ref = ?", [updatedData, ref_id]);

        if (io) {
            io.emit('admin_notification', {
                message: `Transaksi ${ref_id} telah diupdate!`,
                details: `Status: ${status}, SN: ${sn || 'N/A'}`
            });
        }
        
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ success: false });
    }
};

// Handle Tripay callback
exports.handleTripayCallback = async (req, res) => {
    try {
        const data = req.body;
        console.log("Webhook Tripay:", data);

        await pool.query("UPDATE transactions SET status = ? WHERE trx_id = ?", [data.status, data.merchant_ref]);

        res.json({ success: true, message: "Callback Tripay diterima" });
    } catch (err) {
        console.error("Tripay callback error:", err);
        res.status(500).json({ success: false, message: "Gagal proses callback Tripay" });
    }
};
