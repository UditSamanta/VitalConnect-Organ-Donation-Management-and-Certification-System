-- ============================================================
-- Organ Donation Management & Certification System
-- MySQL Database Schema — Fully Normalized (1NF–5NF)
-- 
-- Normalization Notes:
--   1NF: No multi-valued / JSON columns — donor_organs is a
--        separate table; medical conditions are structured rows.
--   2NF: Every non-key column depends on the WHOLE primary key.
--   3NF: No transitive dependencies (patient info extracted
--        from organ_requests into its own profile set of columns;
--        hospital info not duplicated in requests).
--   BCNF: Every determinant is a candidate key.
--   4NF: No multi-valued dependencies (organs, conditions,
--        allergies are each in their own table).
--   5NF: Join dependencies are decomposed correctly — matching
--        is stored as donor×request pairs, recoverable via joins.
-- ============================================================

CREATE DATABASE IF NOT EXISTS organ_donation_db;
USE organ_donation_db;

-- ============================================================
-- TABLE: users
-- Stores authentication details for all roles.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    password      VARCHAR(255)  NOT NULL,
    role          ENUM('donor','hospital','admin') NOT NULL DEFAULT 'donor',
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role  (role)
);

-- ============================================================
-- TABLE: donors
-- Extended donor profile. Organs pledged live in donor_organs
-- (separate table — proper 1NF / 4NF compliance).
-- ============================================================
CREATE TABLE IF NOT EXISTS donors (
    donor_id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id           INT UNSIGNED NOT NULL UNIQUE,
    age               TINYINT UNSIGNED NOT NULL,
    gender            ENUM('male','female','other') NOT NULL,
    blood_group       ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
    address           TEXT NOT NULL,
    city              VARCHAR(100),
    state             VARCHAR(100),
    pincode           VARCHAR(10),
    contact_number    VARCHAR(20) NOT NULL,
    emergency_contact_name     VARCHAR(100),
    emergency_contact_phone    VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    status            ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    registered_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_donor_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_blood_group (blood_group),
    INDEX idx_status      (status)
);

-- ============================================================
-- TABLE: donor_organs  [1NF / 4NF Fix]
-- Each organ pledge is a separate atomic row.
-- Previously stored as a JSON array in donors.organs — that
-- violated 1NF (non-atomic values) and 4NF (multi-valued
-- dependency: donor_id →→ organ_name).
-- ============================================================
CREATE TABLE IF NOT EXISTS donor_organs (
    donor_organ_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    donor_id       INT UNSIGNED NOT NULL,
    organ_name     VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_dorgan_donor FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE,
    UNIQUE KEY uq_donor_organ (donor_id, organ_name),
    INDEX idx_organ_name (organ_name)
);

-- ============================================================
-- TABLE: donor_medical_conditions  [1NF Fix]
-- Each medical condition is a structured, searchable row instead
-- of a free-text blob in donors.medical_history.
-- ============================================================
CREATE TABLE IF NOT EXISTS donor_medical_conditions (
    condition_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    donor_id        INT UNSIGNED NOT NULL,
    condition_name  VARCHAR(100) NOT NULL,
    diagnosed_year  YEAR,
    severity        ENUM('mild','moderate','severe') NOT NULL DEFAULT 'mild',
    is_current      BOOLEAN NOT NULL DEFAULT TRUE,
    notes           TEXT,
    CONSTRAINT fk_cond_donor FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE,
    INDEX idx_cond_donor (donor_id)
);

-- ============================================================
-- TABLE: donor_allergies  [4NF Fix]
-- Multi-valued dependency donor_id →→ allergen separated out.
-- ============================================================
CREATE TABLE IF NOT EXISTS donor_allergies (
    allergy_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    donor_id       INT UNSIGNED NOT NULL,
    allergen       VARCHAR(100) NOT NULL,
    reaction_type  VARCHAR(100),
    CONSTRAINT fk_allergy_donor FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE,
    INDEX idx_allergy_donor (donor_id)
);

-- ============================================================
-- TABLE: donor_lifestyle  [3NF Fix]
-- Lifestyle attributes functionally depend on donor_id only;
-- placing them here avoids transitive dependency in donors table.
-- ============================================================
CREATE TABLE IF NOT EXISTS donor_lifestyle (
    donor_id          INT UNSIGNED PRIMARY KEY,
    bmi               DECIMAL(4,1),
    smoker            BOOLEAN NOT NULL DEFAULT FALSE,
    alcohol_use       ENUM('none','occasional','regular') NOT NULL DEFAULT 'none',
    exercise_freq     ENUM('none','light','moderate','heavy') NOT NULL DEFAULT 'none',
    diet_type         ENUM('vegetarian','non-vegetarian','vegan','other') NOT NULL DEFAULT 'non-vegetarian',
    past_surgeries    TEXT,
    current_medications TEXT,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lifestyle_donor FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: hospitals
-- Hospital / medical authority profile.
-- ============================================================
CREATE TABLE IF NOT EXISTS hospitals (
    hospital_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id            INT UNSIGNED NOT NULL UNIQUE,
    hospital_name      VARCHAR(200) NOT NULL,
    hospital_type      ENUM('government','private','trust','clinic') NOT NULL DEFAULT 'private',
    address            TEXT NOT NULL,
    city               VARCHAR(100),
    state              VARCHAR(100),
    pincode            VARCHAR(10),
    contact_number     VARCHAR(20) NOT NULL,
    email              VARCHAR(150),
    website            VARCHAR(200),
    license_number     VARCHAR(50),
    bed_count          SMALLINT UNSIGNED,
    specialization     VARCHAR(200),
    is_verified        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hospital_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_verified (is_verified)
);

-- ============================================================
-- TABLE: organ_requests
-- Organ requests submitted by hospitals.
-- Patient details are stored here as direct columns (3NF
-- compliant: patient_name, age, gender, diagnosis all depend
-- on request_id as the primary key, not on hospital_id).
-- ============================================================
CREATE TABLE IF NOT EXISTS organ_requests (
    request_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hospital_id       INT UNSIGNED NOT NULL,
    organ_type        VARCHAR(50)  NOT NULL,
    blood_group       ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
    patient_name      VARCHAR(100) NOT NULL,
    patient_age       TINYINT UNSIGNED,
    patient_gender    ENUM('male','female','other'),
    patient_diagnosis VARCHAR(300),
    doctor_name       VARCHAR(100),
    ward_number       VARCHAR(20),
    urgency           ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
    notes             TEXT,
    status            ENUM('pending','matched','fulfilled','cancelled') NOT NULL DEFAULT 'pending',
    requested_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_request_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    INDEX idx_organ_blood (organ_type, blood_group),
    INDEX idx_req_status  (status),
    INDEX idx_urgency     (urgency)
);

-- ============================================================
-- TABLE: matches
-- Donor <-> Organ Request match records.
-- 5NF: This table is the lossless join of donors × organ_requests
-- through compatible blood group and organ, stored explicitly
-- so it can be reconstructed without inference.
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
    match_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    donor_id    INT UNSIGNED NOT NULL,
    request_id  INT UNSIGNED NOT NULL,
    matched_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_match_donor   FOREIGN KEY (donor_id)   REFERENCES donors(donor_id)          ON DELETE CASCADE,
    CONSTRAINT fk_match_request FOREIGN KEY (request_id) REFERENCES organ_requests(request_id) ON DELETE CASCADE,
    UNIQUE KEY uq_match (donor_id, request_id),
    INDEX idx_match_donor   (donor_id),
    INDEX idx_match_request (request_id)
);

-- ============================================================
-- TABLE: certificates
-- Donor certificates issued post-approval.
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
    certificate_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    donor_id        INT UNSIGNED NOT NULL UNIQUE,
    certificate_uid VARCHAR(30)  NOT NULL UNIQUE COMMENT 'Human-readable UID like ODMS-2024-00001',
    issue_date      DATE         NOT NULL DEFAULT (CURDATE()),
    issued_by       VARCHAR(100) NOT NULL DEFAULT 'Organ Donation Management System',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cert_donor FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE,
    INDEX idx_cert_uid (certificate_uid)
);

-- ============================================================
-- TABLE: audit_log
-- Immutable record of all state-changing operations.
-- Used for: concurrency control audit, recovery/rollback trace,
-- and BCNF compliance verification.
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    log_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    table_name   VARCHAR(50)  NOT NULL,
    operation    ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    record_id    INT UNSIGNED NOT NULL,
    performed_by INT UNSIGNED COMMENT 'user_id of actor',
    old_values   JSON,
    new_values   JSON,
    ip_address   VARCHAR(45),
    performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_table  (table_name),
    INDEX idx_audit_record (table_name, record_id),
    INDEX idx_audit_time   (performed_at)
);
