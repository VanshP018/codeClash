import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import './Leaderboard.css';

const Leaderboard = ({ user, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/leaderboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
      } else {
        setError(data.message || 'Failed to load leaderboard');
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError('Error loading leaderboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTierColor = (tier) => {
    switch(tier) {
      case 'Beginner': return '#95a5a6';
      case 'Bronze': return '#cd7f32';
      case 'Silver': return '#c0c0c0';
      case 'Gold': return '#ffd700';
      case 'Platinum': return '#e5e4e2';
      case 'Diamond': return '#b9f2ff';
      default: return '#95a5a6';
    }
  };

  const getRankMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  return (
    <div className="leaderboard-page">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="leaderboard-content">
        <div className="leaderboard-header">
          <h1>🏆 Global Leaderboard</h1>
          <p>Top players ranked by battle rating</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button onClick={fetchLeaderboard}>Retry</button>
          </div>
        ) : (
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Rating</th>
                  <th>Battles</th>
                  <th>Tier</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem) => (
                  <tr 
                    key={userItem.id} 
                    className={user && userItem.id === user.id ? 'current-user' : ''}
                  >
                    <td className="rank-cell">
                      <span className="rank-badge">
                        {getRankMedal(userItem.rank)}
                      </span>
                    </td>
                    <td className="player-cell">
                      <div className="player-avatar">
                        {userItem.username ? userItem.username.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="player-info">
                        <span className="player-name">
                          {userItem.username || 'Unknown'}
                          {user && userItem.id === user.id && (
                            <span className="you-badge">You</span>
                          )}
                        </span>
                        <span className="player-email">{userItem.email || ''}</span>
                      </div>
                    </td>
                    <td className="rating-cell">
                      <span className="rating-value">{userItem.rating || 0}</span>
                    </td>
                    <td className="battles-cell">{userItem.battlesFought || 0}</td>
                    <td className="tier-cell">
                      <span 
                        className="tier-badge" 
                        style={{ backgroundColor: getTierColor(userItem.tier || 'Beginner') }}
                      >
                        {userItem.tier || 'Beginner'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="no-data">
                <p>No users found on the leaderboard yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
