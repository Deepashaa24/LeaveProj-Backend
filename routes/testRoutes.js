const express = require('express');
const router = express.Router();
const {
  getTestForLeave,
  submitAnswer,
  submitTest,
  trackViolation,
  getTestResult
} = require('../controllers/testController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Student routes
router.get('/leave/:leaveId', authorize('student'), getTestForLeave);
router.post('/:testId/answer', authorize('student'), submitAnswer);
router.post('/:testId/submit', authorize('student'), submitTest);
router.post('/:testId/violation', authorize('student'), trackViolation);

// Both student and admin can view results
router.get('/:testId/result', getTestResult);

module.exports = router;
