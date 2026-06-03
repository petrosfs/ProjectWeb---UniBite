# UniBite — Φοιτητικό Food Sharing Platform

**Online:** https://projectweb-unibite-production.up.railway.app

**GitHub:** https://github.com/petrosfs/ProjectWeb---UniBite

---

## Γρήγορη εκκίνηση

### 1. Εγκατάσταση dependencies
```bash
cd unibite
npm install
```

### 2. Ρύθμιση περιβάλλοντος

Το αρχείο `.env` περιλαμβάνεται ήδη με τις default τιμές για τοπική εκτέλεση. Αν η τοπική εγκατάσταση MySQL έχει διαφορετικά στοιχεία, επεξεργάσου το `.env` ανάλογα.

### 3. Δημιουργία βάσης δεδομένων

**Επιλογή Α — Μόνο δομή (καθαρή βάση):**
```bash
mysql -u root -p < schema.sql
```

**Επιλογή Β — Δομή + δεδομένα επίδειξης:**
```bash
mysql -u root -p < unibite_export.sql
```

Τα στοιχεία των δοκιμαστικών λογαριασμών (Επιλογή Β) βρίσκονται στο αρχείο `users credentials.txt`.

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
├── server.js            # Express backend + όλα τα API endpoints
├── db.js                # MySQL connection pool
├── schema.sql           # Δομή βάσης + αλλεργιογόνα (14 της ΕΕ)
├── seed.js              # Δημιουργία admin χρήστη
├── unibite_export.sql   # Export βάσης δεδομένων (δεδομένα + δομή)
├── .env.example         # Υπόδειγμα μεταβλητών περιβάλλοντος
└── public/
    ├── index.html       # Login / Register
    ├── feed.html        # Feed καταναλωτή (λίστα + χάρτης Leaflet)
    ├── cook.html        # Dashboard μάγειρα (αγγελίες + αιτήματα)
    ├── requests.html    # Αιτήματα καταναλωτή + αξιολογήσεις
    ├── admin.html       # Dashboard admin (στατιστικά + leaderboard)
    ├── css/
    │   └── style.css    # Responsive styles (mobile-first, CSS variables)
    ├── js/
    │   └── app.js       # Κοινές συναρτήσεις (API wrapper, toast, auth)
    └── uploads/         # Φωτογραφίες αγγελιών (δημιουργείται αυτόματα)
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
| GET | /api/my/requests | Consumer | Αιτήματά μου |
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
| Χωρίς αξιολόγηση εντός 48ω | Καταναλωτής: -1 (background job) |

---

## Κατάσταση αγγελιών

| Κατάσταση | Συνθήκη | Εμφάνιση |
|-----------|---------|----------|
| Ενεργή | `expires_at > NOW()` ΚΑΙ `portions_available > 0` | Κανονικά |
| Ανενεργή | `expires_at > NOW()` ΚΑΙ `portions_available = 0` | Greyed out |
| Διεγραμμένη | `expires_at <= NOW()` | Δεν εμφανίζεται — παραμένει για στατιστικά |
