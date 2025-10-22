const db = require('../config/database');
const fabricConnection = require('../config/fabric');

class AuditController {
  // Get audit trail for a specific record
  static async getAuditTrail(req, res) {
    try {
      const recordId = req.params.recordId;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Verify access to the record
      const [records] = await db.query(
        'SELECT patient_id, doctor_id FROM medical_records WHERE id = ?',
        [recordId]
      );

      if (records.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Medical record not found'
        });
      }

      const record = records[0];

      // Check permission
      if (userRole === 'patient' && record.patient_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this audit trail'
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
            message: 'You do not have permission to view this audit trail'
          });
        }
      }

      // Get validation logs from database
      const [logs] = await db.query(
        `SELECT vl.*, u.full_name as validated_by_name
         FROM validation_logs vl
         LEFT JOIN users u ON vl.validated_by = u.id
         WHERE vl.record_id = ?
         ORDER BY vl.created_at DESC`,
        [recordId]
      );

      // Try to get blockchain audit trail
      let blockchainAudit = null;
      try {
        blockchainAudit = await fabricConnection.evaluateTransaction(
          'getRecordHistory',
          recordId.toString()
        );
      } catch (error) {
        console.log('⚠️ Could not retrieve blockchain audit:', error.message);
      }

      res.json({
        success: true,
        data: {
          databaseLogs: logs,
          blockchainAudit: blockchainAudit || 'Blockchain audit not available'
        }
      });
    } catch (error) {
      console.error('Get audit trail error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit trail',
        error: error.message
      });
    }
  }

  // Get all validation logs
  static async getAllLogs(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let query;
      let params;

      if (userRole === 'patient') {
        query = `SELECT vl.*, u.full_name as validated_by_name, mr.id as record_id
                 FROM validation_logs vl
                 LEFT JOIN users u ON vl.validated_by = u.id
                 LEFT JOIN medical_records mr ON vl.record_id = mr.id
                 WHERE mr.patient_id = ?
                 ORDER BY vl.created_at DESC
                 LIMIT 100`;
        params = [userId];
      } else if (userRole === 'doctor') {
        query = `SELECT vl.*, u.full_name as validated_by_name, mr.id as record_id
                 FROM validation_logs vl
                 LEFT JOIN users u ON vl.validated_by = u.id
                 LEFT JOIN medical_records mr ON vl.record_id = mr.id
                 WHERE vl.validated_by = ?
                 ORDER BY vl.created_at DESC
                 LIMIT 100`;
        params = [userId];
      }

      const [logs] = await db.query(query, params);

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('Get logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve logs',
        error: error.message
      });
    }
  }
}

module.exports = AuditController;
