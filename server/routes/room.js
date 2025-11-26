const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Room = require('../models/Room');
const User = require('../models/User');
const { generateRoomCode } = require('../utils/roomUtils');

// Helper function to update ratings for ashes mode
async function updateAshesRatings(room) {
  if (room.mode !== 'ashes') return;
  
  try {
    const scores = Object.fromEntries(room.scores || new Map());
    const participants = room.participants;
    
    if (participants.length !== 2) return;
    
    const [userId1, userId2] = participants;
    const score1 = scores[userId1] || 0;
    const score2 = scores[userId2] || 0;
    
    // Calculate rating change: (winner_score - loser_score) * 5
    const scoreDiff = Math.abs(score1 - score2);
    const ratingChange = scoreDiff * 5;
    
    const user1 = await User.findById(userId1);
    const user2 = await User.findById(userId2);
    
    if (!user1 || !user2) return;
    
    // Update ratings based on who won
    if (score1 > score2) {
      // User 1 wins
      user1.rating = (user1.rating || 800) + ratingChange;
      user2.rating = Math.max(0, (user2.rating || 800) - ratingChange); // Don't go below 0
      console.log(`[Ashes Rating] ${user1.username} wins! +${ratingChange} rating. ${user2.username} -${ratingChange} rating`);
    } else if (score2 > score1) {
      // User 2 wins
      user2.rating = (user2.rating || 800) + ratingChange;
      user1.rating = Math.max(0, (user1.rating || 800) - ratingChange);
      console.log(`[Ashes Rating] ${user2.username} wins! +${ratingChange} rating. ${user1.username} -${ratingChange} rating`);
    } else {
      // Draw - no rating change
      console.log(`[Ashes Rating] Draw - no rating changes`);
      return;
    }
    
    await user1.save();
    await user2.save();
    
    console.log(`[Ashes Rating] Updated ratings: ${user1.username}=${user1.rating}, ${user2.username}=${user2.rating}`);
  } catch (err) {
    console.error('[Ashes Rating] Error updating ratings:', err);
  }
}

// @route POST /api/rooms/create
// @desc Create a new room
// @access Private
router.post('/create', protect, async (req, res) => {
  try {
    let code;
    let roomExists = true;

    // Generate unique code
    while (roomExists) {
      code = generateRoomCode();
      const existingRoom = await Room.findOne({ code });
      roomExists = !!existingRoom;
    }

    // Create room
    const room = new Room({
      code,
      createdBy: req.userId,
      participants: [req.userId]
    });

    await room.save();

    res.status(201).json({
      success: true,
      room: {
        id: room._id,
        code: room.code,
        createdBy: room.createdBy,
        participants: room.participants
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route POST /api/rooms/join
// @desc Join a room with code
// @access Private
router.post('/join', protect, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide a room code' });
    }

    // Find room
    const room = await Room.findOne({ code });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if user already in room - if yes, just return success (allow rejoin)
    const isAlreadyParticipant = room.participants.some(
      participantId => participantId.toString() === req.userId.toString()
    );
    
    if (isAlreadyParticipant) {
      return res.status(200).json({
        success: true,
        message: 'You are already in this room',
        room: {
          id: room._id,
          code: room.code,
          participants: room.participants
        }
      });
    }

    // Add user to room
    room.participants.push(req.userId);
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Joined room successfully',
      room: {
        id: room._id,
        code: room.code,
        participants: room.participants
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route POST /api/rooms/leave/:code
// @desc Leave a room
// @access Private
router.post('/leave/:code', protect, async (req, res) => {
  try {
    const { code } = req.params;
    const { inBattle } = req.body; // Flag to indicate if leaving from battle

    // Find room with user details
    const room = await Room.findOne({ code }).populate('participants', 'username');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if user is in the room
    const isParticipant = room.participants.some(
      participant => participant._id.toString() === req.userId.toString()
    );
    
    if (!isParticipant) {
      return res.status(400).json({ success: false, message: 'You are not in this room' });
    }

    // Get user info before removing
    const leavingUser = room.participants.find(
      participant => participant._id.toString() === req.userId.toString()
    );

    // Check if user is the host
    const isHost = room.createdBy.toString() === req.userId.toString();

    // Remove user from participants
    room.participants = room.participants.filter(
      participant => participant._id.toString() !== req.userId.toString()
    );

    // Remove user's score
    if (room.scores && room.scores.has(req.userId.toString())) {
      room.scores.delete(req.userId.toString());
    }

    let sessionEndedDueToLeave = false;
    let winner = null;

    // If in battle and leaving, set recent leave notification
    if (inBattle) {
      room.recentLeave = {
        userId: req.userId,
        username: leavingUser.username,
        timestamp: new Date()
      };

      // If only 1 participant remains, end the session and declare winner
      if (room.participants.length === 1) {
        room.sessionEnded = true;
        sessionEndedDueToLeave = true;
        winner = room.participants[0];
        
        // For ashes mode, update ratings (leaver loses, remaining player wins)
        if (room.mode === 'ashes') {
          try {
            const winnerId = winner._id.toString();
            const loserId = req.userId.toString();
            
            const winnerUser = await User.findById(winnerId);
            const loserUser = await User.findById(loserId);
            
            if (winnerUser && loserUser) {
              const scores = Object.fromEntries(room.scores || new Map());
              const winnerScore = scores[winnerId] || 0;
              const loserScore = scores[loserId] || 0;
              
              // Calculate rating change based on score difference
              const scoreDiff = Math.abs(winnerScore - loserScore);
              const ratingChange = Math.max(scoreDiff * 5, 25); // Minimum 25 for leaving penalty
              
              winnerUser.rating = (winnerUser.rating || 800) + ratingChange;
              loserUser.rating = Math.max(0, (loserUser.rating || 800) - ratingChange);
              
              await winnerUser.save();
              await loserUser.save();
              
              console.log(`[Leave] Ashes ratings updated: ${winnerUser.username} +${ratingChange}, ${loserUser.username} -${ratingChange}`);
            }
          } catch (err) {
            console.error('[Leave] Error updating ashes ratings:', err);
          }
        }
        
        console.log(`[Leave] Session ended - ${winner.username} wins by default`);
      }
    }

    // If host is leaving and there are still participants, assign new host
    if (isHost && room.participants.length > 0) {
      room.createdBy = room.participants[0]._id; // First participant becomes new host
    }

    // If no participants left, delete the room
    if (room.participants.length === 0) {
      await Room.deleteOne({ code });
      return res.status(200).json({
        success: true,
        message: 'Left room successfully',
        roomDeleted: true
      });
    }

    await room.save();

    res.status(200).json({
      success: true,
      message: 'Left room successfully',
      newHost: isHost && room.participants.length > 0 ? room.participants[0]._id : null,
      sessionEnded: sessionEndedDueToLeave,
      winner: winner ? { id: winner._id, username: winner.username } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/rooms/:code
// @desc Get room details
// @access Private
router.get('/:code', protect, async (req, res) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ code })
      .populate('participants', 'username email')
      .populate('createdBy', 'username email');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if timer has expired
    if (room.timerStartedAt && !room.sessionEnded) {
      const elapsedTime = Date.now() - new Date(room.timerStartedAt).getTime();
      if (elapsedTime >= room.timerDuration) {
        room.sessionEnded = true;
        await room.save();
      }
    }

    res.status(200).json({
      success: true,
      room: {
        id: room._id,
        code: room.code,
        createdBy: room.createdBy,
        participants: room.participants,
        battleStarted: room.battleStarted,
        questionId: room.questionId,
        scores: room.scores || {},
        questionsCompleted: room.questionsCompleted || 0,
        sessionEnded: room.sessionEnded || false,
        timerStartedAt: room.timerStartedAt,
        timerDuration: room.timerDuration,
        recentLeave: room.recentLeave || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/rooms/user/my-rooms
// @desc Get user's rooms
// @access Private
router.get('/user/my-rooms', protect, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [{ createdBy: req.userId }, { participants: req.userId }]
    });

    res.status(200).json({
      success: true,
      rooms: rooms.map(room => ({
        id: room._id,
        code: room.code,
        createdBy: room.createdBy,
        participantCount: room.participants.length
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route POST /api/rooms/start/:code
// @desc Start battle and assign random question
// @access Private (Host only)
router.post('/start/:code', protect, async (req, res) => {
  try {
    const { code } = req.params;
    const fs = require('fs');
    const path = require('path');

    // Find room with populated participants
    const room = await Room.findOne({ code }).populate('participants', '_id');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if user is the host
    if (room.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only host can start the battle' });
    }

    // Check if battle already started
    if (room.battleStarted) {
      return res.status(400).json({ success: false, message: 'Battle already started' });
    }

    console.log(`[Start Battle] Room ${code} has ${room.participants.length} participants:`, room.participants.map(p => p._id.toString()));

    // Load question bank
    const questionBankPath = path.join(__dirname, '../data/questionBank.json');
    const questionBank = JSON.parse(fs.readFileSync(questionBankPath, 'utf8'));

    // Select random question
    const randomIndex = Math.floor(Math.random() * questionBank.questions.length);
    const selectedQuestion = questionBank.questions[randomIndex];

    // Increment battlesFought for all participants
    const User = require('../models/User');
    const participantIds = room.participants.map(p => p._id);
    const updateResult = await User.updateMany(
      { _id: { $in: participantIds } },
      { $inc: { battlesFought: 1 } }
    );
    console.log(`[Start Battle] Incremented battlesFought for ${room.participants.length} participants. Modified: ${updateResult.modifiedCount}`);

    // Update room
    room.battleStarted = true;
    room.questionId = selectedQuestion.id;
    room.timerStartedAt = new Date(); // Start the 30-minute timer
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Battle started',
      questionId: selectedQuestion.id,
      timerStartedAt: room.timerStartedAt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route POST /api/rooms/submit/:code
// @desc Submit solution and move to next question if all tests pass
// @access Private
router.post('/submit/:code', protect, async (req, res) => {
  try {
    const { code } = req.params;
    const { allPassed } = req.body;

    console.log(`[Submit] Room: ${code}, User: ${req.userId}, All Passed: ${allPassed}`);

    // Find room
    const room = await Room.findOne({ code });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    console.log(`[Submit] Current question ID: ${room.questionId}`);

    // Check if user is in the room
    const isParticipant = room.participants.some(
      participantId => participantId.toString() === req.userId.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You are not in this room' });
    }

    // Check if timer has expired
    if (room.timerStartedAt) {
      const elapsedTime = Date.now() - new Date(room.timerStartedAt).getTime();
      if (elapsedTime >= room.timerDuration) {
        if (!room.sessionEnded) {
          room.sessionEnded = true;
          await room.save();
          
          // Update ratings for ashes mode
          await updateAshesRatings(room);
        }
        return res.status(200).json({
          success: false,
          message: 'Time expired! Session ended.',
          sessionEnded: true,
          timeExpired: true,
          questionsCompleted: room.questionsCompleted,
          finalScores: Object.fromEntries(room.scores || new Map())
        });
      }
    }

    // If all tests passed, assign new random question
    if (allPassed) {
      const fs = require('fs');
      const path = require('path');

      // Load question bank
      const questionBankPath = path.join(__dirname, '../data/questionBank.json');
      const questionBank = JSON.parse(fs.readFileSync(questionBankPath, 'utf8'));

      // Find current question to get difficulty
      const currentQuestion = questionBank.questions.find(q => q.id === room.questionId);
      
      // Award points based on difficulty
      if (currentQuestion) {
        const points = {
          'Easy': 5,
          'Medium': 8,
          'Hard': 14
        }[currentQuestion.difficulty] || 0;

        // Initialize scores map if not exists
        if (!room.scores) {
          room.scores = new Map();
        }

        // Get current score or 0
        const currentScore = room.scores.get(req.userId.toString()) || 0;
        room.scores.set(req.userId.toString(), currentScore + points);

        console.log(`[Submit] Awarded ${points} points to user ${req.userId}. New score: ${currentScore + points}`);
      }

      // Increment questions completed
      room.questionsCompleted = (room.questionsCompleted || 0) + 1;
      console.log(`[Submit] Questions completed: ${room.questionsCompleted}/3`);

      // Check if session should end (3 questions completed)
      if (room.questionsCompleted >= 3) {
        room.sessionEnded = true;
        await room.save();
        
        // Update ratings for ashes mode
        await updateAshesRatings(room);
        
        console.log(`[Submit] Session ended after 3 questions`);

        return res.status(200).json({
          success: true,
          message: 'All tests passed! Session completed.',
          sessionEnded: true,
          questionsCompleted: room.questionsCompleted,
          finalScores: Object.fromEntries(room.scores || new Map())
        });
      }

      // Get different question (not the current one)
      const availableQuestions = questionBank.questions.filter(q => q.id !== room.questionId);
      
      console.log(`[Submit] Available questions: ${availableQuestions.length}`);
      
      if (availableQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const selectedQuestion = availableQuestions[randomIndex];

        // Update room with new question
        const oldQuestionId = room.questionId;
        room.questionId = selectedQuestion.id;
        await room.save();

        console.log(`[Submit] Question changed from ${oldQuestionId} to ${selectedQuestion.id}`);

        return res.status(200).json({
          success: true,
          message: 'All tests passed! Moving to next question...',
          newQuestionId: selectedQuestion.id,
          questionChanged: true,
          questionsCompleted: room.questionsCompleted
        });
      } else {
        return res.status(200).json({
          success: true,
          message: 'All tests passed! No more questions available.',
          questionChanged: false
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Submission recorded',
      questionChanged: false
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
