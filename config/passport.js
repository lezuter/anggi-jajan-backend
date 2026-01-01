// config/passport.js

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../db/db'); // Panggil koneksi database Anda

module.exports = function(passport) {

  // Konfigurasi Strategi Google
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID, // Ambil dari .env
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Ambil dari .env
      callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      // Logika untuk mencari atau membuat user baru setelah berhasil login dengan Google
      const { id, displayName, emails } = profile;
      const email = emails[0].value;

      try {
        // Cek apakah user dengan google_id ini sudah ada di database
        let [rows] = await pool.query("SELECT * FROM user WHERE google_id = ?", [id]);
        
        if (rows.length > 0) {
          // Jika user sudah ada, langsung kembalikan datanya
          const user = rows[0];
          console.log('User ditemukan:', user);
          return done(null, user);
        } else {
          // Jika user belum ada, buat user baru
          // CATATAN: Tabel 'user' Anda tidak punya kolom password, jadi kita tidak set.
          const newUser = {
            google_id: id,
            name: displayName,
            email: email,
            role: 'user' // Atur role default untuk user baru
          };
          
          // Masukkan user baru ke database
          await pool.query("INSERT INTO user SET ?", [newUser]);
          console.log('User baru dibuat:', newUser);
          
          // Ambil kembali data user yang baru dibuat untuk mendapatkan semua field
          [rows] = await pool.query("SELECT * FROM user WHERE google_id = ?", [id]);
          const user = rows[0];
          return done(null, user);
        }
      } catch (err) {
        console.error('Error di strategi Passport:', err);
        return done(err, null);
      }
    }
  ));

  // =======================================================
  // == BAGIAN YANG DIPERBAIKI (SERIALIZE) ==
  // =======================================================
  // Menyimpan EMAIL user ke dalam session, bukan ID
  passport.serializeUser((user, done) => {
    done(null, user.email); 
  });

  // =======================================================
  // == BAGIAN YANG DIPERBAIKI (DESERIALIZE) ==
  // =======================================================
  // Mengambil data lengkap user dari session menggunakan EMAIL
  passport.deserializeUser(async (email, done) => {
    try {
      // Cari user di database berdasarkan EMAIL yang disimpan di session
      const [rows] = await pool.query("SELECT * FROM user WHERE email = ?", [email]);
      
      if (rows.length > 0) {
        const user = rows[0];
        done(null, user); // User ditemukan, akan dilampirkan ke req.user
      } else {
        done(null, false); // User tidak ditemukan
      }
    } catch (err) {
      done(err, null);
    }
  });

};