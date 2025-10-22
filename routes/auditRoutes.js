const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/:recordId', AuditController.getAuditTrail);
router.get('/logs/all', AuditController.getAllLogs);

module.exports = router;
