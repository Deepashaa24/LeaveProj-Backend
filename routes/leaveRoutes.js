const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getLeaves,
  getLeave,
  updateLeaveStatus,
  deleteLeave,
  getLeaveStats
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Student and Admin routes
router.route('/')
  .get(getLeaves)
  .post(authorize('student'), applyLeave);

router.get('/stats', authorize('admin'), getLeaveStats);

router.route('/:id')
  .get(getLeave)
  .delete(deleteLeave);

// Admin only routes
router.put('/:id/status', authorize('admin'), updateLeaveStatus);

module.exports = router;
