const mongoose = require('mongoose');

/**
 * Question Schema
 * Supports both MCQ and Coding questions
 */
const questionSchema = new mongoose.Schema({
  questionType: {
    type: String,
    enum: ['mcq', 'coding'],
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  
  // MCQ specific fields
  questionText: {
    type: String,
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  
  // Coding specific fields
  problemStatement: {
    type: String
  },
  constraints: {
    type: String
  },
  inputFormat: {
    type: String
  },
  outputFormat: {
    type: String
  },
  sampleInput: {
    type: String
  },
  sampleOutput: {
    type: String
  },
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: {
      type: Boolean,
      default: false
    }
  }],
  starterCode: {
    type: String
  },
  
  // Common fields
  points: {
    type: Number,
    default: 1
  },
  timeLimit: {
    type: Number, // in seconds for coding
    default: 300
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
questionSchema.index({ subject: 1, difficulty: 1, questionType: 1 });

module.exports = mongoose.model('Question', questionSchema);
