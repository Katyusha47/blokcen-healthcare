const express = require('express');
const router = express.Router();
const PermissionController = require('../controllers/permissionController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.post('/', PermissionController.managePermission);
router.get('/', PermissionController.getPermissions);
router.get('/doctors/all', PermissionController.getAllDoctors);
router.get('/patients/my', PermissionController.getMyPatients);

module.exports = router;
