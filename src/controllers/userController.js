const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Admin only)
const getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    search,
    role,
    isActive
  } = req.query;

  // Build query
  const query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role) {
    query.role = role;
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  // Execute query with pagination
  const users = await User.find(query)
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-passwordHash -refreshTokens');

  // Get total count for pagination
  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private (Admin only)
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash -refreshTokens');
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Create new user
// @route   POST /api/v1/users
// @access  Private (Admin only)
const createUser = asyncHandler(async (req, res) => {
  const { email, password, name, role, profile } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User with this email already exists', 400, 'USER_EXISTS');
  }

  // Create user
  const user = await User.create({
    email,
    passwordHash: password,
    name,
    role,
    profile
  });

  logger.info('User created successfully', { 
    userId: user._id, 
    email: user.email,
    createdBy: req.user._id 
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user
    }
  });
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Admin only)
const updateUser = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'role', 'isActive', 'profile'];
  const updates = {};

  // Only allow specific fields to be updated
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields to update', 400, 'NO_UPDATES');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).select('-passwordHash -refreshTokens');

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  logger.info('User updated successfully', { 
    userId: user._id, 
    updatedBy: req.user._id,
    updates: Object.keys(updates)
  });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: {
      user
    }
  });
});

// @desc    Delete user (soft delete)
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError('Cannot delete your own account', 400, 'CANNOT_DELETE_SELF');
  }

  // Soft delete by deactivating
  user.isActive = false;
  await user.save();

  logger.info('User deactivated successfully', { 
    userId: user._id, 
    deletedBy: req.user._id 
  });

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully'
  });
});

// @desc    Reset user password
// @route   PUT /api/v1/users/:id/reset-password
// @access  Private (Admin only)
const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long', 400, 'INVALID_PASSWORD');
  }

  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Update password
  user.passwordHash = newPassword;
  
  // Clear all refresh tokens (force re-login)
  user.refreshTokens = [];
  
  await user.save();

  logger.info('User password reset successfully', { 
    userId: user._id, 
    resetBy: req.user._id 
  });

  res.status(200).json({
    success: true,
    message: 'Password reset successfully'
  });
});

// @desc    Get user statistics
// @route   GET /api/v1/users/stats
// @access  Private (Admin only)
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        inactiveUsers: {
          $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
        },
        adminUsers: {
          $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
        },
        technicianUsers: {
          $sum: { $cond: [{ $eq: ['$role', 'technician'] }, 1, 0] }
        }
      }
    }
  ]);

  const roleDistribution = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);

  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email role createdAt');

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        adminUsers: 0,
        technicianUsers: 0
      },
      roleDistribution,
      recentUsers
    }
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  getUserStats
};

