const db = require('../config/database');
const fabricConnection = require('../config/fabric');
const HashUtils = require('../utils/hashUtils');

class RecordController {
  // Create new medical record
  static async createRecord(req, res) {
    try {
      const { patientId, diagnosis, treatment, medications, notes } = req.body;
      const doctorId = req.user.id;

      // Validate doctor role
      if (req.user.role !== 'doctor') {
        return res.status(403).json({
          success: false,
          message: 'Only doctors can create medical records'
        });
      }

      // Check if doctor has permission
      const [permissions] = await db.query(
        'SELECT granted FROM access_permissions WHERE patient_id = ? AND doctor_id = ?',
        [patientId, doctorId]
      );

      if (permissions.length === 0 || !permissions[0].granted) {
        // Log validation error
        await db.query(
          'INSERT INTO validation_logs (validation_type, is_valid, error_message, validated_by) VALUES (?, ?, ?, ?)',
          ['permission', false, 'Doctor does not have permission to access this patient', doctorId]
        );

        return res.status(403).json({
          success: false,
          message: 'You do not have permission to create records for this patient'
        });
      }

      // Generate hash
      const recordData = {
        patientId,
        doctorId,
        diagnosis,
        treatment,
        medications,
        timestamp: new Date().toISOString()
      };
      const recordHash = HashUtils.generateHash(recordData);

      // Insert into database
      const [result] = await db.query(
        'INSERT INTO medical_records (patient_id, doctor_id, diagnosis, treatment, medications, notes, record_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [patientId, doctorId, diagnosis, treatment, medications, notes, recordHash]
      );

      const recordId = result.insertId;

      try {
        // Store metadata in blockchain
        const blockchainData = {
          recordId: recordId.toString(),
          patientId: patientId.toString(),
          doctorId: doctorId.toString(),
          recordHash,
          timestamp: new Date().toISOString(),
          action: 'CREATE'
        };

        await fabricConnection.submitTransaction(
          'createMedicalRecord',
          JSON.stringify(blockchainData)
        );

        // Update with blockchain transaction ID
        const txId = HashUtils.generateTxId();
        await db.query(
          'UPDATE medical_records SET blockchain_tx_id = ? WHERE id = ?',
          [txId, recordId]
        );

        // Log successful validation
        await db.query(
          'INSERT INTO validation_logs (record_id, validation_type, is_valid, validated_by) VALUES (?, ?, ?, ?)',
          [recordId, 'blockchain', true, doctorId]
        );

        console.log('✅ Medical record stored on blockchain');
      } catch (blockchainError) {
        console.error('⚠️ Blockchain storage failed:', blockchainError.message);
        // Record is still saved in database, but not on blockchain
        await db.query(
          'INSERT INTO validation_logs (record_id, validation_type, is_valid, error_message, validated_by) VALUES (?, ?, ?, ?, ?)',
          [recordId, 'blockchain', false, blockchainError.message, doctorId]
        );
      }

      res.status(201).json({
        success: true,
        message: 'Medical record created successfully',
        data: {
          recordId,
          recordHash
        }
      });
    } catch (error) {
      console.error('Create record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create medical record',
        error: error.message
      });
    }
  }

  // Get medical record by ID
  static async getRecord(req, res) {
    try {
      const recordId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Get record
      const [records] = await db.query(
        `SELECT mr.*, 
         p.full_name as patient_name, p.email as patient_email,
         d.full_name as doctor_name, d.email as doctor_email
         FROM medical_records mr
         JOIN users p ON mr.patient_id = p.id
         JOIN users d ON mr.doctor_id = d.id
         WHERE mr.id = ?`,
        [recordId]
      );

      if (records.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Medical record not found'
        });
      }

      const record = records[0];

      // Check access permission
      if (userRole === 'patient' && record.patient_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this record'
        });
      }

      if (userRole === 'doctor') {
        const [permissions] = await db.query(
          'SELECT granted FROM access_permissions WHERE patient_id = ? AND doctor_id = ?',
          [record.patient_id, userId]
        );

        if (permissions.length === 0 || !permissions[0].granted) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to view this record'
          });
        }
      }

      // Verify hash
      const recordData = {
        patientId: record.patient_id,
        doctorId: record.doctor_id,
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        medications: record.medications,
        timestamp: record.created_at.toISOString()
      };

      const isHashValid = HashUtils.verifyHash(recordData, record.record_hash);

      res.json({
        success: true,
        data: {
          ...record,
          hashValid: isHashValid
        }
      });
    } catch (error) {
      console.error('Get record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve medical record',
        error: error.message
      });
    }
  }

  // Get all records for a user
  static async getRecords(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let query;
      let params;

      if (userRole === 'patient') {
        query = `SELECT mr.*, d.full_name as doctor_name, d.email as doctor_email
                 FROM medical_records mr
                 JOIN users d ON mr.doctor_id = d.id
                 WHERE mr.patient_id = ?
                 ORDER BY mr.created_at DESC`;
        params = [userId];
      } else if (userRole === 'doctor') {
        query = `SELECT mr.*, p.full_name as patient_name, p.email as patient_email
                 FROM medical_records mr
                 JOIN users p ON mr.patient_id = p.id
                 JOIN access_permissions ap ON mr.patient_id = ap.patient_id AND ap.doctor_id = ?
                 WHERE ap.granted = TRUE
                 ORDER BY mr.created_at DESC`;
        params = [userId];
      }

      const [records] = await db.query(query, params);

      res.json({
        success: true,
        data: records
      });
    } catch (error) {
      console.error('Get records error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve medical records',
        error: error.message
      });
    }
  }
}

module.exports = RecordController;
