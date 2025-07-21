const express = require('express');
const router = express.Router();
const {
  getRobotTypes,
  getRobotType,
  createRobotType,
  updateRobotType,
  deleteRobotType
} = require('../controllers/robotTypeController');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all robot types
// @route   GET /api/v1/robot-types
// @access  Private
router.get('/', protect, getRobotTypes);

// @desc    Get single robot type
// @route   GET /api/v1/robot-types/:id
// @access  Private
router.get('/:id', protect, getRobotType);

// @desc    Create new robot type
// @route   POST /api/v1/robot-types
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), createRobotType);

// @desc    Update robot type
// @route   PUT /api/v1/robot-types/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), updateRobotType);

// @desc    Delete robot type
// @route   DELETE /api/v1/robot-types/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), deleteRobotType);

module.exports = router;

