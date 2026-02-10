const express = require('express');
const router = express.Router();
const {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  getSubjects,
  getQuestionStats
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get subjects (accessible to all authenticated users)
router.get('/subjects/list', getSubjects);

// Admin only routes
router.use(authorize('admin'));

router.get('/stats', getQuestionStats);

router.route('/')
  .get(getQuestions)
  .post(createQuestion);

router.route('/:id')
  .get(getQuestion)
  .put(updateQuestion)
  .delete(deleteQuestion);

module.exports = router;
