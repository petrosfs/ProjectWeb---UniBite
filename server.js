// server.js — UniBite Backend
require('dotenv').config();

const express  = require('express');
const session  = require('express-session');
const bcrypt   = require('bcryptjs');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const db       = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Uploads folder ───────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret:            process.env.SESSION_SECRET || 'unibite-dev-secret',
  resave:            false,
  saveUninitialized: false,
  cookie:            { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 μέρες
}));

// ─── Multer (φωτογραφίες αγγελιών) ────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/image\/(jpeg|png|webp|gif)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Μόνο εικόνες επιτρέπονται'));
  },
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Απαιτείται σύνδεση' });
  next();
};
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.session.role))
    return res.status(403).json({ error: 'Δεν έχετε δικαίωμα' });
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: 'Συμπλήρωσε όλα τα πεδία' });
  if (!['cook', 'consumer'].includes(role))
    return res.status(400).json({ error: 'Μη έγκυρος ρόλος' });

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Το email χρησιμοποιείται ήδη' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role, credits) VALUES (?, ?, ?, ?, 5)',
      [name, email, hash, role]
    );

    req.session.userId = result.insertId;
    req.session.role   = role;
    res.json({ id: result.insertId, name, role, credits: 5 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Συμπλήρωσε email και κωδικό' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Λανθασμένα στοιχεία' });

    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Λανθασμένα στοιχεία' });

    req.session.userId = user.id;
    req.session.role   = user.role;
    res.json({ id: user.id, name: user.name, role: user.role, credits: user.credits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, name, email, role, credits FROM users WHERE id = ?',
    [req.session.userId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Χρήστης δεν βρέθηκε' });
  res.json(rows[0]);
});

// ─────────────────────────────────────────────────────────────────────────────
// ALLERGENS
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/allergens', async (_req, res) => {
  const [rows] = await db.query('SELECT * FROM allergens ORDER BY name');
  res.json(rows);
});

// ─────────────────────────────────────────────────────────────────────────────
// LISTINGS
// ─────────────────────────────────────────────────────────────────────────────

// Δημόσιο feed — μόνο μη-ληγμένες αγγελίες
app.get('/api/listings', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*,
             u.name AS cook_name,
             GROUP_CONCAT(DISTINCT a.id   ORDER BY a.id SEPARATOR ',') AS allergen_ids,
             GROUP_CONCAT(DISTINCT a.name ORDER BY a.id SEPARATOR '||') AS allergen_names
      FROM listings l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN listing_allergens la ON la.listing_id = l.id
      LEFT JOIN allergens a          ON a.id = la.allergen_id
      WHERE l.expires_at > NOW()
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Μία συγκεκριμένη αγγελία
app.get('/api/listings/:id', requireAuth, async (req, res) => {
  const [rows] = await db.query(`
    SELECT l.*, u.name AS cook_name,
           GROUP_CONCAT(DISTINCT a.id   ORDER BY a.id SEPARATOR ',') AS allergen_ids,
           GROUP_CONCAT(DISTINCT a.name ORDER BY a.id SEPARATOR '||') AS allergen_names
    FROM listings l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN listing_allergens la ON la.listing_id = l.id
    LEFT JOIN allergens a          ON a.id = la.allergen_id
    WHERE l.id = ?
    GROUP BY l.id
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Δεν βρέθηκε' });
  res.json(rows[0]);
});

// Αγγελίες του μάγειρα (ΟΛΑ, ακόμα και ληγμένα — για dashboard)
app.get('/api/my/listings', requireAuth, requireRole('cook'), async (req, res) => {
  const [rows] = await db.query(`
    SELECT l.*,
           GROUP_CONCAT(DISTINCT a.name ORDER BY a.id SEPARATOR ', ') AS allergen_names
    FROM listings l
    LEFT JOIN listing_allergens la ON la.listing_id = l.id
    LEFT JOIN allergens a          ON a.id = la.allergen_id
    WHERE l.user_id = ?
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `, [req.session.userId]);
  res.json(rows);
});

// Δημιουργία αγγελίας
app.post('/api/listings', requireAuth, requireRole('cook'), upload.single('photo'), async (req, res) => {
  const { title, notes, portions, location, lat, lng, pickup_time, allergen_ids } = req.body;
  if (!title || !portions || !location || !pickup_time)
    return res.status(400).json({ error: 'Λείπουν υποχρεωτικά πεδία' });

  try {
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const [result] = await db.query(
      `INSERT INTO listings
         (user_id, title, notes, portions_total, portions_available, location, lat, lng, pickup_time, photo_url, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.session.userId, title, notes || null, portions, portions, location,
       lat || null, lng || null, pickup_time, photoUrl, expiresAt]
    );

    // Αλλεργιογόνα
    if (allergen_ids) {
      const ids = [].concat(allergen_ids);
      for (const aid of ids) {
        await db.query('INSERT IGNORE INTO listing_allergens (listing_id, allergen_id) VALUES (?, ?)',
          [result.insertId, aid]);
      }
    }

    res.json({ id: result.insertId, message: 'Η αγγελία δημιουργήθηκε!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Επεξεργασία αγγελίας
app.put('/api/listings/:id', requireAuth, requireRole('cook'), upload.single('photo'), async (req, res) => {
  const { title, notes, location, lat, lng, pickup_time, allergen_ids } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT * FROM listings WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Δεν βρέθηκε ή δεν ανήκει σε εσένα' });

    const old      = rows[0];
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : old.photo_url;

    await db.query(
      `UPDATE listings
       SET title=?, notes=?, location=?, lat=?, lng=?, pickup_time=?, photo_url=?
       WHERE id=?`,
      [title || old.title, notes ?? old.notes, location || old.location,
       lat ?? old.lat, lng ?? old.lng, pickup_time || old.pickup_time, photoUrl, req.params.id]
    );

    // Ενημέρωση αλλεργιογόνων
    if (allergen_ids !== undefined) {
      await db.query('DELETE FROM listing_allergens WHERE listing_id = ?', [req.params.id]);
      const ids = [].concat(allergen_ids).filter(Boolean);
      for (const aid of ids) {
        await db.query('INSERT IGNORE INTO listing_allergens (listing_id, allergen_id) VALUES (?, ?)',
          [req.params.id, aid]);
      }
    }

    res.json({ message: 'Η αγγελία ενημερώθηκε' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Διαγραφή αγγελίας
app.delete('/api/listings/:id', requireAuth, requireRole('cook'), async (req, res) => {
  const [rows] = await db.query(
    'SELECT id FROM listings WHERE id = ? AND user_id = ?',
    [req.params.id, req.session.userId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Δεν βρέθηκε ή δεν ανήκει σε εσένα' });

  await db.query('DELETE FROM listings WHERE id = ?', [req.params.id]);
  res.json({ message: 'Η αγγελία διαγράφηκε' });
});

// ─────────────────────────────────────────────────────────────────────────────
// REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

// Καταναλωτής κάνει αίτημα
app.post('/api/listings/:id/requests', requireAuth, requireRole('consumer'), async (req, res) => {
  try {
    // Έλεγχος πόντων
    const [userRows] = await db.query('SELECT credits FROM users WHERE id = ?', [req.session.userId]);
    if (userRows[0].credits < 1)
      return res.status(400).json({ error: 'Δεν έχεις αρκετούς πόντους (χρειάζεσαι τουλάχιστον 1)' });

    // Έλεγχος αγγελίας
    const [listingRows] = await db.query(
      'SELECT * FROM listings WHERE id = ? AND expires_at > NOW() AND portions_available > 0',
      [req.params.id]
    );
    if (!listingRows.length) return res.status(400).json({ error: 'Η αγγελία δεν είναι διαθέσιμη' });
    if (listingRows[0].user_id === req.session.userId)
      return res.status(400).json({ error: 'Δεν μπορείς να αιτηθείς τη δική σου αγγελία' });

    // Υπάρχον αίτημα;
    const [existing] = await db.query(
      "SELECT id FROM requests WHERE listing_id=? AND consumer_id=? AND status IN ('pending','approved')",
      [req.params.id, req.session.userId]
    );
    if (existing.length) return res.status(400).json({ error: 'Έχεις ήδη αίτημα για αυτή την αγγελία' });

    // Δημιουργία + αφαίρεση 1 πόντου
    const [result] = await db.query(
      "INSERT INTO requests (listing_id, consumer_id) VALUES (?, ?)",
      [req.params.id, req.session.userId]
    );
    await db.query('UPDATE users SET credits = credits - 1 WHERE id = ?', [req.session.userId]);

    res.json({ id: result.insertId, message: 'Το αίτημά σου στάλθηκε!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Αιτήματα καταναλωτή
app.get('/api/my/requests', requireAuth, requireRole('consumer'), async (req, res) => {
  const [rows] = await db.query(`
    SELECT r.*,
           l.title, l.location, l.pickup_time, l.photo_url,
           u.name AS cook_name,
           rt.stars AS my_rating
    FROM requests r
    JOIN listings l ON r.listing_id = l.id
    JOIN users u    ON l.user_id = u.id
    LEFT JOIN ratings rt ON rt.request_id = r.id
    WHERE r.consumer_id = ?
    ORDER BY r.created_at DESC
  `, [req.session.userId]);
  res.json(rows);
});

// Αιτήματα που λαμβάνει ο μάγειρας
app.get('/api/cook/requests', requireAuth, requireRole('cook'), async (req, res) => {
  const [rows] = await db.query(`
    SELECT r.*, l.title, l.id AS listing_id,
           u.name AS consumer_name, u.email AS consumer_email,
           rt.stars AS rating
    FROM requests r
    JOIN listings l ON r.listing_id = l.id
    JOIN users u    ON r.consumer_id = u.id
    LEFT JOIN ratings rt ON rt.request_id = r.id
    WHERE l.user_id = ?
    ORDER BY r.created_at DESC
  `, [req.session.userId]);
  res.json(rows);
});

// Αποδοχή αιτήματος
app.put('/api/requests/:id/approve', requireAuth, requireRole('cook'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, l.portions_available, l.id AS lid
      FROM requests r
      JOIN listings l ON r.listing_id = l.id
      WHERE r.id = ? AND l.user_id = ? AND r.status = 'pending'
    `, [req.params.id, req.session.userId]);

    if (!rows.length) return res.status(404).json({ error: 'Δεν βρέθηκε ή δεν εκκρεμεί' });
    if (rows[0].portions_available <= 0) return res.status(400).json({ error: 'Δεν υπάρχουν διαθέσιμες μερίδες' });

    await db.query("UPDATE requests SET status='approved' WHERE id=?", [req.params.id]);
    await db.query('UPDATE listings SET portions_available = portions_available - 1 WHERE id=?', [rows[0].lid]);

    res.json({ message: 'Αποδεκτό!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Απόρριψη αιτήματος — επιστροφή πόντου
app.put('/api/requests/:id/reject', requireAuth, requireRole('cook'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.consumer_id FROM requests r
      JOIN listings l ON r.listing_id = l.id
      WHERE r.id = ? AND l.user_id = ? AND r.status = 'pending'
    `, [req.params.id, req.session.userId]);

    if (!rows.length) return res.status(404).json({ error: 'Δεν βρέθηκε' });

    await db.query("UPDATE requests SET status='rejected' WHERE id=?", [req.params.id]);
    // Επιστροφή πόντου
    await db.query('UPDATE users SET credits = credits + 1 WHERE id=?', [rows[0].consumer_id]);

    res.json({ message: 'Απορρίφθηκε (ο πόντος επεστράφη)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Επιτυχής παραλαβή — ο μάγειρας κερδίζει 1 βασικό πόντο
app.put('/api/requests/:id/pickup', requireAuth, requireRole('cook'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.* FROM requests r
      JOIN listings l ON r.listing_id = l.id
      WHERE r.id = ? AND l.user_id = ? AND r.status = 'approved'
    `, [req.params.id, req.session.userId]);

    if (!rows.length) return res.status(404).json({ error: 'Δεν βρέθηκε ή δεν είναι εγκεκριμένο' });

    await db.query("UPDATE requests SET status='picked_up', picked_up_at=NOW() WHERE id=?", [req.params.id]);
    // Βασικός 1 πόντος για τον μάγειρα
    await db.query('UPDATE users SET credits = credits + 1 WHERE id=?', [req.session.userId]);

    res.json({ message: 'Παραδόθηκε! +1 πόντος' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// No-show — ο καταναλωτής χάνει 1 πόντο, η μερίδα αποκαθίσταται
app.put('/api/requests/:id/noshow', requireAuth, requireRole('cook'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.consumer_id, r.listing_id FROM requests r
      JOIN listings l ON r.listing_id = l.id
      WHERE r.id = ? AND l.user_id = ? AND r.status = 'approved'
    `, [req.params.id, req.session.userId]);

    if (!rows.length) return res.status(404).json({ error: 'Δεν βρέθηκε' });

    await db.query("UPDATE requests SET status='no_show' WHERE id=?", [req.params.id]);
    // -1 πόντος καταναλωτή (δεν πέφτει κάτω από 0)
    await db.query('UPDATE users SET credits = GREATEST(0, credits - 1) WHERE id=?', [rows[0].consumer_id]);
    // Αποκατάσταση μερίδας
    await db.query('UPDATE listings SET portions_available = portions_available + 1 WHERE id=?', [rows[0].listing_id]);

    res.json({ message: 'No-show καταγράφτηκε' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// RATINGS
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/requests/:id/rating', requireAuth, requireRole('consumer'), async (req, res) => {
  const stars = parseInt(req.body.stars);
  if (!stars || stars < 1 || stars > 5)
    return res.status(400).json({ error: 'Η βαθμολογία πρέπει να είναι 1-5' });

  try {
    const [rows] = await db.query(`
      SELECT r.*, l.user_id AS cook_id
      FROM requests r
      JOIN listings l ON r.listing_id = l.id
      WHERE r.id = ? AND r.consumer_id = ? AND r.status = 'picked_up'
    `, [req.params.id, req.session.userId]);

    if (!rows.length) return res.status(404).json({ error: 'Δεν μπορείς να αξιολογήσεις αυτό το αίτημα' });

    const [existing] = await db.query('SELECT id FROM ratings WHERE request_id=?', [req.params.id]);
    if (existing.length) return res.status(400).json({ error: 'Έχεις ήδη αξιολογήσει' });

    await db.query('INSERT INTO ratings (request_id, stars) VALUES (?, ?)', [req.params.id, stars]);

    // Bonus πόντος για τον μάγειρα αν βαθμολογία > 3
    if (stars > 3) {
      await db.query('UPDATE users SET credits = credits + 1 WHERE id=?', [rows[0].cook_id]);
    }

    res.json({ message: 'Ευχαριστούμε για την αξιολόγηση!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/admin/stats', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const [[{ total_month }]] = await db.query(`
      SELECT COUNT(*) AS total_month FROM requests
      WHERE status='picked_up' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
    `);

    const [topDonor] = await db.query(`
      SELECT u.name, u.email, COUNT(r.id) AS portions_given
      FROM requests r
      JOIN listings l ON r.listing_id = l.id
      JOIN users u    ON l.user_id = u.id
      WHERE r.status = 'picked_up'
      GROUP BY u.id ORDER BY portions_given DESC LIMIT 1
    `);

    const [topRated] = await db.query(`
      SELECT l.title, u.name AS cook_name,
             ROUND(AVG(rt.stars), 1) AS avg_rating, COUNT(rt.id) AS rating_count
      FROM ratings rt
      JOIN requests r ON rt.request_id = r.id
      JOIN listings l ON r.listing_id = l.id
      JOIN users u    ON l.user_id = u.id
      GROUP BY l.id
      HAVING rating_count >= 1
      ORDER BY avg_rating DESC, rating_count DESC
      LIMIT 5
    `);

    const [[{ total_users }]]    = await db.query("SELECT COUNT(*) AS total_users FROM users WHERE role != 'admin'");
    const [[{ active_listings }]] = await db.query("SELECT COUNT(*) AS active_listings FROM listings WHERE expires_at > NOW() AND portions_available > 0");

    res.json({ total_month, top_donor: topDonor[0] || null, top_rated: topRated, total_users, active_listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/leaderboard', requireAuth, requireRole('admin'), async (req, res) => {
  const [rows] = await db.query(`
    SELECT u.name, u.email, u.credits,
           COUNT(DISTINCT r.id) AS portions_given,
           ROUND(AVG(rt.stars), 1) AS avg_rating
    FROM users u
    LEFT JOIN listings l  ON l.user_id = u.id
    LEFT JOIN requests r  ON r.listing_id = l.id AND r.status = 'picked_up'
    LEFT JOIN ratings rt  ON rt.request_id = r.id
    WHERE u.role = 'cook'
    GROUP BY u.id
    ORDER BY portions_given DESC
    LIMIT 10
  `);
  res.json(rows);
});

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND JOB — Αφαίρεση πόντου για μη αξιολόγηση εντός 48ωρών
// ─────────────────────────────────────────────────────────────────────────────

async function runDeductionJob() {
  try {
    // Βρες αιτήματα που παραλήφθηκαν >48ω πριν, δεν αξιολογήθηκαν, και δεν έχει ήδη αφαιρεθεί πόντος
    const [rows] = await db.query(`
      SELECT r.id, r.consumer_id FROM requests r
      LEFT JOIN ratings rt ON rt.request_id = r.id
      WHERE r.status = 'picked_up'
        AND rt.id IS NULL
        AND r.picked_up_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)
        AND r.rating_deducted = 0
    `);

    for (const row of rows) {
      await db.query('UPDATE users SET credits = GREATEST(0, credits - 1) WHERE id=?', [row.consumer_id]);
      await db.query('UPDATE requests SET rating_deducted = 1 WHERE id=?', [row.id]);
      console.log(`[job] Αφαιρέθηκε 1 πόντος από χρήστη ${row.consumer_id} (request ${row.id})`);
    }
  } catch (err) {
    console.error('[job] Σφάλμα background job:', err.message);
  }
}

// Εκτέλεση κάθε ώρα
setInterval(runDeductionJob, 60 * 60 * 1000);
runDeductionJob(); // Και κατά την εκκίνηση

// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🍽️  UniBite τρέχει στο http://localhost:${PORT}`);
});
