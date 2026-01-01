// Controller userValidation

const db = require("../db/db");

exports.validateUser = async (req, res) => {
  try {
    const { userId, zoneId, serverId, slug } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "UserID wajib diisi" });
    }

    // Ambil buyer_sku_code dari DB (kalau ada slug)
    let buyerSkuCode = null;
    if (slug) {
      const [rows] = await db.query(
        "SELECT buyer_sku_code FROM cardcontent WHERE slug = ? LIMIT 1",
        [slug]
      );
      if (rows.length && rows[0].buyer_sku_code) {
        buyerSkuCode = rows[0].buyer_sku_code;
      }
    }

    // Bangun customerNo
    let customerNo = userId;
    if (zoneId) customerNo = `${userId},${zoneId}`;
    if (serverId) customerNo = `${userId},${serverId}`;

    // Kalau buyer_sku_code kosong ? dummy langsung
    if (!buyerSkuCode || process.env.DUMMY_MODE === "true") {
      return res.json({
        success: true,
        nickname: `DummyNick_${userId}`,
        customerNo: customerNo,
        buyerSkuCode: buyerSkuCode || null
      });
    }

    // === Kalau nanti udah live Digiflazz, logic asli masuk sini ===
    // request ke Digiflazz ...

  } catch (err) {
    console.error("? Error validate-user:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
