const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Room = require('../models/Room');
const User = require('../models/User');

// In-memory queue for matchmaking (in production, use Redis)
let matchmakingQueue = [];
// Store matched users temporarily until they both receive the match info
let matchedUsers = {}; // { userId: { roomCode, opponentId, opponentUsername, opponentRating } }

// Join matchmaking queue
router.post('/queue/join', protect, async (req, res) => {
  try {
    console.log('[Matchmaking] Join queue request received');
    const userId = req.userId;
    console.log('[Matchmaking] User ID:', userId);
    
    // Fetch user data
    const user = await User.findById(userId);
    console.log('[Matchmaking] User found:', user ? user.username : 'null');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userRating = user.rating || 800;

    // Check if user already in queue
    const existingIndex = matchmakingQueue.findIndex(entry => entry.userId === userId);
    if (existingIndex !== -1) {
      return res.json({
        success: true,
        message: 'Already in queue',
        queuePosition: existingIndex + 1,
        queueSize: matchmakingQueue.length
      });
    }

    // Try to find a match BEFORE adding to queue
    const queueEntry = {
      userId,
      username: user.username,
      rating: userRating,
      timestamp: Date.now()
    };
    
    const match = findMatch(queueEntry);
    
    if (match) {
      // Remove the matched user from queue (current user was never added)
      matchmakingQueue = matchmakingQueue.filter(
        entry => entry.userId !== match.userId
      );

      // Create ashes battle room
      const roomCode = generateRoomCode();
      // Auto-start battle with random question for ashes mode
      const randomQuestionId = Math.floor(Math.random() * 10) + 1; // Assuming 10 questions
      
      const room = new Room({
        code: roomCode,
        createdBy: userId,
        participants: [userId, match.userId],
        battleStarted: true, // Auto-start for ashes mode
        questionId: randomQuestionId, // Random question
        timerStartedAt: Date.now(), // Start timer immediately
        scores: {
          [userId]: 0,
          [match.userId]: 0
        },
        mode: 'ashes', // New field to distinguish mode
        createdAt: Date.now()
      });

      await room.save();

      // Store match info for both users
      matchedUsers[userId] = {
        roomCode,
        opponentId: match.userId,
        opponentUsername: match.username,
        opponentRating: match.rating
      };
      matchedUsers[match.userId] = {
        roomCode,
        opponentId: userId,
        opponentUsername: user.username,
        opponentRating: userRating
      };

      console.log(`[Matchmaking] Match found! Room ${roomCode} created for ${user.username} vs ${match.username}`);

      return res.json({
        success: true,
        matched: true,
        roomCode: roomCode,
        opponent: {
          username: match.username,
          rating: match.rating
        }
      });
    }

    // No match found, add user to queue
    matchmakingQueue.push(queueEntry);
    console.log(`[Matchmaking] User ${user.username} added to queue. Position: ${matchmakingQueue.length}`);

    res.json({
      success: true,
      matched: false,
      queuePosition: matchmakingQueue.length,
      queueSize: matchmakingQueue.length,
      message: 'Waiting for opponent...'
    });

  } catch (err) {
    console.error('[Matchmaking] Error joining queue:', err);
    console.error('[Matchmaking] Error stack:', err.stack);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// Leave matchmaking queue
router.post('/queue/leave', protect, async (req, res) => {
  try {
    const userId = req.userId;
    const initialLength = matchmakingQueue.length;
    
    matchmakingQueue = matchmakingQueue.filter(entry => entry.userId !== userId);
    
    const removed = initialLength > matchmakingQueue.length;
    
    if (removed) {
      const user = await User.findById(userId);
      console.log(`[Matchmaking] User ${user?.username || userId} left queue`);
    }

    res.json({
      success: true,
      removed,
      message: removed ? 'Left queue' : 'Not in queue'
    });

  } catch (err) {
    console.error('[Matchmaking] Error leaving queue:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check queue status
router.get('/queue/status', protect, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Check if user already has a match waiting
    if (matchedUsers[userId]) {
      const matchInfo = matchedUsers[userId];
      // Clean up after delivering match info
      delete matchedUsers[userId];
      
      return res.json({
        success: true,
        inQueue: false,
        status: 'matched',
        matched: true,
        roomCode: matchInfo.roomCode,
        opponent: {
          username: matchInfo.opponentUsername,
          rating: matchInfo.opponentRating
        }
      });
    }
    
    // Fetch user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userRating = user.rating || 800;
    
    // Check if user in queue
    const userEntry = matchmakingQueue.find(entry => entry.userId === userId);
    
    if (!userEntry) {
      return res.json({
        success: true,
        inQueue: false
      });
    }

    // Try to find a match
    const match = findMatch(userEntry);
    
    if (match) {
      // Remove both users from queue
      matchmakingQueue = matchmakingQueue.filter(
        entry => entry.userId !== userId && entry.userId !== match.userId
      );

      // Create ashes battle room
      const roomCode = generateRoomCode();
      // Auto-start battle with random question for ashes mode
      const randomQuestionId = Math.floor(Math.random() * 10) + 1; // Assuming 10 questions
      
      const room = new Room({
        code: roomCode,
        createdBy: userId,
        participants: [userId, match.userId],
        battleStarted: true, // Auto-start for ashes mode
        questionId: randomQuestionId, // Random question
        timerStartedAt: Date.now(), // Start timer immediately
        scores: {
          [userId]: 0,
          [match.userId]: 0
        },
        mode: 'ashes',
        createdAt: Date.now()
      });

      await room.save();

      // Store match info for the opponent (current user gets immediate response)
      matchedUsers[match.userId] = {
        roomCode,
        opponentId: userId,
        opponentUsername: user.username,
        opponentRating: userRating
      };

      console.log(`[Matchmaking] Match found! Room ${roomCode} created for ${user.username} vs ${match.username}`);

      return res.json({
        success: true,
        inQueue: false,
        status: 'matched',
        matched: true,
        roomCode: roomCode,
        opponent: {
          username: match.username,
          rating: match.rating
        }
      });
    }

    const position = matchmakingQueue.findIndex(entry => entry.userId === userId) + 1;

    res.json({
      success: true,
      inQueue: true,
      matched: false,
      queuePosition: position,
      queueSize: matchmakingQueue.length,
      waitTime: Math.floor((Date.now() - userEntry.timestamp) / 1000)
    });

  } catch (err) {
    console.error('[Matchmaking] Error checking queue status:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper function to find a match
function findMatch(userEntry) {
  const RATING_RANGE = 200;
  
  console.log(`[Matchmaking] Finding match for ${userEntry.username} (Rating: ${userEntry.rating})`);
  console.log(`[Matchmaking] Current queue size: ${matchmakingQueue.length}`);
  
  for (let i = 0; i < matchmakingQueue.length; i++) {
    const candidate = matchmakingQueue[i];
    
    console.log(`[Matchmaking] Checking candidate: ${candidate.username} (Rating: ${candidate.rating})`);
    
    // Skip self
    if (candidate.userId === userEntry.userId) {
      console.log(`[Matchmaking] Skipping self`);
      continue;
    }

    // Check if ratings are within range
    const ratingDiff = Math.abs(candidate.rating - userEntry.rating);
    console.log(`[Matchmaking] Rating difference: ${ratingDiff}`);
    if (ratingDiff <= RATING_RANGE) {
      console.log(`[Matchmaking] Match found! ${userEntry.username} vs ${candidate.username}`);
      return candidate;
    }
  }

  console.log(`[Matchmaking] No match found for ${userEntry.username}`);
  return null;
}

// Helper function to generate room code
function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get queue statistics (admin/debug)
router.get('/queue/stats', protect, (req, res) => {
  res.json({
    success: true,
    queueSize: matchmakingQueue.length,
    queue: matchmakingQueue.map(entry => ({
      username: entry.username,
      rating: entry.rating,
      waitTime: Math.floor((Date.now() - entry.timestamp) / 1000)
    }))
  });
});

module.exports = router;
