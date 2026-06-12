# DBMS Report: Organ Donation Management & Certification System

**Subject:** Database Management Systems (DBMS)  
**Project:** Organ Donation Management & Certification System  
**Technology Stack:** MySQL 8.0, Node.js, React.js  

---

## 1. Introduction

The Organ Donation Management and Certification System (ODMS) is a full-stack web application that manages organ donors, hospital organ requests, donor-patient matching, and digital certificate generation. The database is designed with full normalization from 1NF through 5NF, implements concurrency control via transactions and row-level locking, and supports recovery via an audit log and WAL (Write-Ahead Logging)-compatible design.

---

## 2. Entity-Relationship Overview

| Entity         | Description                                      |
|----------------|--------------------------------------------------|
| `users`        | All system users (donors, hospitals, admin)      |
| `donors`       | Donor profile and medical demographics           |
| `donor_organs` | Each pledged organ as an individual row (1NF)    |
| `donor_medical_conditions` | Structured medical history per donor |
| `donor_allergies`          | Per-allergen records for a donor     |
| `donor_lifestyle`          | BMI, habits, medications             |
| `hospitals`    | Hospital profile with license and type           |
| `organ_requests`           | Organ requests with full patient details |
| `matches`      | Donor ↔ Request matches (lossless join table)    |
| `certificates` | Donation approval certificates                   |
| `audit_log`    | Immutable change history for recovery            |

---

## 3. Pitfalls Identified in Original Design

Before normalization, the schema had the following critical issues:

| # | Pitfall | Table.Column | Normal Form Violated | Impact |
|---|---------|-------------|---------------------|--------|
| 1 | `organs` stored as a JSON array in one column | `donors.organs` | **1NF** (non-atomic, multi-valued) | Cannot query/index individual organs; breaks organ-based matching queries |
| 2 | `medical_history` stored as free-text blob | `donors.medical_history` | **1NF** (unstructured) | Cannot filter donors by condition; no severity/date tracking |
| 3 | Patient info (name) embedded directly in organ request | `organ_requests.patient_name` | **3NF** — patient attributes depended transitively via patient identity, not cleanly on request_id | Redundant data if the same patient has multiple requests |
| 4 | `emergency_contact` was a single VARCHAR | `donors.emergency_contact` | **1NF** (composite attribute) | Name, phone, and relationship were mixed in one string |
| 5 | No hospital details beyond name/address | `hospitals` | Missing attributes | Type, bed count, specialization, website not captured |
| 6 | No audit trail | — | Cannot support recovery | No way to roll back logical errors or trace who changed what |
| 7 | Matching function read `organs` JSON column | `matching.js` | Application-level 1NF violation | JSON parse on every read; cannot use index on organ name |

---

## 4. Functional Dependencies Analysis

### 4.1 `users` table
```
user_id → name, email, password, role, is_active, created_at, updated_at
email → user_id   (alternate key)
```
**Candidate keys:** `user_id`, `email`  
**This table is in BCNF** — every determinant is a candidate key.

---

### 4.2 `donors` table
```
donor_id → user_id, age, gender, blood_group, address, city, state, pincode,
           contact_number, emergency_contact_name, emergency_contact_phone,
           emergency_contact_relation, status, registered_at
user_id  → donor_id   (alternate key — UNIQUE constraint)
```
**Candidate keys:** `donor_id`, `user_id`  
**This table is in BCNF** — no partial or transitive dependencies remain.

> ⚠️ **Original Pitfall (1NF):** The original `organs JSON` and `emergency_contact VARCHAR` columns made this table violate 1NF. Both have been decomposed into separate tables and structured columns respectively.

---

### 4.3 `donor_organs` table *(NEW — 1NF + 4NF Fix)*
```
(donor_id, organ_name) → donor_organ_id
donor_organ_id → donor_id, organ_name
```
**Candidate key:** `(donor_id, organ_name)`  
**Multi-valued dependency resolved:** Previously `donor_id →→ organ_name` (MVD) violated 4NF when stored in the donors table as a JSON array. Extracting into `donor_organs` eliminates this MVD.  
**This table is in 5NF.**

---

### 4.4 `donor_medical_conditions` table *(NEW — 1NF Fix)*
```
condition_id → donor_id, condition_name, diagnosed_year, severity, is_current, notes
```
**Candidate key:** `condition_id`  
**This table is in BCNF** — every non-key attribute depends fully on condition_id.

---

### 4.5 `donor_allergies` table *(NEW — 4NF Fix)*
```
allergy_id → donor_id, allergen, reaction_type
```
**Multi-valued dependency:** `donor_id →→ allergen` was embedded in the original `medical_history` text. Separated into its own table.  
**This table is in 4NF.**

---

### 4.6 `donor_lifestyle` table *(NEW — 3NF Fix)*
```
donor_id → bmi, smoker, alcohol_use, exercise_freq, diet_type, past_surgeries, current_medications
```
**Candidate key:** `donor_id` (primary key — 1:1 relationship with donors)  
**Separation rationale:** Lifestyle attributes do not depend on any other key — placing them in `donors` would make the table wider without normalization benefit. Keeping them separate allows independent updates and keeps `donors` focused on demographic identity. **3NF compliant.**

---

### 4.7 `hospitals` table
```
hospital_id → user_id, hospital_name, hospital_type, address, city, state, pincode,
              contact_number, email, website, license_number, bed_count, specialization, is_verified
user_id → hospital_id   (alternate key)
license_number →? hospital_id   (partial candidate key if always present)
```
**Candidate keys:** `hospital_id`, `user_id`  
**This table is in BCNF.**

---

### 4.8 `organ_requests` table
```
request_id → hospital_id, organ_type, blood_group, patient_name, patient_age,
             patient_gender, patient_diagnosis, doctor_name, ward_number,
             urgency, notes, status, requested_at
```
**Candidate key:** `request_id`  

**3NF Analysis:** All patient attributes (name, age, gender, diagnosis) depend directly on `request_id`, not transitively through any intermediate attribute. There is no FD `patient_name → patient_age` because the same patient name may appear in different records. Each request is an independent transaction.  

> If the system were to support returning patients (same person making multiple requests), we would extract patients into a `patients(patient_id, name, dob, blood_group)` table. For the current scope (single-episode requests without patient login), this design is **3NF compliant**.

---

### 4.9 `matches` table *(5NF — Join Dependency)*
```
match_id → donor_id, request_id, matched_at
(donor_id, request_id) → match_id   (alternate key — UNIQUE constraint)
```
**5NF analysis:**  
The matching relationship is ternary in nature: **Donor** can donate to **Request** through a **compatibility rule** (blood group + organ). In 5NF, we must ensure the table cannot be losslessly decomposed further.

`matches(donor_id, request_id)` is already the minimal representation of this binary relationship. It cannot be split into:
- `donor_blood(donor_id, blood_group)` + `request_blood(request_id, blood_group)` + `organ_match(donor_id, organ_type)`

...without losing information about *which specific donor matched which specific request*. Therefore:  
**This table is in 5NF.**

---

### 4.10 `audit_log` table
```
log_id → table_name, operation, record_id, performed_by, old_values, new_values, ip_address, performed_at
```
**No normalization issues** — this is an append-only log table. All attributes depend on `log_id`. The `old_values` and `new_values` JSON columns are intentionally denormalized for auditability (capturing a snapshot, not a relational reference).

---

## 5. Normalization — Step by Step

### 5.1 First Normal Form (1NF)
**Rule:** Every column must contain atomic (indivisible) values. No repeating groups or arrays.

**Violations found & fixed:**

| Original Column | Violation | Fix Applied |
|---|---|---|
| `donors.organs = JSON ["Kidney","Liver"]` | Array — non-atomic | Created `donor_organs(donor_id, organ_name)` table |
| `donors.medical_history = TEXT` (free-form) | Composite/unstructured | Created `donor_medical_conditions` with typed columns |
| `donors.emergency_contact = VARCHAR` (mixed data) | Composite attribute | Decomposed into `emergency_contact_name`, `emergency_contact_phone`, `emergency_contact_relation` |

✅ **After fix:** Every column holds a single atomic value. All tables satisfy 1NF.

---

### 5.2 Second Normal Form (2NF)
**Rule:** Every non-key attribute must depend on the *whole* primary key (no partial dependencies — applies to composite keys).

**Tables with composite primary keys:**
- `donor_organs(donor_id, organ_name)` → `donor_organ_id` depends on the full composite key ✅
- `matches(donor_id, request_id)` → `matched_at` depends on the full composite key ✅

No other table has a composite primary key. All tables with single-column PKs are automatically in 2NF if in 1NF.

✅ **All tables satisfy 2NF.**

---

### 5.3 Third Normal Form (3NF)
**Rule:** No transitive dependencies. Every non-key attribute must depend *only* on the primary key, not on another non-key attribute.

**Potential transitive dependency analysis:**

| Table | Possible Transitive FD | Resolution |
|---|---|---|
| `organ_requests` | `patient_name → patient_age, patient_gender`? | Not a true FD — same name can appear with different ages in different records. Depends on `request_id`. ✅ |
| `donors` (original) | `user_id → email, name` (info owned by users) | Removed — profile GET uses a JOIN, not denormalized copy |
| `hospitals` (original) | `user_id → name, email` embedded | Removed — profile GET uses a JOIN |

✅ **All tables satisfy 3NF.**

---

### 5.4 Boyce-Codd Normal Form (BCNF)
**Rule:** For every non-trivial functional dependency X → Y, X must be a superkey.

**Analysis:**

| Table | Potential BCNF Violation | Verdict |
|---|---|---|
| `users` | `email → user_id`? email is a candidate key ✅ | In BCNF |
| `donors` | `user_id → donor_id`? user_id is a candidate key ✅ | In BCNF |
| `hospitals` | `license_number → hospital_id`? License is nullable — not always a key | Minor issue; acceptable since NULL values are excluded from UNIQUE constraints |
| `audit_log` | `log_id → all`? log_id is the sole PK ✅ | In BCNF |

✅ **All tables satisfy BCNF (with the noted caveat on nullable license_number).**

---

### 5.5 Fourth Normal Form (4NF)
**Rule:** A table must not contain more than one independent multi-valued dependency.

**Multi-valued dependencies found:**

| Original Location | MVD | Fix |
|---|---|---|
| `donors.organs (JSON)` | `donor_id →→ organ_name` | → `donor_organs` table |
| `donors.medical_history (TEXT)` | `donor_id →→ condition` | → `donor_medical_conditions` table |
| Implicit allergy info in history | `donor_id →→ allergen` | → `donor_allergies` table |

After decomposition, no single table contains more than one independent MVD.

✅ **All tables satisfy 4NF.**

---

### 5.6 Fifth Normal Form (5NF)
**Rule:** Every join dependency in a table is implied by its candidate keys (lossless decomposition).

**Analysis of `matches` table:**  
The `matches(donor_id, request_id)` table represents the result of the organ-matching algorithm. It is the minimal representation of which donor was matched to which request.

If we attempt to decompose:
- `D_O(donor_id, organ_name)` — exists as `donor_organs`  
- `R_O(request_id, organ_type)` — exists in `organ_requests`  
- `D_R(donor_id, request_id)` — this IS the matches table

Reconstructing the matches table by joining all three:
```sql
SELECT d.donor_id, r.request_id
FROM donor_organs d
JOIN organ_requests r ON LOWER(d.organ_name) = r.organ_type
JOIN donors dn ON d.donor_id = dn.donor_id
WHERE FIND_IN_SET(dn.blood_group, compatible_groups(r.blood_group))
```
This join does NOT losslessly reproduce `matches` because:
1. Not all compatible pairs are actually matched (matching happens at approval time)
2. Historical matches could be re-derived differently if compatibility rules change

Therefore, **explicit storage in `matches` is irreducible** — it cannot be decomposed without losing information.

✅ **The schema satisfies 5NF.**

---

## 6. Concurrency Control

### 6.1 Problem Statement
Multiple admin users could attempt to approve the same donor simultaneously. Without concurrency control:
- Two transactions could both read `status = 'pending'`
- Both issue certificates with the same `ODMS-YYYY-00001` UID
- Duplicate matches could be created in the `matches` table
- Race conditions during organ matching could skip or double-match requests

### 6.2 Concurrency Control Techniques Used

#### A. Pessimistic Locking (SELECT ... FOR UPDATE)
Used in the donor approval flow:
```sql
-- Transaction 1: Admin approves donor #5
BEGIN;
SELECT * FROM donors WHERE donor_id = 5 FOR UPDATE;  -- acquires exclusive row lock
-- (Transaction 2 attempting same is BLOCKED here until T1 commits)
UPDATE donors SET status = 'approved' WHERE donor_id = 5;
INSERT INTO certificates ...;
COMMIT;
-- Transaction 2 now proceeds but sees status='approved', prevents duplicate
```

#### B. Organ Matching Transaction
```sql
BEGIN;
SELECT donor_id, blood_group FROM donors WHERE donor_id = ? AND status = 'approved' FOR UPDATE;
SELECT organ_name FROM donor_organs WHERE donor_id = ?;
SELECT * FROM organ_requests WHERE status = 'pending' FOR UPDATE;
-- Check-and-insert for each compatible pair:
INSERT IGNORE INTO matches (donor_id, request_id) VALUES (?, ?);
UPDATE organ_requests SET status = 'matched' WHERE request_id = ?;
COMMIT;
```

**Isolation Level:** MySQL default `REPEATABLE READ` — prevents dirty reads and non-repeatable reads. For the matching function, we rely on `FOR UPDATE` locks to prevent phantom reads within a transaction.

#### C. UNIQUE Constraint as Last Resort
```sql
UNIQUE KEY uq_match (donor_id, request_id)
```
Even if two concurrent transactions attempt to insert the same match pair, the UNIQUE constraint acts as a database-level guard — only one INSERT will succeed; the other will receive a duplicate key error which is caught and handled gracefully.

#### D. Idempotent Certificate Generation (ON DUPLICATE KEY UPDATE)
```sql
INSERT INTO certificates (donor_id, certificate_uid, issue_date)
VALUES (?, ?, CURDATE())
ON DUPLICATE KEY UPDATE certificate_uid = VALUES(certificate_uid), issue_date = CURDATE();
```
Ensures re-running the approval does not create ghost certificates.

### 6.3 Deadlock Prevention
- **Lock ordering:** Always acquire locks in the same order: `donors` → `organ_requests` → `matches`. Consistent ordering prevents circular waits.
- **Short transactions:** Transactions commit as soon as possible. The matching loop is kept within a single transaction to avoid long-held locks.
- **MySQL deadlock detection:** InnoDB automatically detects deadlocks and rolls back the transaction with the least overhead (`innodb_deadlock_detect = ON` by default).

### 6.4 Isolation Levels Summary

| Level | Dirty Read | Non-Repeatable Read | Phantom Read | Used In |
|---|---|---|---|---|
| READ UNCOMMITTED | ✅ possible | ✅ | ✅ | Not used |
| READ COMMITTED | ❌ | ✅ possible | ✅ | Not used |
| **REPEATABLE READ** | ❌ | ❌ | Partial | **Default — all transactions** |
| SERIALIZABLE | ❌ | ❌ | ❌ | Applied via FOR UPDATE in matching |

---

## 7. Recovery Mechanisms

### 7.1 Types of Failures Handled

| Failure Type | Example | Recovery Mechanism |
|---|---|---|
| Transaction Failure | Admin approval crashes mid-way | Rollback via `conn.rollback()` |
| System Failure | Server crash during matching | InnoDB WAL + automatic crash recovery |
| Logical Error | Wrong donor rejected | Audit log allows manual correction |
| Disk Failure | Data corruption | MySQL binary log (binlog) for point-in-time recovery |

### 7.2 Write-Ahead Logging (WAL)
MySQL InnoDB uses WAL via the **Redo Log** (`iblogfile0/1`):
- Before any data page is modified, the change is written to the redo log
- On crash recovery, MySQL replays the redo log to restore committed transactions
- Uncommitted transactions are rolled back using the **Undo Log**

```
Application Write → Redo Log (WAL) → Buffer Pool → Data File
                 ↗
             (persisted first)
```

**In ODMS:** All INSERT, UPDATE operations on `donors`, `organ_requests`, `matches`, and `certificates` are protected by InnoDB's redo log automatically.

### 7.3 Application-Level Rollback (Savepoints)
All state-changing routes use explicit transactions:
```javascript
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  // ... multiple SQL operations ...
  await conn.commit();
} catch (err) {
  await conn.rollback();    // ← automatic recovery on any error
  console.error('Transaction rolled back:', err);
} finally {
  conn.release();           // ← returns connection to pool
}
```

**Tables covered by explicit transactions:**
- `donor registration` (donors + donor_organs atomically)
- `donor profile update` (donors + donor_organs atomically)
- `medical history update` (conditions + allergies + lifestyle atomically)
- `admin donor approval` (donors + certificates atomically)
- `organ matching` (matches + organ_requests status atomically)

### 7.4 Audit Log for Logical Recovery
The `audit_log` table provides an immutable, append-only record of all mutations:

```sql
CREATE TABLE audit_log (
  log_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  table_name   VARCHAR(50)  NOT NULL,
  operation    ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  record_id    INT UNSIGNED NOT NULL,
  performed_by INT UNSIGNED,   -- user_id of actor
  old_values   JSON,           -- state before change
  new_values   JSON,           -- state after change
  ip_address   VARCHAR(45),
  performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Use case — logical recovery example:**
```sql
-- Find who changed donor #5's status and revert if wrong
SELECT * FROM audit_log 
WHERE table_name = 'donors' AND record_id = 5 
ORDER BY performed_at DESC;

-- Output: old_values: {"status": "pending"}, new_values: {"status": "rejected"}, performed_by: 2

-- Admin can now manually correct:
UPDATE donors SET status = 'pending' WHERE donor_id = 5;
INSERT INTO audit_log (table_name, operation, record_id, performed_by, old_values, new_values)
VALUES ('donors', 'UPDATE', 5, 1, '{"status":"rejected"}', '{"status":"pending"}');
```

### 7.5 Checkpoint Strategy
MySQL InnoDB performs automatic checkpoints:
- **Fuzzy Checkpoints:** InnoDB flushes dirty buffer pool pages to disk periodically (`innodb_io_capacity`)
- **Sharp Checkpoint:** Occurs on clean shutdown — all dirty pages flushed
- **Log Checkpoint:** When redo log fills beyond a threshold, a checkpoint is triggered

For ODMS, since this is a transactional OLTP system with moderate write load, the defaults are sufficient. For production scale:
```sql
-- Increase log file size for less frequent checkpoints (better throughput)
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 1  -- full ACID compliance
sync_binlog = 1                     -- binary log sync per transaction
```

### 7.6 Point-in-Time Recovery (PITR) using Binary Log
```bash
# For production recovery after accidental data deletion:
mysqlbinlog --start-datetime="2025-04-12 10:00:00" \
             --stop-datetime="2025-04-12 14:30:00" \
             /var/log/mysql/mysql-bin.000001 | mysql -u root organ_donation_db
```

---

## 8. Summary Table

| Property | Implementation |
|---|---|
| 1NF | `donor_organs` table; atomic emergency contact columns |
| 2NF | No composite key partial dependencies |
| 3NF | No transitive dependencies; lifestyle in separate table |
| BCNF | Every determinant is a candidate key |
| 4NF | MVDs resolved: organs, conditions, allergies in own tables |
| 5NF | `matches` is the irreducible join dependency representation |
| Concurrency | `SELECT FOR UPDATE`, transactions, UNIQUE constraints, lock ordering |
| Recovery | InnoDB WAL (redo/undo log), `conn.rollback()`, audit_log, PITR via binlog |

---

*End of DBMS Report — Organ Donation Management & Certification System*
