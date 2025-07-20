const express = require('express');
const {
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  updateMe,
  changePassword
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/login', validate(schemas.userLogin), login);
router.post('/refresh', refresh);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/logout', logout);
router.post('/logout-all', logoutAll);
router.get('/me', getMe);
router.put('/me', validate(schemas.userUpdate), updateMe);
router.put('/change-password', changePassword);

module.exports = router;

