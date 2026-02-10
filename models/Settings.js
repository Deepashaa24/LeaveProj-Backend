const mongoose = require('mongoose');

/**
 * System Settings Schema
 * Configurable system parameters
 */
const settingsSchema = new mongoose.Schema({
  // Test configuration
  mcqCount: {
    type: Number,
    default: 10
  },
  codingCount: {
    type: Number,
    default: 2
  },
  mcqTimeLimit: {
    type: Number, // in minutes
    default: 30
  },
  codingTimeLimit: {
    type: Number, // in minutes
    default: 45
  },
  
  // Passing criteria
  passingPercentage: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  round1PassingPercentage: {
    type: Number,
    default: 60,
    min: 0,
    max: 100
  },
  
  // Anti-cheating settings
  maxViolations: {
    type: Number,
    default: 5
  },
  autoSubmitOnViolation: {
    type: Boolean,
    default: true
  },
  violationPenaltyPercent: {
    type: Number,
    default: 5, // each violation deducts 5% from score
    min: 0,
    max: 25
  },
  requireFullscreen: {
    type: Boolean,
    default: true
  },
  
  // Difficulty distribution
  difficultyDistribution: {
    easy: {
      type: Number,
      default: 40 // percentage
    },
    medium: {
      type: Number,
      default: 40
    },
    hard: {
      type: Number,
      default: 20
    }
  },
  
  // Leave duration limits
  maxLeaveDays: {
    type: Number,
    default: 7
  },
  
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
