import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import roomService from '../services/roomService';
import './Room.css';

const Room = ({ user }) => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const intervalRef = React.useRef(null);

  const fetchRoomDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/rooms/${code}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setRoom(data.room);
        setError('');
      } else {
        setError(data.message || 'Failed to load room details');
      }
    } catch (err) {
      setError('Error loading room: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomDetails();
    // Poll for updates every 2 seconds for real-time participant updates
    intervalRef.current = setInterval(fetchRoomDetails, 2000);
    
    // Cleanup: Leave room when component unmounts (user closes tab/browser)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleLeaveRoom = async () => {
    // Stop polling immediately
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsLeaving(true);
    try {
      const token = localStorage.getItem('token');
      await roomService.leaveRoom(code, token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error leaving room:', err);
      // Navigate anyway even if API call fails
      navigate('/dashboard');
    }
  };

  const handleStartBattle = async () => {
    setIsStarting(true);
    try {
      // TODO: Implement start battle logic
      console.log('Starting battle...');
      alert('Starting battle!');
    } catch (err) {
      console.error('Error starting battle:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    alert('Room code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="room-loading">
        <div className="spinner"></div>
        <p>Loading room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-error">
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button onClick={handleLeaveRoom} className="back-btn">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isCreator = room && user && room.createdBy._id === user.id;
  const participantCount = room?.participants?.length || 0;

  return (
    <div className="room-container">
      <div className="room-header">
        <div className="room-code-section">
          <h1>Room Code</h1>
          <div className="room-code-display-large">
            <span className="code">{code}</span>
            <button onClick={copyCode} className="copy-btn-small" title="Copy code">
              📋
            </button>
          </div>
          {isCreator && <span className="creator-badge">👑 You created this room</span>}
        </div>
        <button onClick={handleLeaveRoom} className="leave-btn" disabled={isLeaving}>
          {isLeaving ? 'Leaving...' : '← Leave Room'}
        </button>
      </div>

      <div className="room-content">
        <div className="room-info-card">
          <div className="info-header">
            <h2>👥 Participants ({participantCount})</h2>
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span>Live</span>
            </div>
          </div>

          <div className="participants-list">
            {room?.participants?.map((participant, index) => (
              <div key={participant._id} className="participant-item">
                <div className="participant-avatar">
                  {participant.username.charAt(0).toUpperCase()}
                </div>
                <div className="participant-info">
                  <div className="participant-name">
                    {participant.username}
                    {participant._id === room.createdBy._id && (
                      <span className="host-tag">Host</span>
                    )}
                    {participant._id === user.id && (
                      <span className="you-tag">You</span>
                    )}
                  </div>
                  <div className="participant-email">{participant.email}</div>
                </div>
              </div>
            ))}
          </div>

          {participantCount === 1 && (
            <div className="waiting-message">
              <p>🔗 Share the room code with others to get started!</p>
              <p className="hint">Waiting for others to join...</p>
            </div>
          )}
        </div>

        <div className="room-actions-card">
          <h3>Room Information</h3>
          <div className="room-meta">
            <div className="meta-item">
              <span className="meta-label">Room Code:</span>
              <span className="meta-value">{code}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Created by:</span>
              <span className="meta-value">{room?.createdBy?.username}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Status:</span>
              <span className="meta-value status-active">Active</span>
            </div>
          </div>

          <div className="share-section">
            <p>Invite others to join:</p>
            <div className="share-code-box">
              <input 
                type="text" 
                value={code} 
                readOnly 
                className="share-input"
              />
              <button onClick={copyCode} className="copy-share-btn">
                Copy
              </button>
            </div>
          </div>

          <div className="battle-start-section">
            {isCreator ? (
              <button 
                onClick={handleStartBattle} 
                className="start-battle-btn"
                disabled={isStarting || participantCount < 2}
              >
                {isStarting ? '⏳ Starting...' : '🚀 Start Battle'}
              </button>
            ) : (
              <div className="waiting-host-message">
                <p>⏰ Host will start the battle soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
