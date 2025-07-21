const Inspection = require('../models/Inspection');
const Robot = require('../models/Robot');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');

// @desc    Get all inspections
// @route   GET /api/v1/inspections
// @access  Private
exports.getInspections = async (req, res, next) => {
  try {
    const inspections = await Inspection.find()
      .populate('robot', 'serialNumber model')
      .populate('customer', 'companyName')
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: inspections.length,
      data: inspections
    });
  } catch (error) {
    logger.error('Error fetching inspections:', error);
    next(error);
  }
};

// @desc    Get single inspection
// @route   GET /api/v1/inspections/:id
// @access  Private
exports.getInspection = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('robot', 'serialNumber model')
      .populate('customer', 'companyName');
    
    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: inspection
    });
  } catch (error) {
    logger.error('Error fetching inspection:', error);
    next(error);
  }
};

// @desc    Create new inspection
// @route   POST /api/v1/inspections
// @access  Private
exports.createInspection = async (req, res, next) => {
  try {
    const {
      robotSerial,
      customer,
      technician,
      date,
      status,
      progress,
      maintenanceItems,
      notes,
      images
    } = req.body;

    // Validate required fields
    if (!robotSerial || !customer || !technician || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide robotSerial, customer, technician, and date'
      });
    }

    const inspection = await Inspection.create({
      robotSerial,
      customer,
      technician,
      date,
      status: status || 'scheduled',
      progress: progress || 0,
      maintenanceItems: maintenanceItems || [],
      notes: notes || '',
      images: images || []
    });

    res.status(201).json({
      success: true,
      data: inspection
    });
  } catch (error) {
    logger.error('Error creating inspection:', error);
    next(error);
  }
};

// @desc    Update inspection
// @route   PUT /api/v1/inspections/:id
// @access  Private
exports.updateInspection = async (req, res, next) => {
  try {
    let inspection = await Inspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }

    inspection = await Inspection.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: inspection
    });
  } catch (error) {
    logger.error('Error updating inspection:', error);
    next(error);
  }
};

// @desc    Delete inspection
// @route   DELETE /api/v1/inspections/:id
// @access  Private (Admin only)
exports.deleteInspection = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }

    await inspection.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Inspection deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting inspection:', error);
    next(error);
  }
};

// @desc    Get inspections by robot serial
// @route   GET /api/v1/inspections/robot/:robotSerial
// @access  Private
exports.getInspectionsByRobot = async (req, res, next) => {
  try {
    const inspections = await Inspection.find({ robotSerial: req.params.robotSerial })
      .populate('customer', 'companyName')
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: inspections.length,
      data: inspections
    });
  } catch (error) {
    logger.error('Error fetching inspections by robot:', error);
    next(error);
  }
};

// @desc    Get inspections by customer
// @route   GET /api/v1/inspections/customer/:customerName
// @access  Private
exports.getInspectionsByCustomer = async (req, res, next) => {
  try {
    const inspections = await Inspection.find({ customer: req.params.customerName })
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: inspections.length,
      data: inspections
    });
  } catch (error) {
    logger.error('Error fetching inspections by customer:', error);
    next(error);
  }
};

