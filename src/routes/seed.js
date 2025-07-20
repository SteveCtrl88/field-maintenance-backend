const express = require('express');
const { initializeDatabase, getDatabaseStatus } = require('../controllers/seedController');

const router = express.Router();

// @route   POST /api/seed/init
// @desc    Initialize database with demo data
// @access  Public (for initial setup only)
router.post('/init', initializeDatabase);

// @route   GET /api/seed/status
// @desc    Get database initialization status
// @access  Public
router.get('/status', getDatabaseStatus);

module.exports = router;

