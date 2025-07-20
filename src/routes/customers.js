const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');
const { validateCustomer } = require('../middleware/validation');
const logger = require('../utils/logger');

// @desc    Get all customers
// @route   GET /api/v1/customers
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const customers = await Customer.find().populate('robots');
    
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    logger.error('Error fetching customers:', error);
    next(error);
  }
});

// @desc    Get single customer
// @route   GET /api/v1/customers/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('robots');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    logger.error('Error fetching customer:', error);
    next(error);
  }
});

// @desc    Create new customer
// @route   POST /api/v1/customers
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    
    logger.info(`Customer created: ${customer.companyName} by user ${req.user.id}`);
    
    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    logger.error('Error creating customer:', error);
    next(error);
  }
});

// @desc    Update customer
// @route   PUT /api/v1/customers/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    logger.info(`Customer updated: ${customer.companyName} by user ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    logger.error('Error updating customer:', error);
    next(error);
  }
});

// @desc    Delete customer
// @route   DELETE /api/v1/customers/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    await customer.deleteOne();
    
    logger.info(`Customer deleted: ${customer.companyName} by user ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting customer:', error);
    next(error);
  }
});

module.exports = router;

