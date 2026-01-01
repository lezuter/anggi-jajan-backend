// Routes auth

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authController = require('../controllers/auth');

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: false, // ganti true kalau pakai HTTPS
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000
    });

    return res.json({ success: true, redirect: '/dashboard' });
  }

  res.status(401).json({ success: false, message: 'Email atau password salah' });
});

router.post('/logout', (req, res) => {
  res.clearCookie('authToken', { httpOnly: true, sameSite: 'strict' });
  res.json({ success: true, message: 'Logout berhasil' });
});

const passport = require('passport');

// Rute ini akan mengarahkan user ke halaman login Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Rute ini akan menangani callback setelah user login di Google
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Jika berhasil, arahkan ke halaman utama atau dashboard
    res.redirect('/id');
  }
);

// Rute Logout (bisa untuk semua user)
router.post('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ success: true, message: 'Logout berhasil' });
});

module.exports = router;
