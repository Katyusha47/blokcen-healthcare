const db = require('../config/database');

class PermissionController {
  // Grant or revoke access
  static async managePermission(req, res) {
    try {
      const { doctorId, granted } = req.body;
      const patientId = req.user.id;

      // Validate patient role
      if (req.user.role !== 'patient') {
        return res.status(403).json({
          success: false,
          message: 'Only patients can manage access permissions'
        });
      }

      // Verify doctor exists
      const [doctors] = await db.query(
        'SELECT id FROM users WHERE id = ? AND role = ?',
        [doctorId, 'doctor']
      );

      if (doctors.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      // Check if permission exists
      const [existingPermissions] = await db.query(
        'SELECT id FROM access_permissions WHERE patient_id = ? AND doctor_id = ?',
        [patientId, doctorId]
      );

      if (existingPermissions.length > 0) {
        // Update existing permission
        const updateField = granted ? 'granted_at = NOW(), revoked_at = NULL' : 'revoked_at = NOW()';
        await db.query(
          `UPDATE access_permissions SET granted = ?, ${updateField} WHERE patient_id = ? AND doctor_id = ?`,
          [granted, patientId, doctorId]
        );
      } else {
        // Insert new permission
        const grantedAt = granted ? new Date() : null;
        await db.query(
          'INSERT INTO access_permissions (patient_id, doctor_id, granted, granted_at) VALUES (?, ?, ?, ?)',
          [patientId, doctorId, granted, grantedAt]
        );
      }

      res.json({
        success: true,
        message: granted ? 'Access granted successfully' : 'Access revoked successfully'
      });
    } catch (error) {
      console.error('Manage permission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to manage permission',
        error: error.message
      });
    }
  }

  // Get all permissions for current user
  static async getPermissions(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let query;
      let params;

      if (userRole === 'patient') {
        query = `SELECT ap.*, u.full_name as doctor_name, u.email as doctor_email, u.phone as doctor_phone
                 FROM access_permissions ap
                 JOIN users u ON ap.doctor_id = u.id
                 WHERE ap.patient_id = ?
                 ORDER BY ap.created_at DESC`;
        params = [userId];
      } else if (userRole === 'doctor') {
        query = `SELECT ap.*, u.full_name as patient_name, u.email as patient_email, u.phone as patient_phone
                 FROM access_permissions ap
                 JOIN users u ON ap.patient_id = u.id
                 WHERE ap.doctor_id = ?
                 ORDER BY ap.created_at DESC`;
        params = [userId];
      }

      const [permissions] = await db.query(query, params);

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      console.error('Get permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve permissions',
        error: error.message
      });
    }
  }

  // Get all doctors (for patient to grant access)
  static async getAllDoctors(req, res) {
    try {
      const [doctors] = await db.query(
        'SELECT id, full_name, email, phone FROM users WHERE role = ? ORDER BY full_name',
        ['doctor']
      );

      res.json({
        success: true,
        data: doctors
      });
    } catch (error) {
      console.error('Get doctors error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve doctors',
        error: error.message
      });
    }
  }

  // Get patients with granted access (for doctors)
  static async getMyPatients(req, res) {
    try {
      const doctorId = req.user.id;

      if (req.user.role !== 'doctor') {
        return res.status(403).json({
          success: false,
          message: 'Only doctors can access this endpoint'
        });
      }

      const [patients] = await db.query(
        `SELECT u.id, u.full_name, u.email, u.phone, ap.granted_at
         FROM users u
         JOIN access_permissions ap ON u.id = ap.patient_id
         WHERE ap.doctor_id = ? AND ap.granted = TRUE
         ORDER BY u.full_name`,
        [doctorId]
      );

      res.json({
        success: true,
        data: patients
      });
    } catch (error) {
      console.error('Get patients error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve patients',
        error: error.message
      });
    }
  }
}

module.exports = PermissionController;
