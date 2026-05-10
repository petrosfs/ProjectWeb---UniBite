-- UniBite Database Schema
-- Εκτέλεσε: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS unibite
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE unibite;

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('cook','consumer','admin') NOT NULL,
  credits       INT           NOT NULL DEFAULT 5,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── ALLERGENS (τα 14 της ΕΕ) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS allergens (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

INSERT INTO allergens (name) VALUES
  ('Γλουτένη (Σιτάρι, Κριθάρι κ.λπ.)'),
  ('Καρκινοειδή'),
  ('Αυγά'),
  ('Ψάρια'),
  ('Φιστίκια (Αράπικα)'),
  ('Σόγια'),
  ('Γάλα / Γαλακτοκομικά'),
  ('Ξηροί καρποί (Αμύγδαλα, Κάσιους κ.λπ.)'),
  ('Σέλινο'),
  ('Μουστάρδα'),
  ('Σουσάμι'),
  ('Διοξείδιο του θείου / Θειώδη'),
  ('Λούπινα'),
  ('Μαλάκια');

-- ─── LISTINGS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT          NOT NULL,
  title               VARCHAR(200) NOT NULL,
  notes               TEXT,
  portions_total      INT          NOT NULL,
  portions_available  INT          NOT NULL,
  location            VARCHAR(300) NOT NULL,
  lat                 DECIMAL(10,7) NULL,
  lng                 DECIMAL(10,7) NULL,
  pickup_time         VARCHAR(100) NOT NULL,
  photo_url           VARCHAR(300),
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  expires_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── LISTING ↔ ALLERGENS (M:N) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listing_allergens (
  listing_id  INT NOT NULL,
  allergen_id INT NOT NULL,
  PRIMARY KEY (listing_id, allergen_id),
  FOREIGN KEY (listing_id)  REFERENCES listings(id)  ON DELETE CASCADE,
  FOREIGN KEY (allergen_id) REFERENCES allergens(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── REQUESTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  listing_id       INT NOT NULL,
  consumer_id      INT NOT NULL,
  status           ENUM('pending','approved','rejected','picked_up','no_show') NOT NULL DEFAULT 'pending',
  rating_deducted  TINYINT NOT NULL DEFAULT 0,  -- 1 αν αφαιρέθηκε ήδη πόντος για μη αξιολόγηση
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  picked_up_at     TIMESTAMP NULL,
  FOREIGN KEY (listing_id)   REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (consumer_id)  REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── RATINGS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  request_id  INT NOT NULL UNIQUE,
  stars       TINYINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
) ENGINE=InnoDB;
