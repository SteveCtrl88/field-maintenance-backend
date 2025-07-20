const Robot = require('../models/Robot');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');

// @desc    Get all robots
// @route   GET /api/v1/robots
// @access  Private
exports.getRobots = async (req, res, next) => {
  try {
    const robots = await Robot.find().populate('customer', 'companyName address');
    
    res.status(200).json({
      success: true,
      count: robots.length,
      data: robots
    });
  } catch (error) {
    logger.error('Error fetching robots:', error);
    next(error);
  }
};

// @desc    Get single robot
// @route   GET /api/v1/robots/:id
// @access  Private
exports.getRobot = async (req, res, next) => {
  try {
    const robot = await Robot.findById(req.params.id).populate('customer', 'companyName address');
    
    if (!robot) {
      return res.status(404).json({
        success: false,
        message: 'Robot not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: robot
    });
  } catch (error) {
    logger.error('Error fetching robot:', error);
    next(error);
  }
};

// @desc    Create new robot
// @route   POST /api/v1/robots
// @access  Private (Admin only)
exports.createRobot = async (req, res, next) => {
  try {
    // Verify customer exists
    const customer = await Customer.findById(req.body.customer);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    const robot = await Robot.create(req.body);
    
    // Add robot to customer's robots array
    customer.robots.push(robot._id);
    await customer.save();
    
    await robot.populate('customer', 'companyName address');
    
    logger.info(`Robot created: ${robot.serialNumber} for customer ${customer.companyName} by user ${req.user?.id || 'system'}`);
    
    res.status(201).json({
      success: true,
      data: robot
    });
  } catch (error) {
    logger.error('Error creating robot:', error);
    next(error);
  }
};

// @desc    Update robot
// @route   PUT /api/v1/robots/:id
// @access  Private (Admin only)
exports.updateRobot = async (req, res, next) => {
  try {
    const robot = await Robot.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('customer', 'companyName address');
    
    if (!robot) {
      return res.status(404).json({
        success: false,
        message: 'Robot not found'
      });
    }
    
    logger.info(`Robot updated: ${robot.serialNumber} by user ${req.user?.id || 'system'}`);
    
    res.status(200).json({
      success: true,
      data: robot
    });
  } catch (error) {
    logger.error('Error updating robot:', error);
    next(error);
  }
};

// @desc    Delete robot
// @route   DELETE /api/v1/robots/:id
// @access  Private (Admin only)
exports.deleteRobot = async (req, res, next) => {
  try {
    const robot = await Robot.findById(req.params.id);
    
    if (!robot) {
      return res.status(404).json({
        success: false,
        message: 'Robot not found'
      });
    }
    
    // Remove robot from customer's robots array
    await Customer.findByIdAndUpdate(
      robot.customer,
      { $pull: { robots: robot._id } }
    );
    
    await robot.deleteOne();
    
    logger.info(`Robot deleted: ${robot.serialNumber} by user ${req.user?.id || 'system'}`);
    
    res.status(200).json({
      success: true,
      message: 'Robot deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting robot:', error);
    next(error);
  }
};

// @desc    Get robots by customer
// @route   GET /api/v1/robots/customer/:customerId
// @access  Private
exports.getRobotsByCustomer = async (req, res, next) => {
  try {
    const robots = await Robot.find({ customer: req.params.customerId })
      .populate('customer', 'companyName address');
    
    res.status(200).json({
      success: true,
      count: robots.length,
      data: robots
    });
  } catch (error) {
    logger.error('Error fetching robots by customer:', error);
    next(error);
  }
};

