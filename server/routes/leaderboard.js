const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route GET /api/leaderboard
// @desc Get all users sorted by rating (highest to lowest)
// @access Private
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find()
      .select('username email rating battlesFought tier')
      .sort({ rating: -1 }) // Sort by rating descending
      .limit(100); // Limit to top 100 users

    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((user, index) => ({
        rank: index + 1,
        id: user._id,
        username: user.username,
        email: user.email,
        rating: user.rating,
        battlesFought: user.battlesFought,
        tier: user.tier
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
