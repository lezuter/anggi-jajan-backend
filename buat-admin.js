const bcrypt = require('bcrypt');
const readline = require('readline');

// Membuat interface untuk membaca input dari terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const saltRounds = 10;

// Script akan bertanya di terminal
rl.question('Masukkan password admin baru: ', (passwordAsli) => {
  if (!passwordAsli) {
    console.error("\nPassword tidak boleh kosong!");
    rl.close();
    return;
  }
  
  console.log("\nMembuat hash, mohon tunggu...");

  bcrypt.hash(passwordAsli, saltRounds, (err, hash) => {
    if (err) {
        console.error("Gagal membuat hash:", err);
    } else {
        console.log("\n? HASH BERHASIL DIBUAT!");
        console.log("Salin (copy) seluruh baris hash di bawah ini:");
        console.log("================================================");
        console.log(hash); 
        console.log("================================================");
    }
    // Menutup interface input
    rl.close();
  });
});