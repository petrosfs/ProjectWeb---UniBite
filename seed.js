// seed.js — Δημιουργεί τον Admin χρήστη
// Εκτέλεσε: node seed.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  const email    = 'admin@unibite.gr';
  const password = 'admin123';
  const hash     = await bcrypt.hash(password, 10);

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existing.length > 0) {
      console.log('✓ Admin ήδη υπάρχει:', email);
    } else {
      await db.query(
        'INSERT INTO users (name, email, password_hash, role, credits) VALUES (?, ?, ?, ?, ?)',
        ['Admin', email, hash, 'admin', 0]
      );
      console.log('✓ Admin δημιουργήθηκε!');
      console.log('  Email:    ', email);
      console.log('  Password: ', password);
      console.log('  ⚠️  Άλλαξε τον κωδικό μετά την πρώτη σύνδεση!');
    }
  } catch (err) {
    console.error('Σφάλμα:', err.message);
  } finally {
    process.exit(0);
  }
}

seed();
