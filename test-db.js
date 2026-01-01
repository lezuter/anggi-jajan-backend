require('dotenv').config();
const mysql = require('mysql2/promise'); // pastikan pake /promise

async function testDB() {
  try {
    const db = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const [rows] = await db.query('SHOW TABLES;');
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testDB();
