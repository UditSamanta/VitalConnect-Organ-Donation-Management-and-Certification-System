-- ============================================================
-- Organ Donation Management & Certification System
-- Sample Seed Data (matches updated normalized schema)
-- ============================================================

USE organ_donation_db;

-- ============================================================
-- Users (bcrypt hash for 'Password123!')
-- ============================================================
INSERT INTO users (user_id, name, email, password, role) VALUES
  (1,  'Admin User',         'admin@odms.com',       '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
  (2,  'Rahul Sharma',       'rahul@donor.com',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'donor'),
  (3,  'Priya Patel',        'priya@donor.com',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'donor'),
  (4,  'Amit Kumar',         'amit@donor.com',       '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'donor'),
  (5,  'Sunita Reddy',       'sunita@donor.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'donor'),
  (6,  'AIIMS New Delhi',    'admin@aiims.com',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hospital'),
  (7,  'Fortis Hospital',    'admin@fortis.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hospital'),
  (8,  'Apollo Hospitals',   'admin@apollo.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hospital'),
  (9,  'Vikram Mehta',       'vikram@donor.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'donor'),
  (10, 'Anjali Singh',       'anjali@donor.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'donor')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================================
-- Donors
-- ============================================================
INSERT INTO donors (donor_id, user_id, age, gender, blood_group, address, city, state, pincode,
                    contact_number, emergency_contact_name, emergency_contact_phone,
                    emergency_contact_relation, status) VALUES
  (1, 2,  28, 'male',   'O+',  '12, MG Road, Sector 5',       'Delhi',     'Delhi',     '110001', '9876543210', 'Suresh Sharma',    '9876543299', 'Father',  'approved'),
  (2, 3,  34, 'female', 'A+',  '45, Baner Road',               'Pune',      'Maharashtra','411045', '9823456789', 'Ramesh Patel',     '9823456700', 'Husband', 'approved'),
  (3, 4,  22, 'male',   'B+',  '78, Koramangala 4th Block',    'Bengaluru', 'Karnataka', '560034', '9745678901', 'Meena Kumar',      '9745678900', 'Mother',  'pending'),
  (4, 5,  45, 'female', 'AB+', '23, Jubilee Hills, Road No 36','Hyderabad', 'Telangana', '500033', '9632145870', 'Ravi Reddy',       '9632145800', 'Husband', 'rejected'),
  (5, 9,  31, 'male',   'O-',  '101, Marine Lines',            'Mumbai',    'Maharashtra','400002', '9988776655', 'Kavita Mehta',     '9988776600', 'Wife',    'approved'),
  (6, 10, 26, 'female', 'A-',  '55, Anna Nagar',               'Chennai',   'Tamil Nadu','600040', '9911223344', 'Deepak Singh',     '9911223300', 'Brother', 'pending')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- ============================================================
-- Donor Organs (1NF — each organ is its own row)
-- ============================================================
INSERT INTO donor_organs (donor_id, organ_name) VALUES
  (1, 'Kidney'), (1, 'Liver'), (1, 'Corneas'),
  (2, 'Heart'),  (2, 'Lungs'), (2, 'Kidney'),
  (3, 'Pancreas'), (3, 'Corneas'),
  (4, 'Skin'), (4, 'Bone Marrow'),
  (5, 'Kidney'), (5, 'Liver'), (5, 'Heart'), (5, 'Lungs'),
  (6, 'Corneas'), (6, 'Skin')
ON DUPLICATE KEY UPDATE organ_name=VALUES(organ_name);

-- ============================================================
-- Donor Medical Conditions
-- ============================================================
INSERT INTO donor_medical_conditions (donor_id, condition_name, diagnosed_year, severity, is_current, notes) VALUES
  (1, 'Mild Hypertension',   2020, 'mild',     TRUE,  'Controlled with medication'),
  (2, 'Type 2 Diabetes',     2018, 'moderate', TRUE,  'Diet-controlled, HbA1c within range'),
  (2, 'Hypothyroidism',      2019, 'mild',     TRUE,  'On daily thyroxine supplement'),
  (3, 'Asthma',              2015, 'mild',     TRUE,  'Inhaler used as needed'),
  (5, 'Appendectomy scar',   2016, 'mild',     FALSE, 'Old surgery, no issues');

-- ============================================================
-- Donor Allergies
-- ============================================================
INSERT INTO donor_allergies (donor_id, allergen, reaction_type) VALUES
  (1, 'Penicillin',  'Skin rash'),
  (2, 'Peanuts',     'Anaphylaxis — carries EpiPen'),
  (3, 'Dust',        'Allergic rhinitis'),
  (5, 'Sulfa drugs', 'Urticaria');

-- ============================================================
-- Donor Lifestyle
-- ============================================================
INSERT INTO donor_lifestyle (donor_id, bmi, smoker, alcohol_use, exercise_freq, diet_type,
                              past_surgeries, current_medications) VALUES
  (1, 23.5, FALSE, 'occasional', 'moderate', 'non-vegetarian', 'None',           'Amlodipine 5mg daily'),
  (2, 26.1, FALSE, 'none',       'light',    'vegetarian',     'C-section (2019)','Thyroxine 50mcg, Metformin 500mg'),
  (3, 21.8, FALSE, 'none',       'heavy',    'non-vegetarian', 'None',           'Salbutamol inhaler PRN'),
  (4, 29.3, FALSE, 'occasional', 'none',     'non-vegetarian', 'Hysterectomy (2021)','Levothyroxine 75mcg'),
  (5, 24.0, FALSE, 'occasional', 'moderate', 'non-vegetarian', 'Appendectomy (2016)','None'),
  (6, 20.5, FALSE, 'none',       'heavy',    'vegan',          'None',           'None')
ON DUPLICATE KEY UPDATE bmi=VALUES(bmi);

-- ============================================================
-- Hospitals
-- ============================================================
INSERT INTO hospitals (hospital_id, user_id, hospital_name, hospital_type, address, city, state,
                       pincode, contact_number, license_number, bed_count, specialization, is_verified) VALUES
  (1, 6, 'AIIMS New Delhi',   'government', 'Sri Aurobindo Marg, Ansari Nagar',   'New Delhi', 'Delhi',       '110029', '011-26588500', 'AIIMS-ND-001', 2000, 'Multi-Speciality, Organ Transplant', TRUE),
  (2, 7, 'Fortis Hospital',   'private',    '56, Sector 62, Phase VIII, Mohali',  'Mohali',    'Punjab',      '160062', '0172-4920000', 'FORTIS-PB-002',500,  'Cardiac, Nephrology',                TRUE),
  (3, 8, 'Apollo Hospitals',  'private',    '21, Greams Lane, Off Greams Road',   'Chennai',   'Tamil Nadu',  '600006', '044-28296000', 'APOLLO-TN-003',600,  'Transplant, Oncology, Neuroscience',  FALSE)
ON DUPLICATE KEY UPDATE is_verified=VALUES(is_verified);

-- ============================================================
-- Organ Requests (with patient details)
-- ============================================================
INSERT INTO organ_requests (request_id, hospital_id, organ_type, blood_group, patient_name,
                             patient_age, patient_gender, patient_diagnosis, doctor_name,
                             ward_number, urgency, notes, status) VALUES
  (1, 1, 'kidney', 'O+',  'Mohan Das',       52, 'male',   'End-stage renal disease',        'Dr. Arvind Nair',    'W-204', 'critical', 'Patient on dialysis for 3 years',         'matched'),
  (2, 1, 'liver',  'A+',  'Suman Verma',     41, 'female', 'Hepatic cirrhosis',              'Dr. Priya Khanna',   'W-308', 'high',     'Bilirubin critically elevated',           'pending'),
  (3, 2, 'heart',  'A+',  'Rajan Iyer',      60, 'male',   'Dilated cardiomyopathy',         'Dr. Suresh Menon',   'ICU-3', 'critical', 'EF <20%, urgent transplant needed',       'matched'),
  (4, 2, 'kidney', 'B+',  'Fatima Shaikh',   35, 'female', 'Polycystic kidney disease',      'Dr. Nisha Garg',     'W-101', 'high',     'GFR < 10 mL/min',                         'pending'),
  (5, 3, 'corneas','AB+', 'Ganesh Pillai',   70, 'male',   'Bilateral corneal degeneration', 'Dr. Anand Murthy',   'OPD-7', 'medium',   'Patient legally blind, needs bilateral transplant', 'pending'),
  (6, 1, 'lungs',  'O-',  'Kavita Joshi',    45, 'female', 'Idiopathic pulmonary fibrosis',  'Dr. Ritu Mehta',     'ICU-1', 'critical', 'O2 saturation critically low',            'matched')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- ============================================================
-- Matches
-- ============================================================
INSERT INTO matches (donor_id, request_id) VALUES
  (1, 1),  -- Rahul (O+, Kidney) → Mohan Das (O+, Kidney)
  (2, 3),  -- Priya (A+, Heart)  → Rajan Iyer (A+, Heart)
  (5, 6)   -- Vikram (O-, Lungs) → Kavita Joshi (O-, Lungs)
ON DUPLICATE KEY UPDATE matched_at=matched_at;

-- ============================================================
-- Certificates (for approved + matched donors)
-- ============================================================
INSERT INTO certificates (donor_id, certificate_uid, issue_date, issued_by) VALUES
  (1, 'ODMS-2025-00001', '2025-03-15', 'Organ Donation Management System'),
  (2, 'ODMS-2025-00002', '2025-03-20', 'Organ Donation Management System'),
  (5, 'ODMS-2025-00005', '2025-04-01', 'Organ Donation Management System')
ON DUPLICATE KEY UPDATE certificate_uid=VALUES(certificate_uid);

-- ============================================================
-- Sample Audit Log entries
-- ============================================================
INSERT INTO audit_log (table_name, operation, record_id, performed_by, old_values, new_values) VALUES
  ('donors', 'UPDATE', 1, 1, '{"status":"pending"}', '{"status":"approved"}'),
  ('donors', 'UPDATE', 2, 1, '{"status":"pending"}', '{"status":"approved"}'),
  ('donors', 'UPDATE', 4, 1, '{"status":"pending"}', '{"status":"rejected"}'),
  ('hospitals', 'UPDATE', 1, 1, '{"is_verified":0}',  '{"is_verified":1}'),
  ('organ_requests', 'UPDATE', 1, 1, '{"status":"pending"}', '{"status":"matched"}');
