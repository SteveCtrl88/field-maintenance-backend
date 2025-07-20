const jwt = require('jsonwebtoken');
const logger = require('./logger');

class JWTUtil {
  static generateTokens(payload) {
    try {
      const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { 
          expiresIn: process.env.JWT_EXPIRE || '15m',
          issuer: 'field-maintenance-api',
          audience: 'field-maintenance-app'
        }
      );

      const refreshToken = jwt.sign(
        { userId: payload.userId },
        process.env.JWT_REFRESH_SECRET,
        { 
          expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
          issuer: 'field-maintenance-api',
          audience: 'field-maintenance-app'
        }
      );

      return { accessToken, refreshToken };
    } catch (error) {
      logger.error('Error generating tokens:', error);
      throw new Error('Token generation failed');
    }
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'field-maintenance-api',
        audience: 'field-maintenance-app'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        issuer: 'field-maintenance-api',
        audience: 'field-maintenance-app'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  }

  static getTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  static createPayload(user) {
    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive
    };
  }
}

module.exports = JWTUtil;

