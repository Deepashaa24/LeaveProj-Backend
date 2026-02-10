const TestAttempt = require('../models/TestAttempt');
const Leave = require('../models/Leave');
const Question = require('../models/Question');
const Settings = require('../models/Settings');
const { evaluateCode } = require('../services/codeEvaluator');

/**
 * @desc    Get test for leave request
 * @route   GET /api/tests/leave/:leaveId
 * @access  Private (Student)
 */
exports.getTestForLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check authorization
    if (leave.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const testAttempt = await TestAttempt.findById(leave.testAttempt)
      .populate({
        path: 'questions.question',
        select: '-testCases' // Don't send test cases to frontend for coding questions
      });

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Filter questions by current round
    const roundQuestions = testAttempt.questions.filter(
      q => q.round === testAttempt.currentRound
    );

    res.status(200).json({
      success: true,
      data: {
        testId: testAttempt._id,
        currentRound: testAttempt.currentRound,
        questions: roundQuestions,
        timeLimit: testAttempt.timeLimit,
        startTime: testAttempt.startTime,
        status: testAttempt.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit answer for a question
 * @route   POST /api/tests/:testId/answer
 * @access  Private (Student)
 */
exports.submitAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedOption, code, language } = req.body;

    const testAttempt = await TestAttempt.findById(req.params.testId)
      .populate('questions.question');

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Check authorization
    if (testAttempt.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if test is still in progress
    if (testAttempt.status === 'completed' || testAttempt.status === 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Test already completed'
      });
    }

    const question = testAttempt.questions.find(
      q => q.question._id.toString() === questionId
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found in this test'
      });
    }

    // Check if already answered
    const existingResponse = testAttempt.responses.find(
      r => r.question.toString() === questionId
    );

    if (existingResponse) {
      return res.status(400).json({
        success: false,
        message: 'Question already answered'
      });
    }

    let isCorrect = false;
    let score = 0;

    // Evaluate based on question type
    if (question.question.questionType === 'mcq') {
      const correctOption = question.question.options.findIndex(opt => opt.isCorrect);
      isCorrect = selectedOption === correctOption;
      score = isCorrect ? question.question.points : 0;

      testAttempt.responses.push({
        question: questionId,
        selectedOption,
        isCorrect,
        score
      });
    } else if (question.question.questionType === 'coding') {
      // Evaluate code
      const evaluation = await evaluateCode(
        code,
        language,
        question.question.testCases
      );

      isCorrect = evaluation.allPassed;
      score = evaluation.score;

      testAttempt.responses.push({
        question: questionId,
        code,
        language,
        isCorrect,
        score
      });
    }

    // Update round scores
    if (testAttempt.currentRound === 1) {
      testAttempt.roundScores.round1 += score;
    } else if (testAttempt.currentRound === 2) {
      testAttempt.roundScores.round2 += score;
    }

    testAttempt.totalScore += score;
    await testAttempt.save();

    res.status(200).json({
      success: true,
      data: {
        isCorrect,
        score,
        totalScore: testAttempt.totalScore
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit test (complete current round or entire test)
 * @route   POST /api/tests/:testId/submit
 * @access  Private (Student)
 */
exports.submitTest = async (req, res, next) => {
  try {
    const testAttempt = await TestAttempt.findById(req.params.testId);

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Check authorization
    if (testAttempt.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const settings = await Settings.findOne() || new Settings();

    // Check if round 1 is completed
    if (testAttempt.currentRound === 1) {
      const round1Percentage = (testAttempt.roundScores.round1 / 
        (testAttempt.questions.filter(q => q.round === 1).reduce((sum, q) => sum + q.question.points, 0))) * 100;

      // Check if student passed round 1
      if (round1Percentage >= settings.round1PassingPercentage) {
        testAttempt.currentRound = 2;
        testAttempt.status = 'round1-completed';
        await testAttempt.save();

        return res.status(200).json({
          success: true,
          message: 'Round 1 completed. Proceed to Round 2.',
          data: {
            currentRound: 2,
            round1Score: testAttempt.roundScores.round1,
            round1Percentage
          }
        });
      } else {
        // Failed round 1, complete test
        testAttempt.status = 'completed';
        testAttempt.endTime = new Date();
        testAttempt.calculatePercentage();
        await testAttempt.save();

        // Update leave request
        await updateLeaveWithTestResult(testAttempt.leaveRequest, testAttempt);

        return res.status(200).json({
          success: true,
          message: 'Test completed. Did not qualify for Round 2.',
          data: {
            totalScore: testAttempt.totalScore,
            percentage: testAttempt.percentage,
            passed: false
          }
        });
      }
    }

    // Complete entire test
    testAttempt.status = 'completed';
    testAttempt.endTime = new Date();
    const rawPct = testAttempt.calculatePercentage();
    
    // Apply violation penalty
    if (testAttempt.violationPenalty > 0) {
      testAttempt.percentage = Math.max(0, rawPct - testAttempt.violationPenalty);
    }
    
    await testAttempt.save();

    // Update leave request
    await updateLeaveWithTestResult(testAttempt.leaveRequest, testAttempt);

    const passed = testAttempt.percentage >= settings.passingPercentage;

    res.status(200).json({
      success: true,
      message: 'Test completed successfully',
      data: {
        totalScore: testAttempt.totalScore,
        maxScore: testAttempt.maxScore,
        percentage: testAttempt.percentage,
        passed
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to update leave with test result
 */
const updateLeaveWithTestResult = async (leaveId, testAttempt) => {
  const settings = await Settings.findOne() || new Settings();
  const passed = testAttempt.percentage >= settings.passingPercentage;

  await Leave.findByIdAndUpdate(leaveId, {
    status: 'test-completed',
    testScore: testAttempt.percentage,
    testResult: passed ? 'pass' : 'fail'
  });
};

/**
 * @desc    Track violation
 * @route   POST /api/tests/:testId/violation
 * @access  Private (Student)
 */
exports.trackViolation = async (req, res, next) => {
  try {
    const { type, detail } = req.body;

    const testAttempt = await TestAttempt.findById(req.params.testId);

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    const settings = await Settings.findOne() || new Settings();

    // Record the violation with details
    testAttempt.violations.push({ 
      type, 
      detail: detail || '',
      timestamp: new Date() 
    });
    testAttempt.violationCount += 1;

    // Calculate penalty (each violation deducts a percentage from final score)
    const penaltyPerViolation = settings.violationPenaltyPercent || 5;
    testAttempt.violationPenalty = testAttempt.violationCount * penaltyPerViolation;

    // Record IP and user agent
    if (!testAttempt.ipAddress) {
      testAttempt.ipAddress = req.ip || req.connection.remoteAddress;
      testAttempt.userAgent = req.headers['user-agent'];
    }

    // Auto-submit if max violations reached
    if (testAttempt.violationCount >= (settings.maxViolations || 5) && settings.autoSubmitOnViolation) {
      testAttempt.status = 'auto-submitted';
      testAttempt.endTime = new Date();
      
      // Apply penalty before calculating percentage
      const rawPercentage = testAttempt.calculatePercentage();
      testAttempt.percentage = Math.max(0, rawPercentage - testAttempt.violationPenalty);
      
      await testAttempt.save();

      await updateLeaveWithTestResult(testAttempt.leaveRequest, testAttempt);

      return res.status(200).json({
        success: true,
        autoSubmitted: true,
        message: 'Test auto-submitted due to excessive violations',
        violationCount: testAttempt.violationCount,
        maxViolations: settings.maxViolations || 5,
        penaltyApplied: testAttempt.violationPenalty
      });
    }

    await testAttempt.save();

    res.status(200).json({
      success: true,
      violationCount: testAttempt.violationCount,
      maxViolations: settings.maxViolations || 5,
      currentPenalty: testAttempt.violationPenalty,
      penaltyPerViolation,
      warningLevel: testAttempt.violationCount >= Math.floor((settings.maxViolations || 5) * 0.6) ? 'critical' : 
                     testAttempt.violationCount >= Math.floor((settings.maxViolations || 5) * 0.3) ? 'warning' : 'normal'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get test results
 * @route   GET /api/tests/:testId/result
 * @access  Private
 */
exports.getTestResult = async (req, res, next) => {
  try {
    const testAttempt = await TestAttempt.findById(req.params.testId)
      .populate('student', 'name email studentId')
      .populate('questions.question')
      .populate('leaveRequest');

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student' && testAttempt.student._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: testAttempt
    });
  } catch (error) {
    next(error);
  }
};
