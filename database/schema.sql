-- Create Database
CREATE DATABASE IF NOT EXISTS healthcare_blockchain;
USE healthcare_blockchain;

-- Users Table (Doctors and Patients)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('doctor', 'patient') NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Medical Records Table
CREATE TABLE medical_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  diagnosis TEXT NOT NULL,
  treatment TEXT,
  medications TEXT,
  notes TEXT,
  record_hash VARCHAR(64) NOT NULL,
  blockchain_tx_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_patient (patient_id),
  INDEX idx_doctor (doctor_id),
  INDEX idx_hash (record_hash)
);

-- Access Permissions Table
CREATE TABLE access_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  granted BOOLEAN DEFAULT FALSE,
  granted_at TIMESTAMP NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_permission (patient_id, doctor_id),
  INDEX idx_patient_doctor (patient_id, doctor_id)
);

-- Validation Logs Table
CREATE TABLE validation_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  record_id INT,
  validation_type ENUM('hash', 'permission', 'blockchain') NOT NULL,
  is_valid BOOLEAN NOT NULL,
  error_message TEXT,
  validated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES medical_records(id) ON DELETE SET NULL,
  FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_record (record_id),
  INDEX idx_type (validation_type)
);

-- Insert sample data
-- Password for all: password123 (hashed with bcrypt)
INSERT INTO users (email, password, full_name, role, phone) VALUES
('dr.smith@hospital.com', '$2a$10$4Bwb.oRj62k5iDgFRCzCJejB/YbCbCtLxdl7C4yNQ92zUq1SM0Cne', 'Dr. John Smith', 'doctor', '081234567890'),
('dr.jane@hospital.com', '$2a$10$4Bwb.oRj62k5iDgFRCzCJejB/YbCbCtLxdl7C4yNQ92zUq1SM0Cne', 'Dr. Jane Doe', 'doctor', '081234567891'),
('patient1@email.com', '$2a$10$4Bwb.oRj62k5iDgFRCzCJejB/YbCbCtLxdl7C4yNQ92zUq1SM0Cne', 'Ahmad Wijaya', 'patient', '081234567892'),
('patient2@email.com', '$2a$10$4Bwb.oRj62k5iDgFRCzCJejB/YbCbCtLxdl7C4yNQ92zUq1SM0Cne', 'Siti Nurhaliza', 'patient', '081234567893');

-- Grant some permissions
INSERT INTO access_permissions (patient_id, doctor_id, granted, granted_at) VALUES
(3, 1, TRUE, NOW()),
(4, 2, TRUE, NOW());
