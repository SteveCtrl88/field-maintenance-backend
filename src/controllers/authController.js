const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'technician' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('User already exists with this email', 400, 'USER_EXISTS');
  }

  // Create user with passwordHash field
  const user = new User({
    name,
    email: email.toLowerCase(),
    passwordHash: password, // This will be hashed by the pre-save hook
    role,
    isActive: true
  });

  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);
  
  // Add refresh token to user
  await user.addRefreshToken(refreshToken);

  logger.info('User registered successfully', { userId: user._id, email: user.email });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ 
    email: email.toLowerCase(),
    isActive: true 
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);
  
  // Add refresh token to user and update last login
  await user.addRefreshToken(refreshToken);
  await user.updateLastLogin();

  logger.info('User logged in successfully', { userId: user._id, email: user.email });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Refresh token is required', 400, 'MISSING_REFRESH_TOKEN');
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(token);
  
  // Find user and check if refresh token exists
  const user = await User.findById(decoded.userId);
  if (!user || !user.refreshTokens.some(rt => rt.token === token)) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
  
  // Remove old refresh token and add new one
  await user.removeRefreshToken(token);
  await user.addRefreshToken(newRefreshToken);

  logger.info('Token refreshed successfully', { userId: user._id });

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken
      }
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  const userId = req.user.id;

  if (token) {
    // Remove specific refresh token
    const user = await User.findById(userId);
    if (user) {
      await user.removeRefreshToken(token);
    }
  }

  logger.info('User logged out successfully', { userId });

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
const logoutAll = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Remove all refresh tokens
  const user = await User.findById(userId);
  if (user) {
    user.refreshTokens = [];
    await user.save();
  }

  logger.info('User logged out from all devices', { userId });

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profile: user.profile,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe
};


