const JWTUtil = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

// Token blacklist (in production, use Redis)
const tokenBlacklist = new Set();

const authenticate = async (req, res, next) => {
  try {
    const token = JWTUtil.getTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }

    // Verify token
    const decoded = JWTUtil.verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokens');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.message.includes('Invalid')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = JWTUtil.getTokenFromHeader(req.headers.authorization);
    
    if (token && !tokenBlacklist.has(token)) {
      const decoded = JWTUtil.verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokens');
      
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't return errors, just continue without user
    next();
  }
};

const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  
  // Clean up old tokens periodically (in production, use Redis with TTL)
  if (tokenBlacklist.size > 10000) {
    const tokensArray = Array.from(tokenBlacklist);
    tokenBlacklist.clear();
    // Keep only recent tokens (this is a simple cleanup, improve in production)
    tokensArray.slice(-5000).forEach(t => tokenBlacklist.add(t));
  }
};

const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  blacklistToken,
  isTokenBlacklisted
};

