const Leave = require('../models/Leave');
const TestAttempt = require('../models/TestAttempt');
const Question = require('../models/Question');
const Settings = require('../models/Settings');

/**
 * @desc    Apply for leave (Student)
 * @route   POST /api/leaves
 * @access  Private (Student)
 */
exports.applyLeave = async (req, res, next) => {
  try {
    const { reason, startDate, endDate, subjects } = req.body;

    // Validate required fields
    if (!reason || !startDate || !endDate || !subjects || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Create leave request
    const leave = await Leave.create({
      student: req.user.id,
      reason,
      startDate: start,
      endDate: end,
      subjects,
      status: 'pending'
    });

    // Generate test for the student
    await generateTestForLeave(leave._id, req.user.id, subjects);

    const populatedLeave = await Leave.findById(leave._id)
      .populate('student', 'name email studentId');

    res.status(201).json({
      success: true,
      message: 'Leave request submitted. Please complete the test.',
      data: populatedLeave
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to generate test for leave
 */
const generateTestForLeave = async (leaveId, studentId, subjects) => {
  try {
    const settings = await Settings.findOne() || new Settings();
    const leave = await Leave.findById(leaveId);
    
    // Calculate leave duration in days
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const leaveDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Adjust question count based on leave duration
    let mcqCount = settings.mcqCount;
    let codingCount = settings.codingCount;
    
    if (leaveDays > 7) {
      // Longer leave = more questions
      mcqCount = Math.min(mcqCount + 2, 10);
      codingCount = Math.min(codingCount + 1, 3);
    } else if (leaveDays > 3) {
      mcqCount = Math.min(mcqCount + 1, 8);
    }
    
    // Adjust difficulty distribution based on leave duration
    let difficultyWeights = {
      easy: leaveDays <= 3 ? 50 : 40,
      medium: leaveDays <= 3 ? 40 : 40,
      hard: leaveDays <= 3 ? 10 : 20
    };
    
    // Calculate questions per difficulty
    const easyCount = Math.ceil(mcqCount * difficultyWeights.easy / 100);
    const mediumCount = Math.ceil(mcqCount * difficultyWeights.medium / 100);
    const hardCount = mcqCount - easyCount - mediumCount;
    
    // Get MCQ questions with difficulty distribution
    const mcqQuestions = [];
    
    for (const difficulty of ['easy', 'medium', 'hard']) {
      const count = difficulty === 'easy' ? easyCount : 
                   difficulty === 'medium' ? mediumCount : hardCount;
      
      if (count > 0) {
        const questions = await Question.aggregate([
          {
            $match: {
              questionType: 'mcq',
              subject: { $in: subjects },
              difficulty: difficulty,
              isActive: true
            }
          },
          { $sample: { size: count } }
        ]);
        mcqQuestions.push(...questions);
      }
    }
    
    // Get coding questions with balanced difficulty
    const codingQuestions = [];
    if (codingCount > 0) {
      // Try to get varied difficulty coding questions
      for (let i = 0; i < codingCount; i++) {
        const targetDifficulty = i === 0 ? 'easy' : 
                                i === 1 ? 'medium' : 'hard';
        
        const questions = await Question.aggregate([
          {
            $match: {
              questionType: 'coding',
              subject: { $in: subjects },
              difficulty: targetDifficulty,
              isActive: true
            }
          },
          { $sample: { size: 1 } }
        ]);
        
        if (questions.length > 0) {
          codingQuestions.push(...questions);
        } else {
          // Fallback to any difficulty if specific not available
          const fallback = await Question.aggregate([
            {
              $match: {
                questionType: 'coding',
                subject: { $in: subjects },
                isActive: true
              }
            },
            { $sample: { size: 1 } }
          ]);
          codingQuestions.push(...fallback);
        }
      }
    }

    // Calculate max score
    const maxScore = mcqQuestions.reduce((sum, q) => sum + q.points, 0) +
                     codingQuestions.reduce((sum, q) => sum + q.points, 0);

    // Create test attempt
    const questions = [
      ...mcqQuestions.map(q => ({ question: q._id, round: 1 })),
      ...codingQuestions.map(q => ({ question: q._id, round: 2 }))
    ];

    const testAttempt = await TestAttempt.create({
      student: studentId,
      leaveRequest: leaveId,
      questions,
      maxScore,
      timeLimit: settings.mcqTimeLimit + settings.codingTimeLimit,
      currentRound: 1
    });

    // Update leave with test reference
    await Leave.findByIdAndUpdate(leaveId, {
      testAttempt: testAttempt._id,
      status: 'test-assigned'
    });

    return testAttempt;
  } catch (error) {
    console.error('Error generating test:', error);
    throw error;
  }
};

/**
 * @desc    Get all leave requests (Student - own, Admin - all)
 * @route   GET /api/leaves
 * @access  Private
 */
exports.getLeaves = async (req, res, next) => {
  try {
    let query = {};
    
    // If student, only show their leaves
    if (req.user.role === 'student') {
      query.student = req.user.id;
    }

    const leaves = await Leave.find(query)
      .populate('student', 'name email studentId department year')
      .populate('testAttempt')
      .populate('reviewedBy', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single leave request
 * @route   GET /api/leaves/:id
 * @access  Private
 */
exports.getLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('student', 'name email studentId department year')
      .populate('testAttempt')
      .populate('reviewedBy', 'name');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student' && leave.student._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this leave request'
      });
    }

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update leave status (Admin only)
 * @route   PUT /api/leaves/:id/status
 * @access  Private (Admin)
 */
exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const { status, adminRemarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const leave = await Leave.findById(req.params.id)
      .populate('testAttempt');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if test is completed
    if (!leave.testAttempt || leave.testAttempt.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Student has not completed the test yet'
      });
    }

    // Update leave
    leave.status = status;
    leave.adminRemarks = adminRemarks;
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();
    await leave.save();

    const updatedLeave = await Leave.findById(leave._id)
      .populate('student', 'name email studentId')
      .populate('reviewedBy', 'name');

    res.status(200).json({
      success: true,
      message: `Leave request ${status}`,
      data: updatedLeave
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete leave request
 * @route   DELETE /api/leaves/:id
 * @access  Private (Student - own, Admin - all)
 */
exports.deleteLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student' && leave.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this leave request'
      });
    }

    // Can only delete if status is pending or rejected
    if (!['pending', 'rejected'].includes(leave.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete approved or in-progress leave requests'
      });
    }

    await leave.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Leave request deleted'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get leave statistics (Admin)
 * @route   GET /api/leaves/stats
 * @access  Private (Admin)
 */
exports.getLeaveStats = async (req, res, next) => {
  try {
    const stats = await Leave.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalLeaves = await Leave.countDocuments();
    const avgTestScore = await Leave.aggregate([
      {
        $match: { testScore: { $gt: 0 } }
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$testScore' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalLeaves,
        byStatus: stats,
        averageTestScore: avgTestScore[0]?.avgScore || 0
      }
    });
  } catch (error) {
    next(error);
  }
};
