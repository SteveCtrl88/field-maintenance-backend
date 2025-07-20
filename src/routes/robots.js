const express = require('express');
const router = express.Router();
const {
  getRobots,
  getRobot,
  createRobot,
  updateRobot,
  deleteRobot,
  getRobotsByCustomer
} = require('../controllers/robotController');
const { protect, authorize } = require('../middleware/auth');
const { validateRobot } = require('../middleware/validation');

// @desc    Get all robots
// @route   GET /api/v1/robots
// @access  Private
router.get('/', protect, getRobots);

// @desc    Get robots by customer
// @route   GET /api/v1/robots/customer/:customerId
// @access  Private
router.get('/customer/:customerId', protect, getRobotsByCustomer);

// @desc    Get single robot
// @route   GET /api/v1/robots/:id
// @access  Private
router.get('/:id', protect, getRobot);

// @desc    Create new robot
// @route   POST /api/v1/robots
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), createRobot);

// @desc    Update robot
// @route   PUT /api/v1/robots/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), updateRobot);

// @desc    Delete robot
// @route   DELETE /api/v1/robots/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), deleteRobot);

module.exports = router;

