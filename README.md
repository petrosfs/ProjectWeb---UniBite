# 🍽️ UniBite — Φοιτητικό Food Sharing Platform

## Γρήγορη εκκίνηση

### 1. Εγκατάσταση dependencies
```bash
cd unibite
npm install
```

### 2. Ρύθμιση περιβάλλοντος
```bash
cp .env.example .env
# Επεξεργάσου το .env με τα στοιχεία σου (DB_USER, DB_PASS κ.λπ.)
```

### 3. Δημιουργία βάσης δεδομένων
```bash
mysql -u root -p < schema.sql
```

### 4. Δημιουργία admin χρήστη
```bash
node seed.js
# Admin: admin@unibite.gr / admin123
```

### 5. Εκκίνηση server
```bash
npm run dev    # development (με nodemon)
npm start      # production
```

Άνοιξε το http://localhost:3000

---

## Δομή project

```
unibite/
├── server.js          # Express backend + όλα τα API endpoints
├── db.js              # MySQL connection pool
├── schema.sql         # Δομή βάσης + αλλεργιογόνα
├── seed.js            # Δημιουργία admin
├── .env               # Μεταβλητές περιβάλλοντος (δεν ανεβαίνει στο git)
└── public/
    ├── index.html     # Login / Register
    ├── feed.html      # Feed καταναλωτή (λίστα + χάρτης)
    ├── cook.html      # Dashboard μάγειρα
    ├── admin.html     # Dashboard admin
    ├── css/
    │   └── style.css  # Responsive styles
    ├── js/
    │   └── app.js     # Κοινές συναρτήσεις (API, toast, auth)
    └── uploads/       # Φωτογραφίες αγγελιών (δημιουργείται αυτόματα)
```

---

## API Endpoints

| Method | URL | Ρόλος | Περιγραφή |
|--------|-----|-------|-----------|
| POST | /api/auth/register | — | Εγγραφή |
| POST | /api/auth/login | — | Σύνδεση |
| POST | /api/auth/logout | — | Αποσύνδεση |
| GET | /api/auth/me | Auth | Τρέχων χρήστης |
| GET | /api/allergens | Auth | Λίστα αλλεργιογόνων |
| GET | /api/listings | Auth | Feed αγγελιών |
| GET | /api/listings/:id | Auth | Μία αγγελία |
| GET | /api/my/listings | Cook | Αγγελίες μάγειρα |
| POST | /api/listings | Cook | Δημιουργία αγγελίας |
| PUT | /api/listings/:id | Cook | Επεξεργασία |
| DELETE | /api/listings/:id | Cook | Διαγραφή |
| POST | /api/listings/:id/requests | Consumer | Αίτημα μερίδας |
| GET | /api/my/requests | Consumer | Αιτήματα μου |
| GET | /api/cook/requests | Cook | Εισερχόμενα αιτήματα |
| PUT | /api/requests/:id/approve | Cook | Αποδοχή |
| PUT | /api/requests/:id/reject | Cook | Απόρριψη (+refund) |
| PUT | /api/requests/:id/pickup | Cook | Επιτυχής παραλαβή |
| PUT | /api/requests/:id/noshow | Cook | No-show |
| POST | /api/requests/:id/rating | Consumer | Αξιολόγηση |
| GET | /api/admin/stats | Admin | Στατιστικά |
| GET | /api/admin/leaderboard | Admin | Κατάταξη μαγείρων |

---

## Λογική πόντων (credits)

| Γεγονός | Αποτέλεσμα |
|---------|-----------|
| Νέος χρήστης | +5 πόντοι |
| Αίτημα μερίδας | -1 πόντος |
| Απόρριψη αιτήματος | +1 πόντος (επιστροφή) |
| Επιτυχής παραλαβή | Μάγειρας: +1 |
| Βαθμολογία > 3/5 | Μάγειρας: +1 bonus |
| No-show | Καταναλωτής: -1 |
| Χωρίς αξιολόγηση >48ω | Καταναλωτής: -1 |

---

## Κατάσταση αγγελιών

- **Ενεργή**: `expires_at > NOW()` ΚΑΙ `portions_available > 0` → εμφανίζεται κανονικά
- **Ανενεργή**: `expires_at > NOW()` ΚΑΙ `portions_available = 0` → εμφανίζεται greyed out
- **Διεγραμμένη**: `expires_at <= NOW()` → δεν εμφανίζεται, παραμένει για στατιστικά
