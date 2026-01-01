// =======================================================
// ==                 ANGGIJAJAN API SERVER               ==
// =======================================================

require('dotenv').config();
// Impor controller dan database di bagian atas file
const transactionsController = require('./controllers/transactions');
const pool = require('./db/db');
// --- 1. MODUL-MODUL YANG DIBUTUHKAN ---
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const { protectPage, checkAdmin, redirectIfLoggedIn } = require('./middleware/auth');
const session = require('express-session');
const passport = require('passport');

// --- 2. INISIALISASI EXPRESS, SERVER HTTP, DAN SOCKET.IO ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// --- 3. MIDDLEWARE & SETUP VIEW ENGINE ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

// Konfigurasi Session untuk Passport.js
app.use(session({
  secret: process.env.SESSION_SECRET, // Buat variabel ini di .env
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Ganti ke 'true' jika sudah HTTPS
}));

// Inisialisasi Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Panggil dan jalankan file konfigurasi Passport kita
require('./config/passport')(passport);

// Konfigurasi EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- 4. MENYAJIKAN FILE STATIS (CSS, JS, GAMBAR) ---
app.use(express.static(path.join(__dirname, 'public')));

// --- 5. MENGHUBUNGKAN SEMUA RUTE API ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/carousel', require('./routes/carousel'));
app.use('/api/payment-methods', require('./routes/paymentMethods'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sections', require('./routes/sections'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/user-validation', require('./routes/userValidation'));
app.use('/api/webhook', require('./routes/webhook'));

// --- 6. RUTE UNTUK HALAMAN PUBLIK (EJS) ---
app.get('/id', (req, res) => {
  res.render('public/index'); // Menggunakan struktur folder views/index.ejs
});

// order dengan slug
app.get('/order/:slug', (req, res) => {
  const slug = req.params.slug;
  res.render('public/order', { slug });
});

app.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('public/login');
});

// --- 7. RUTE UNTUK HALAMAN ADMIN YANG DILINDUNGI ---
app.get('/admin', protectPage, checkAdmin, async (req, res) => {
  try {
    // 1. Ambil 4 transaksi terakhir
    const recentTransactions = await transactionsController.getRecentTransactions();

    // 2. Ambil total produk
    const [productRows] = await pool.query("SELECT COUNT(id) as totalProducts FROM products");
    const totalProducts = productRows[0].totalProducts;

    // 3. Ambil total transaksi
    const [transRows] = await pool.query("SELECT COUNT(id) as totalTransactions FROM transactions");
    const totalTransactions = transRows[0].totalTransactions;

    // 4. Kirim semua data ke EJS
    res.render('private/dashboard', {
      body: 'dashboard',
      user: req.user,
      recentTransactions: recentTransactions,
      stats: {
        totalProducts: totalProducts,
        totalTransactions: totalTransactions
      }
    });

  } catch (error) {
    console.error("Error di rute /admin:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Rute untuk halaman Cards
app.get('/admin/cards', protectPage, checkAdmin, (req, res) => {
  res.render('private/dashboard', { 
    body: 'cards',
    user: req.user 
  }); 
});

// Rute untuk halaman Products
app.get('/admin/products', protectPage, checkAdmin, (req, res) => {
  res.render('private/dashboard', { 
    body: 'products',
    user: req.user 
  }); 
});

// Rute untuk halaman Carousel
app.get('/admin/carousel', protectPage, checkAdmin, (req, res) => {
  res.render('private/dashboard', { 
    body: 'carousel',
    user: req.user 
  }); 
});

// Rute untuk halaman Payment
app.get('/admin/payment', protectPage, checkAdmin, (req, res) => {
  res.render('private/dashboard', { 
    body: 'payment',
    user: req.user 
  }); 
});

// Rute untuk halaman Jajan
app.get('/admin/jajan', protectPage, checkAdmin, (req, res) => {
  res.render('private/dashboard', { 
    body: 'jajan',
    user: req.user 
  }); 
});

// Rute untuk halaman Transaksi
app.get('/admin/transactions', protectPage, checkAdmin, (req, res) => {
  res.render('private/dashboard', { 
    body: 'transactions',
    user: req.user 
  }); 
});

// --- 8. LOGIKA KONEKSI SOCKET.IO ---
io.on('connection', (socket) => {
  console.log(`?? User baru terhubung via Socket.IO: ${socket.id}`);

  socket.on('join_transaction_room', (transactionId) => {
    socket.join(transactionId);
    console.log(`Socket ${socket.id} bergabung ke room notifikasi: ${transactionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`?? User terputus: ${socket.id}`);
  });
});

// --- 9. ERROR HANDLER (PENANGANAN ERROR) ---
app.use((err, req, res, next) => {
  console.error('Terjadi Error Tak Terduga:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// --- 10. MENJALANKAN SERVER ---
server.listen(PORT, '0.0.0.0', () =>
  console.log(`?? Server berjalan dengan Socket.IO di http://0.0.0.0:${PORT}`)
);