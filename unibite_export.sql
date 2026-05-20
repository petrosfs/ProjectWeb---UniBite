-- UniBite Database Export
-- Ημερομηνία: 20/5/2026, 6:58:40 μ.μ.
-- Βάση: railway

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ────────────────────────────────────────
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('cook','consumer','admin') NOT NULL,
  `credits` int NOT NULL DEFAULT '5',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `credits`, `created_at`) VALUES
  (3, 'Μαρία Παπαδόπουλου', 'mageiras@test.gr', '$2a$10$oCLctWOtx2IYeprGU0x/helutIHpsTVjVvWB1NH46tFHnp8BqVksu', 'cook', 10, '2026-05-10 19:12:24'),
  (4, 'Μάριος Παπαδόπουλος', 'katanalwtis@test.gr', '$2a$10$tuSq77XltzwdsuAYbQO8au72kxHwSDGUQoo.x4XhCBrofBo3lOaGO', 'consumer', 0, '2026-05-10 19:12:41'),
  (5, 'Petros Fousekis', 'admin@test.gr', '$2a$10$H1HFprqqKjnY9rjacIZdVeenJn2Tar5EZgoFMUB1rm4ua7Eu3TcQ6', 'admin', 0, '2026-05-10 19:13:35'),
  (6, 'Νίκος Τεστ', 'nikos@test.gr', '$2a$10$BMzlI6skykwyperIbimHwumtTKmHxEMWyl0cFcKn8BEMBK5XA31ru', 'consumer', 3, '2026-05-10 20:21:49');

-- ────────────────────────────────────────
DROP TABLE IF EXISTS `allergens`;
CREATE TABLE `allergens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `allergens` (`id`, `name`) VALUES
  (1, 'Γλουτένη (Σιτάρι, Κριθάρι κ.λπ.)'),
  (2, 'Καρκινοειδή'),
  (3, 'Αυγά'),
  (4, 'Ψάρια'),
  (5, 'Φιστίκια (Αράπικα)'),
  (6, 'Σόγια'),
  (7, 'Γάλα / Γαλακτοκομικά'),
  (8, 'Ξηροί καρποί (Αμύγδαλα, Κάσιους κ.λπ.)'),
  (9, 'Σέλινο'),
  (10, 'Μουστάρδα'),
  (11, 'Σουσάμι'),
  (12, 'Διοξείδιο του θείου / Θειώδη'),
  (13, 'Λούπινα'),
  (14, 'Μαλάκια');

-- ────────────────────────────────────────
DROP TABLE IF EXISTS `listings`;
CREATE TABLE `listings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `notes` text,
  `portions_total` int NOT NULL,
  `portions_available` int NOT NULL,
  `location` varchar(300) NOT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lng` decimal(10,7) DEFAULT NULL,
  `pickup_time` varchar(100) NOT NULL,
  `photo_url` varchar(300) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `listings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `listings` (`id`, `user_id`, `title`, `notes`, `portions_total`, `portions_available`, `location`, `lat`, `lng`, `pickup_time`, `photo_url`, `created_at`, `expires_at`) VALUES
  (1, 3, 'Μουσακάς με πατάτες', 'Σπιτικός μουσακάς με φρέσκα υλικά', 3, 2, 'Εστία Α, Δωμάτιο 101', NULL, NULL, '13:00-14:00', NULL, '2026-05-10 20:11:15', '2026-05-12 20:11:16'),
  (2, 3, 'Παστίτσιο', 'Φρεσκοφτιαγμένο παστίτσιο με κιμά', 4, 3, 'Εστία Β, Δωμάτιο 205', NULL, NULL, '12:00-13:00', NULL, '2026-05-10 20:14:28', '2026-05-12 20:14:28'),
  (3, 3, 'Φακές σούπα', 'Παραδοσιακή φακόσουπα με λεμόνι', 2, 2, 'Κτίριο Γ, 3ος όροφος', NULL, NULL, '14:00-15:00', NULL, '2026-05-10 20:14:28', '2026-05-12 20:14:29'),
  (4, 3, 'Κοτόπουλο φούρνου', 'Κοτόπουλο με πατάτες και ρίγανη', 5, 5, 'Εστία Α, Δωμάτιο 310', NULL, NULL, '13:30-14:30', NULL, '2026-05-10 20:14:28', '2026-05-12 20:14:29'),
  (5, 3, 'Σπανακόρυζο', 'Παραδοσιακό σπανακόρυζο με φέτα', 3, 3, 'Εστία Γ, Δωμάτιο 12', NULL, NULL, '15:00-16:00', NULL, '2026-05-10 20:17:45', '2026-05-12 20:17:46'),
  (6, 3, 'Λαζάνια', '', 3, 3, 'ΑΠΘ, Πολυτεχνική Σχολή', '40.6285000', '22.9583000', '13:00-14:00', NULL, '2026-05-10 20:19:46', '2026-05-12 20:19:46'),
  (7, 3, 'Τυρόπιτα', NULL, 4, 4, 'ΑΠΘ, Κεντρική Βιβλιοθήκη', '40.6300000', '22.9560000', '11:00-12:00', NULL, '2026-05-10 20:19:46', '2026-05-12 20:19:46'),
  (8, 3, 'Ρεβίθια', NULL, 2, 0, 'Εστία Αγίου Δημητρίου', '40.6350000', '22.9500000', '14:00-15:00', NULL, '2026-05-10 20:19:46', '2026-05-12 20:19:47');

-- ────────────────────────────────────────
DROP TABLE IF EXISTS `listing_allergens`;
CREATE TABLE `listing_allergens` (
  `listing_id` int NOT NULL,
  `allergen_id` int NOT NULL,
  PRIMARY KEY (`listing_id`,`allergen_id`),
  KEY `allergen_id` (`allergen_id`),
  CONSTRAINT `listing_allergens_ibfk_1` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `listing_allergens_ibfk_2` FOREIGN KEY (`allergen_id`) REFERENCES `allergens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- (κενός πίνακας)

-- ────────────────────────────────────────
DROP TABLE IF EXISTS `requests`;
CREATE TABLE `requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `listing_id` int NOT NULL,
  `consumer_id` int NOT NULL,
  `status` enum('pending','approved','rejected','picked_up','no_show') NOT NULL DEFAULT 'pending',
  `rating_deducted` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `picked_up_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `listing_id` (`listing_id`),
  KEY `consumer_id` (`consumer_id`),
  CONSTRAINT `requests_ibfk_1` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `requests_ibfk_2` FOREIGN KEY (`consumer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `requests` (`id`, `listing_id`, `consumer_id`, `status`, `rating_deducted`, `created_at`, `picked_up_at`) VALUES
  (1, 1, 4, 'picked_up', 0, '2026-05-10 20:14:49', '2026-05-10 20:15:03'),
  (2, 2, 4, 'picked_up', 0, '2026-05-10 20:14:49', '2026-05-10 20:15:03'),
  (3, 3, 4, 'no_show', 0, '2026-05-10 20:14:49', NULL),
  (4, 5, 4, 'rejected', 0, '2026-05-10 20:17:46', NULL),
  (5, 8, 4, 'approved', 0, '2026-05-10 20:21:48', NULL),
  (6, 8, 6, 'picked_up', 1, '2026-05-10 20:21:49', '2026-05-14 10:29:51');

-- ────────────────────────────────────────
DROP TABLE IF EXISTS `ratings`;
CREATE TABLE `ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_id` int NOT NULL,
  `stars` tinyint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_id` (`request_id`),
  CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `ratings` (`id`, `request_id`, `stars`, `created_at`) VALUES
  (1, 1, 5, '2026-05-10 20:15:18'),
  (2, 2, 4, '2026-05-10 20:15:19');

SET FOREIGN_KEY_CHECKS = 1;
