const Question = require('../models/Question');

/**
 * @desc    Create question
 * @route   POST /api/questions
 * @access  Private (Admin)
 */
exports.createQuestion = async (req, res, next) => {
  try {
    const questionData = {
      ...req.body,
      createdBy: req.user.id
    };

    const question = await Question.create(questionData);

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all questions
 * @route   GET /api/questions
 * @access  Private (Admin)
 */
exports.getQuestions = async (req, res, next) => {
  try {
    const { questionType, subject, difficulty, page = 1, limit = 20 } = req.query;

    let query = {};

    if (questionType) query.questionType = questionType;
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;

    const skip = (page - 1) * limit;

    const questions = await Question.find(query)
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Question.countDocuments(query);

    res.status(200).json({
      success: true,
      count: questions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single question
 * @route   GET /api/questions/:id
 * @access  Private (Admin)
 */
exports.getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update question
 * @route   PUT /api/questions/:id
 * @access  Private (Admin)
 */
exports.updateQuestion = async (req, res, next) => {
  try {
    let question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete question
 * @route   DELETE /api/questions/:id
 * @access  Private (Admin)
 */
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    await question.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get subjects list
 * @route   GET /api/questions/subjects/list
 * @access  Private
 */
exports.getSubjects = async (req, res, next) => {
  try {
    const subjects = await Question.distinct('subject');

    res.status(200).json({
      success: true,
      data: subjects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get question statistics
 * @route   GET /api/questions/stats
 * @access  Private (Admin)
 */
exports.getQuestionStats = async (req, res, next) => {
  try {
    const totalQuestions = await Question.countDocuments();
    
    const byType = await Question.aggregate([
      {
        $group: {
          _id: '$questionType',
          count: { $sum: 1 }
        }
      }
    ]);

    const byDifficulty = await Question.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    const bySubject = await Question.aggregate([
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalQuestions,
        byType,
        byDifficulty,
        bySubject
      }
    });
  } catch (error) {
    next(error);
  }
};
