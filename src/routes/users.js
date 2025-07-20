const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  getUserStats
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/stats', authorize('admin'), getUserStats);
router.get('/', authorize('admin'), validate(schemas.queryParams, 'query'), getUsers);
router.post('/', authorize('admin'), validate(schemas.userCreate), createUser);

router.route('/:id')
  .get(authorize('admin'), validate(schemas.objectId, 'params'), getUser)
  .put(authorize('admin'), validate(schemas.objectId, 'params'), validate(schemas.userUpdate), updateUser)
  .delete(authorize('admin'), validate(schemas.objectId, 'params'), deleteUser);

router.put('/:id/reset-password', 
  authorize('admin'), 
  validate(schemas.objectId, 'params'), 
  resetPassword
);

module.exports = router;

