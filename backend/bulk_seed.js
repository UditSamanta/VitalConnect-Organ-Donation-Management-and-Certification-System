const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/.env' });

const REAL_HOSPITALS = [
  { name: 'AIIMS New Delhi', city: 'Delhi', state: 'Delhi', type: 'government' },
  { name: 'Apollo Hospitals Greams Road', city: 'Chennai', state: 'Tamil Nadu', type: 'private' },
  { name: 'Christian Medical College (CMC)', city: 'Vellore', state: 'Tamil Nadu', type: 'trust' },
  { name: 'PGIMER', city: 'Chandigarh', state: 'Chandigarh', type: 'government' },
  { name: 'Sanjay Gandhi Postgraduate Institute', city: 'Lucknow', state: 'Uttar Pradesh', type: 'government' },
  { name: 'Amrita Institute of Medical Sciences', city: 'Kochi', state: 'Kerala', type: 'trust' },
  { name: 'Medanta - The Medicity', city: 'Gurugram', state: 'Haryana', type: 'private' },
  { name: 'Sir Ganga Ram Hospital', city: 'New Delhi', state: 'Delhi', type: 'trust' },
  { name: 'Kokilaben Dhirubhai Ambani Hospital', city: 'Mumbai', state: 'Maharashtra', type: 'private' },
  { name: 'BLK Super Speciality Hospital', city: 'New Delhi', state: 'Delhi', type: 'private' },
  { name: 'Fortis Memorial Research Institute', city: 'Gurugram', state: 'Haryana', type: 'private' },
  { name: 'Max Super Speciality Hospital Saket', city: 'New Delhi', state: 'Delhi', type: 'private' },
  { name: 'Nanavati Max Super Speciality Hospital', city: 'Mumbai', state: 'Maharashtra', type: 'private' },
  { name: 'Artemis Hospital', city: 'Gurugram', state: 'Haryana', type: 'private' },
  { name: 'Tata Memorial Hospital', city: 'Mumbai', state: 'Maharashtra', type: 'government' },
  { name: 'NIMHANS', city: 'Bengaluru', state: 'Karnataka', type: 'government' },
  { name: 'Indraprastha Apollo Hospitals', city: 'New Delhi', state: 'Delhi', type: 'private' },
  { name: 'Narayana Health City', city: 'Bengaluru', state: 'Karnataka', type: 'private' },
  { name: 'Rajagiri Hospital', city: 'Kochi', state: 'Kerala', type: 'trust' },
  { name: 'KIMS Hospital', city: 'Hyderabad', state: 'Telangana', type: 'private' },
  { name: 'Yashoda Hospitals Secunderabad', city: 'Hyderabad', state: 'Telangana', type: 'private' },
  { name: 'Manipal Hospital HAL Airport Road', city: 'Bengaluru', state: 'Karnataka', type: 'private' },
  { name: 'Care Hospitals Banjara Hills', city: 'Hyderabad', state: 'Telangana', type: 'private' },
  { name: 'Gleneagles Global Health City', city: 'Chennai', state: 'Tamil Nadu', type: 'private' },
  { name: 'Sri Ramachandra Medical Centre', city: 'Chennai', state: 'Tamil Nadu', type: 'private' },
  { name: 'BGS Gleneagles Global Hospitals', city: 'Bengaluru', state: 'Karnataka', type: 'private' },
  { name: 'Asian Institute of Gastroenterology', city: 'Hyderabad', state: 'Telangana', type: 'private' },
  { name: 'Lilavati Hospital and Research Centre', city: 'Mumbai', state: 'Maharashtra', type: 'trust' },
  { name: 'Breach Candy Hospital', city: 'Mumbai', state: 'Maharashtra', type: 'trust' },
  { name: 'P. D. Hinduja Hospital', city: 'Mumbai', state: 'Maharashtra', type: 'trust' },
  { name: 'Saifee Hospital', city: 'Mumbai', state: 'Maharashtra', type: 'trust' },
  { name: 'Ruby Hall Clinic', city: 'Pune', state: 'Maharashtra', type: 'trust' },
  { name: 'Deenanath Mangeshkar Hospital', city: 'Pune', state: 'Maharashtra', type: 'trust' },
  { name: 'Sahyadri Super Speciality Hospital', city: 'Pune', state: 'Maharashtra', type: 'private' },
  { name: 'KEM Hospital', city: 'Mumbai', state: 'Maharashtra', type: 'government' },
  { name: 'LTMG Hospital Sion', city: 'Mumbai', state: 'Maharashtra', type: 'government' },
  { name: 'B. J. Medical College', city: 'Pune', state: 'Maharashtra', type: 'government' },
  { name: 'Rajiv Gandhi Government General Hospital', city: 'Chennai', state: 'Tamil Nadu', type: 'government' },
  { name: 'King George Medical University', city: 'Lucknow', state: 'Uttar Pradesh', type: 'government' },
  { name: 'JIPMER', city: 'Puducherry', state: 'Puducherry', type: 'government' },
  { name: 'Sree Chitra Tirunal Institute', city: 'Trivandrum', state: 'Kerala', type: 'government' },
  { name: 'Nizam Institute of Medical Sciences', city: 'Hyderabad', state: 'Telangana', type: 'government' },
  { name: 'Osmania General Hospital', city: 'Hyderabad', state: 'Telangana', type: 'government' },
  { name: 'Gandhi Hospital', city: 'Hyderabad', state: 'Telangana', type: 'government' },
  { name: 'Victoria Hospital', city: 'Bengaluru', state: 'Karnataka', type: 'government' },
  { name: 'Bowring and Lady Curzon Hospital', city: 'Bengaluru', state: 'Karnataka', type: 'government' },
  { name: 'Medical College Kolkata', city: 'Kolkata', state: 'West Bengal', type: 'government' },
  { name: 'NRS Medical College', city: 'Kolkata', state: 'West Bengal', type: 'government' },
  { name: 'SSKM Hospital', city: 'Kolkata', state: 'West Bengal', type: 'government' },
  { name: 'Apollo Multispeciality Hospitals', city: 'Kolkata', state: 'West Bengal', type: 'private' },
  { name: 'AMRI Hospitals Dhakuria', city: 'Kolkata', state: 'West Bengal', type: 'private' },
  { name: 'Fortis Hospital Anandapur', city: 'Kolkata', state: 'West Bengal', type: 'private' },
  { name: 'Medica Super Specialty Hospital', city: 'Kolkata', state: 'West Bengal', type: 'private' },
  { name: 'Kalinga Institute of Medical Sciences', city: 'Bhubaneswar', state: 'Odisha', type: 'private' },
  { name: 'Apollo Hospitals Bhubaneswar', city: 'Bhubaneswar', state: 'Odisha', type: 'private' },
  { name: 'SUM Ultimate Medicare', city: 'Bhubaneswar', state: 'Odisha', type: 'private' },
  { name: 'Gauhati Medical College', city: 'Guwahati', state: 'Assam', type: 'government' },
  { name: 'Down Town Hospital', city: 'Guwahati', state: 'Assam', type: 'private' },
  { name: 'GNRC Hospitals', city: 'Guwahati', state: 'Assam', type: 'private' },
  { name: 'NEIGRIHMS', city: 'Shillong', state: 'Meghalaya', type: 'government' },
  { name: 'Kasturba Hospital', city: 'Manipal', state: 'Karnataka', type: 'trust' },
  { name: 'St. Johns Medical College Hospital', city: 'Bengaluru', state: 'Karnataka', type: 'trust' },
  { name: 'M. S. Ramaiah Memorial Hospital', city: 'Bengaluru', state: 'Karnataka', type: 'private' },
  { name: 'Dayanand Medical College', city: 'Ludhiana', state: 'Punjab', type: 'private' },
  { name: 'Christian Medical College Ludhiana', city: 'Ludhiana', state: 'Punjab', type: 'trust' },
  { name: 'Fortis Hospital Mohali', city: 'Mohali', state: 'Punjab', type: 'private' },
  { name: 'Max Super Speciality Hospital Mohali', city: 'Mohali', state: 'Punjab', type: 'private' },
  { name: 'GMCH Chandigarh', city: 'Chandigarh', state: 'Chandigarh', type: 'government' },
  { name: 'AIIMS Rishikesh', city: 'Rishikesh', state: 'Uttarakhand', type: 'government' },
  { name: 'AIIMS Bhopal', city: 'Bhopal', state: 'Madhya Pradesh', type: 'government' },
  { name: 'AIIMS Bhubaneswar', city: 'Bhubaneswar', state: 'Odisha', type: 'government' },
  { name: 'AIIMS Jodhpur', city: 'Jodhpur', state: 'Rajasthan', type: 'government' },
  { name: 'AIIMS Raipur', city: 'Raipur', state: 'Chhattisgarh', type: 'government' },
  { name: 'AIIMS Patna', city: 'Patna', state: 'Bihar', type: 'government' },
  { name: 'IGIMS Patna', city: 'Patna', state: 'Bihar', type: 'government' }
];

const ORGANS = ['Kidney', 'Liver', 'Heart', 'Lungs', 'Pancreas', 'Corneas', 'Skin', 'Bone Marrow'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Digin@5981',
    database: process.env.DB_NAME || 'organ_donation_db',
  });

  try {
    const timestamp = Date.now();
    console.log('Generating password hash...');
    const hash = await bcrypt.hash('password', 10);
    
    console.log('Inserting 75 real hospitals...');
    for (let i = 0; i < REAL_HOSPITALS.length; i++) {
        const hosp = REAL_HOSPITALS[i];
        
        // Extract a clean domain-like string from the name
        const cleanName = hosp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = `admin@${cleanName.substring(0, 15)}.com`;
        
        const [uRes] = await pool.query(
          `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'hospital') ON DUPLICATE KEY UPDATE name=name`,
          [hosp.name, email, hash]
        );
        const userId = uRes.insertId;
        
        if (userId) {
            await pool.query(
              `INSERT INTO hospitals (user_id, hospital_name, hospital_type, address, city, state, pincode, contact_number, is_verified)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                userId, 
                hosp.name, 
                hosp.type,
                `Main Road, Landmark Area`, 
                hosp.city, 
                hosp.state, 
                '400001', 
                `9876${Math.floor(100000 + Math.random() * 900000)}`,
                Math.random() > 0.1 // 90% verified
              ]
            );
        }
    }

    console.log('Inserting 450 donors...');
    for (let i = 1; i <= 450; i++) {
        const email = `donor_${timestamp}_${i}@example.com`;
        const [uRes] = await pool.query(
          `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'donor')`,
          [`Donor ${i}`, email, hash]
        );
        const userId = uRes.insertId;
        
        const [dRes] = await pool.query(
          `INSERT INTO donors (user_id, age, gender, blood_group, address, city, state, pincode, contact_number, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            18 + Math.floor(Math.random() * 40),
            Math.random() > 0.5 ? 'male' : 'female',
            BLOOD_GROUPS[Math.floor(Math.random() * BLOOD_GROUPS.length)],
            `12${i} Random Street`,
            CITIES[Math.floor(Math.random() * CITIES.length)],
            'Maharashtra',
            '400001',
            `9876500${i.toString().padStart(3, '0')}`,
            Math.random() > 0.3 ? 'approved' : 'pending' // 70% approved
          ]
        );
        const donorId = dRes.insertId;

        // Add 1-3 organs for this donor
        const numOrgans = 1 + Math.floor(Math.random() * 3);
        const shuffledOrgans = [...ORGANS].sort(() => 0.5 - Math.random());
        for (let j = 0; j < numOrgans; j++) {
            await pool.query(
                `INSERT IGNORE INTO donor_organs (donor_id, organ_name) VALUES (?, ?)`,
                [donorId, shuffledOrgans[j]]
            );
        }
    }

    console.log('Successfully generated 75 REAL hospitals and 450 donors!');
    process.exit(0);

  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

run();
