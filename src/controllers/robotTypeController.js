const RobotType = require('../models/RobotType');
const logger = require('../utils/logger');

// @desc    Get all robot types
// @route   GET /api/v1/robot-types
// @access  Private
exports.getRobotTypes = async (req, res, next) => {
  try {
    const robotTypes = await RobotType.find({ isActive: true }).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: robotTypes.length,
      data: robotTypes
    });
  } catch (error) {
    logger.error('Error fetching robot types:', error);
    next(error);
  }
};

// @desc    Get single robot type
// @route   GET /api/v1/robot-types/:id
// @access  Private
exports.getRobotType = async (req, res, next) => {
  try {
    const robotType = await RobotType.findById(req.params.id);
    
    if (!robotType) {
      return res.status(404).json({
        success: false,
        message: 'Robot type not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: robotType
    });
  } catch (error) {
    logger.error('Error fetching robot type:', error);
    next(error);
  }
};

// @desc    Create new robot type
// @route   POST /api/v1/robot-types
// @access  Private (Admin only)
exports.createRobotType = async (req, res, next) => {
  try {
    const {
      name,
      description,
      manufacturer,
      model,
      image,
      specifications,
      maintenanceItems
    } = req.body;

    // Validate required fields
    if (!name || !description || !manufacturer || !model) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, manufacturer, and model'
      });
    }

    const robotType = await RobotType.create({
      name,
      description,
      manufacturer,
      model,
      image: image || '/api/placeholder/200/150',
      specifications: specifications || {},
      maintenanceItems: maintenanceItems || []
    });

    res.status(201).json({
      success: true,
      data: robotType
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Robot type with this name already exists'
      });
    }
    logger.error('Error creating robot type:', error);
    next(error);
  }
};

// @desc    Update robot type
// @route   PUT /api/v1/robot-types/:id
// @access  Private (Admin only)
exports.updateRobotType = async (req, res, next) => {
  try {
    let robotType = await RobotType.findById(req.params.id);

    if (!robotType) {
      return res.status(404).json({
        success: false,
        message: 'Robot type not found'
      });
    }

    robotType = await RobotType.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: robotType
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Robot type with this name already exists'
      });
    }
    logger.error('Error updating robot type:', error);
    next(error);
  }
};

// @desc    Delete robot type
// @route   DELETE /api/v1/robot-types/:id
// @access  Private (Admin only)
exports.deleteRobotType = async (req, res, next) => {
  try {
    const robotType = await RobotType.findById(req.params.id);

    if (!robotType) {
      return res.status(404).json({
        success: false,
        message: 'Robot type not found'
      });
    }

    // Soft delete by setting isActive to false
    robotType.isActive = false;
    robotType.updatedAt = new Date();
    await robotType.save();

    res.status(200).json({
      success: true,
      message: 'Robot type deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting robot type:', error);
    next(error);
  }
};

