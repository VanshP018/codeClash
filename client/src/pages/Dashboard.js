import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
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

        <div className="room-buttons">
          <button 
            className="room-btn create-btn"
            onClick={() => {
              setShowCreateRoom(true);
              setShowJoinRoom(false);
            }}
          >
            ➕ Create Room
          </button>
          <button 
            className="room-btn join-btn"
            onClick={() => {
              setShowJoinRoom(true);
              setShowCreateRoom(false);
            }}
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

const CreateRoomModal = ({ user, onClose, navigate }) => {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
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
        setError(data.message || 'Failed to create room');
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
        setError(data.message || 'Failed to join room');
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
