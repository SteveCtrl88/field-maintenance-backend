const User = require('../models/User');
const JWTUtil = require('../utils/jwt');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { blacklistToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email }).select('+passwordHash');
  
  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const payload = JWTUtil.createPayload(user);
  const { accessToken, refreshToken } = JWTUtil.generateTokens(payload);

  // Save refresh token to user
  await user.addRefreshToken(refreshToken);
  
  // Update last login
  await user.updateLastLogin();

  // Remove sensitive data from response
  const userResponse = user.toJSON();

  logger.info('User logged in successfully', { userId: user._id, email: user.email });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '15m'
      }
    }
  });
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400, 'REFRESH_TOKEN_REQUIRED');
  }

  // Verify refresh token
  const decoded = JWTUtil.verifyRefreshToken(refreshToken);

  // Find user and check if refresh token exists
  const user = await User.findById(decoded.userId);
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
  }

  // Check if refresh token exists in user's tokens
  const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
  
  if (!tokenExists) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  // Generate new tokens
  const payload = JWTUtil.createPayload(user);
  const { accessToken, refreshToken: newRefreshToken } = JWTUtil.generateTokens(payload);

  // Remove old refresh token and add new one
  await user.removeRefreshToken(refreshToken);
  await user.addRefreshToken(newRefreshToken);

  logger.info('Token refreshed successfully', { userId: user._id });

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRE || '15m'
      }
    }
  });
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const accessToken = req.token;

  // Blacklist access token
  if (accessToken) {
    blacklistToken(accessToken);
  }

  // Remove refresh token from user if provided
  if (refreshToken && req.user) {
    await req.user.removeRefreshToken(refreshToken);
  }

  logger.info('User logged out successfully', { userId: req.user?._id });

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Logout from all devices
// @route   POST /api/v1/auth/logout-all
// @access  Private
const logoutAll = asyncHandler(async (req, res) => {
  const accessToken = req.token;

  // Blacklist current access token
  if (accessToken) {
    blacklistToken(accessToken);
  }

  // Clear all refresh tokens
  req.user.refreshTokens = [];
  await req.user.save();

  logger.info('User logged out from all devices', { userId: req.user._id });

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// @desc    Update current user profile
// @route   PUT /api/v1/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'profile'];
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
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  logger.info('User profile updated', { userId: user._id });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400, 'MISSING_PASSWORDS');
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long', 400, 'PASSWORD_TOO_SHORT');
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+passwordHash');

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400, 'INCORRECT_PASSWORD');
  }

  // Update password
  user.passwordHash = newPassword;
  await user.save();

  // Clear all refresh tokens (force re-login on all devices)
  user.refreshTokens = [];
  await user.save();

  logger.info('Password changed successfully', { userId: user._id });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please login again.'
  });
});

module.exports = {
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  updateMe,
  changePassword
};

