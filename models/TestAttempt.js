const mongoose = require('mongoose');

/**
 * Test Attempt Schema
 * Tracks student's test attempts and responses
 */
const testAttemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaveRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Leave',
    required: true
  },
  questions: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    round: {
      type: Number, // 1 for MCQ, 2 for Coding
      required: true
    }
  }],
  responses: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    // For MCQ
    selectedOption: {
      type: Number
    },
    // For Coding
    code: {
      type: String
    },
    language: {
      type: String,
      enum: ['javascript', 'python', 'java', 'cpp'],
      default: 'javascript'
    },
    isCorrect: {
      type: Boolean
    },
    score: {
      type: Number,
      default: 0
    },
    timeTaken: {
      type: Number // in seconds
    }
  }],
  currentRound: {
    type: Number,
    default: 1
  },
  roundScores: {
    round1: { type: Number, default: 0 },
    round2: { type: Number, default: 0 }
  },
  totalScore: {
    type: Number,
    default: 0
  },
  maxScore: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in-progress', 'round1-completed', 'round2-completed', 'completed', 'submitted', 'auto-submitted'],
    default: 'in-progress'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  timeLimit: {
    type: Number, // in minutes
    default: 60
  },
  // Anti-cheating tracking
  violations: [{
    type: {
      type: String,
      enum: ['tab-switch', 'copy-paste', 'right-click', 'window-blur', 'keyboard-shortcut', 'paste-attempt', 'devtools', 'fullscreen-exit', 'screen-capture', 'drag-drop', 'print-attempt']
    },
    detail: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  violationCount: {
    type: Number,
    default: 0
  },
  violationPenalty: {
    type: Number,
    default: 0 // percentage deducted from score
  },
  isFullscreen: {
    type: Boolean,
    default: false
  },
  browserFingerprint: String,
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Calculate percentage
testAttemptSchema.methods.calculatePercentage = function() {
  if (this.maxScore > 0) {
    this.percentage = (this.totalScore / this.maxScore) * 100;
  }
  return this.percentage;
};

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
