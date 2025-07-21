const express = require('express');
const router = express.Router();
const {
  getInspections,
  getInspection,
  createInspection,
  updateInspection,
  deleteInspection,
  getInspectionsByRobot,
  getInspectionsByCustomer
} = require('../controllers/inspectionController');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all inspections
// @route   GET /api/v1/inspections
// @access  Private
router.get('/', protect, getInspections);

// @desc    Get inspections by robot
// @route   GET /api/v1/inspections/robot/:robotSerial
// @access  Private
router.get('/robot/:robotSerial', protect, getInspectionsByRobot);

// @desc    Get inspections by customer
// @route   GET /api/v1/inspections/customer/:customerName
// @access  Private
router.get('/customer/:customerName', protect, getInspectionsByCustomer);

// @desc    Get single inspection
// @route   GET /api/v1/inspections/:id
// @access  Private
router.get('/:id', protect, getInspection);

// @desc    Create new inspection
// @route   POST /api/v1/inspections
// @access  Private
router.post('/', protect, createInspection);

// @desc    Update inspection
// @route   PUT /api/v1/inspections/:id
// @access  Private
router.put('/:id', protect, updateInspection);

// @desc    Delete inspection
// @route   DELETE /api/v1/inspections/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), deleteInspection);

module.exports = router;

