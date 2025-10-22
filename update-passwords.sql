-- Update passwords with correct bcrypt hash for 'password123'
USE healthcare_blockchain;

UPDATE users SET password = '$2a$10$4Bwb.oRj62k5iDgFRCzCJejB/YbCbCtLxdl7C4yNQ92zUq1SM0Cne' WHERE email = 'dr.smith@hospital.com';
UPDATE users SET password = '$2a$10$4Bwb.oRj62k5iDgFRCzCJejB/YbCbCtLxdl7C4yNQ92zUq1SM0Cne' WHERE email = 'dr.jane@hospital.com';
UPDATE users SET password = '$2a$10$4Bwb.oRj62k5iDgFRCzCJejB/YbCbCtLxdl7C4yNQ92zUq1SM0Cne' WHERE email = 'patient1@email.com';
UPDATE users SET password = '$2a$10$4Bwb.oRj62k5iDgFRCzCJejB/YbCbCtLxdl7C4yNQ92zUq1SM0Cne' WHERE email = 'patient2@email.com';

SELECT 'Passwords updated successfully!' AS status;
