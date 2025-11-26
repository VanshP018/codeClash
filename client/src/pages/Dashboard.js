import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showCustomMode, setShowCustomMode] = useState(false);
  const [showAshesMode, setShowAshesMode] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);

  return (
    <div className="dashboard-page">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user.username}!</h1>
      </div>
      <div className="dashboard-content">
        <div className="user-card">
          <h2>Your Profile</h2>
          <div className="user-info">
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>ID:</strong> {user.id}</p>
          </div>
        </div>

        <div className="mode-selection">
          <h2>Select Battle Mode</h2>
          <div className="mode-buttons">
            <button 
              className="mode-btn custom-mode-btn"
              onClick={() => setShowCustomMode(true)}
            >
              <div className="mode-icon">⚔️</div>
              <div className="mode-info">
                <h3>Custom Mode</h3>
                <p>Create or join custom battles with friends</p>
              </div>
            </button>
            <button 
              className="mode-btn ashes-mode-btn"
              onClick={() => setShowAshesMode(true)}
            >
              <div className="mode-icon">🔥</div>
              <div className="mode-info">
                <h3>Ashes Mode</h3>
                <p>Compete in ranked matches for glory</p>
              </div>
            </button>
          </div>
        </div>

        {showCustomMode && (
          <CustomModeModal 
            user={user}
            onClose={() => setShowCustomMode(false)}
            navigate={navigate}
            onShowCreate={() => {
              setShowCreateRoom(true);
              setShowJoinRoom(false);
            }}
            onShowJoin={() => {
              setShowJoinRoom(true);
              setShowCreateRoom(false);
            }}
            showCreateRoom={showCreateRoom}
            showJoinRoom={showJoinRoom}
            setShowCreateRoom={setShowCreateRoom}
            setShowJoinRoom={setShowJoinRoom}
          />
        )}

        {showAshesMode && (
          <AshesModeModal 
            user={user}
            onClose={() => setShowAshesMode(false)}
            navigate={navigate}
          />
        )}
      </div>
      </div>
    </div>
  );
};

const CustomModeModal = ({ user, onClose, navigate, onShowCreate, onShowJoin, showCreateRoom, showJoinRoom, setShowCreateRoom, setShowJoinRoom }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content mode-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚔️ Custom Mode</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p className="mode-description">Create your own room or join an existing one to battle with friends!</p>
          
          <div className="room-buttons">
            <button 
              className="room-btn create-btn"
              onClick={onShowCreate}
            >
              ➕ Create Room
            </button>
            <button 
              className="room-btn join-btn"
              onClick={onShowJoin}
            >
              🚪 Join Room
            </button>
          </div>

          {showCreateRoom && (
            <CreateRoomModal 
              user={user}
              onClose={() => setShowCreateRoom(false)}
              navigate={navigate}
            />
          )}

          {showJoinRoom && (
            <JoinRoomModal 
              user={user}
              onClose={() => setShowJoinRoom(false)}
              navigate={navigate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const AshesModeModal = ({ user, onClose, navigate }) => {
  const [inQueue, setInQueue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queuePosition, setQueuePosition] = useState(null);
  const [matchFound, setMatchFound] = useState(false);
  const pollIntervalRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      // Cleanup: leave queue if modal closes while in queue
      if (inQueue && pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        leaveQueue();
      }
    };
  }, [inQueue]);

  const joinQueue = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in again');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/matchmaking/queue/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        if (data.matched) {
          // Immediate match found
          setMatchFound(true);
          setTimeout(() => {
            navigate(`/battle/${data.roomCode}`);
          }, 2000);
        } else {
          // Added to queue, start polling
          setInQueue(true);
          setQueuePosition(data.queuePosition);
          startPolling();
        }
      } else {
        setError(data.message || 'Failed to join queue');
      }
    } catch (err) {
      setError('Error joining queue: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const leaveQueue = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch('http://localhost:5001/api/matchmaking/queue/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      setInQueue(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    } catch (err) {
      console.error('Error leaving queue:', err);
    }
  };

  const startPolling = () => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          clearInterval(pollIntervalRef.current);
          return;
        }

        const response = await fetch('http://localhost:5001/api/matchmaking/queue/status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          if (data.status === 'matched') {
            // Match found!
            clearInterval(pollIntervalRef.current);
            setMatchFound(true);
            setTimeout(() => {
              navigate(`/battle/${data.roomCode}`);
            }, 2000);
          } else {
            // Update queue position
            setQueuePosition(data.queuePosition);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000); // Poll every 2 seconds
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content mode-modal ashes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔥 Ashes Mode</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          {!inQueue && !matchFound && (
            <>
              <p className="mode-description">
                Enter the ranked queue and get matched with players of similar skill level!
              </p>
              <div className="ashes-info">
                <p>🎯 Rating Range: ±200</p>
                <p>⚡ Fast Matchmaking</p>
                <p>🏆 Competitive Battles</p>
              </div>
              <button 
                className="queue-btn join-queue-btn"
                onClick={joinQueue}
                disabled={loading}
              >
                {loading ? 'Joining Queue...' : '🔥 Join Queue'}
              </button>
            </>
          )}

          {inQueue && !matchFound && (
            <div className="queue-status">
              <div className="queue-animation">
                <div className="spinner"></div>
              </div>
              <h3>Searching for Opponent...</h3>
              <p className="queue-position">Position in queue: #{queuePosition}</p>
              <p className="queue-message">Looking for players with rating {user.rating - 200} - {user.rating + 200}</p>
              <button 
                className="queue-btn leave-queue-btn"
                onClick={leaveQueue}
              >
                Leave Queue
              </button>
            </div>
          )}

          {matchFound && (
            <div className="match-found">
              <div className="match-animation">
                <div className="checkmark">✓</div>
              </div>
              <h3>Match Found!</h3>
              <p>Preparing battle arena...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateRoomModal = ({ user, onClose, navigate }) => {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in again');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to room page immediately
        navigate(`/room/${data.room.code}`);
      } else {
        if (data.message === 'Not authorized to access this route') {
          setError('Session expired. Please log out and log back in.');
        } else {
          setError(data.message || 'Failed to create room');
        }
      }
    } catch (err) {
      setError('Error creating room: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    alert('Room code copied to clipboard!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Room</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-body">
          <p>Click the button below to create a new room:</p>
          <button 
            className="create-room-btn"
            onClick={handleCreateRoom}
            disabled={loading}
          >
            {loading ? 'Creating Room...' : 'Generate Room Code'}
          </button>
        </div>
      </div>
    </div>
  );
};

const JoinRoomModal = ({ user, onClose, navigate }) => {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in again');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: roomCode })
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to room page
        navigate(`/room/${roomCode}`);
      } else {
        if (data.message === 'Not authorized to access this route') {
          setError('Session expired. Please log out and log back in.');
        } else {
          setError(data.message || 'Failed to join room');
        }
      }
    } catch (err) {
      setError('Error joining room: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Join Room</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-body">
          <p>Enter the 6-digit room code to join:</p>
          <input
            type="text"
            maxLength="6"
            placeholder="000000"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
            className="room-code-input"
          />
          <button 
            className="join-room-btn"
            onClick={handleJoinRoom}
            disabled={loading || roomCode.length !== 6}
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
