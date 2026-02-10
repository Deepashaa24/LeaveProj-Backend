const mongoose = require('mongoose');

/**
 * Leave Request Schema
 */
const leaveSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  subjects: [{
    type: String,
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'test-assigned', 'test-completed', 'approved', 'rejected'],
    default: 'pending'
  },
  testRequired: {
    type: Boolean,
    default: true
  },
  testAttempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestAttempt'
  },
  testScore: {
    type: Number,
    default: 0
  },
  testResult: {
    type: String,
    enum: ['pass', 'fail', 'pending'],
    default: 'pending'
  },
  adminRemarks: {
    type: String,
    trim: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Validate dates
leaveSchema.pre('validate', function(next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Index for efficient querying
leaveSchema.index({ student: 1, status: 1 });
leaveSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Leave', leaveSchema);
