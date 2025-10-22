const express = require('express');
const router = express.Router();
const RecordController = require('../controllers/recordController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.post('/', RecordController.createRecord);
router.get('/', RecordController.getRecords);
router.get('/:id', RecordController.getRecord);

module.exports = router;
