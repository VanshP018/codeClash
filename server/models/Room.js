const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  mode: {
    type: String,
    enum: ['custom', 'ashes'],
    default: 'custom'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  battleStarted: {
    type: Boolean,
    default: false
  },
  questionId: {
    type: Number,
    default: null
  },
  scores: {
    type: Map,
    of: Number,
    default: {}
  },
  questionsCompleted: {
    type: Number,
    default: 0
  },
  sessionEnded: {
    type: Boolean,
    default: false
  },
  timerStartedAt: {
    type: Date,
    default: null
  },
  timerDuration: {
    type: Number,
    default: 1800000 // 30 minutes in milliseconds
  },
  recentLeave: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    timestamp: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Auto-delete after 1 hour
  }
});

module.exports = mongoose.model('Room', roomSchema);
