import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Stats.css';

const Stats = ({ user, onLogout }) => {
  const navigate = useNavigate();

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

  return (
    <div className="stats-page">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="stats-container">
        <div className="stats-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>📊 My Statistics</h1>
        </div>

        <div className="stats-content">
          {/* Profile Overview */}
          <div className="stats-card profile-overview">
            <div className="stats-card-header">
              <h2>Profile Overview</h2>
            </div>
            <div className="profile-overview-content">
              <div className="profile-avatar-stats">
                {user.username ? user.username.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="profile-overview-info">
                <h3>{user.username || 'Unknown'}</h3>
                <p className="profile-email">{user.email || 'N/A'}</p>
                <p className="profile-id">ID: {user.id || 'N/A'}</p>
              </div>
              <div className="profile-rating-tier">
                <p className="profile-rating">
                  <strong>Battle Rating:</strong> <span className="rating-value">{user.rating || 800}</span>
                </p>
                <p className="profile-tier">
                  <strong>Tier:</strong> <span className="tier-value" style={{ color: getTierColor(user.tier || 'Beginner') }}>
                    {user.tier || 'Beginner'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Custom Battle Statistics */}
          <div className="stats-card battle-stats">
            <div className="stats-card-header">
              <h2>⚔️ Custom Battle Statistics</h2>
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">🎯</div>
                <div className="stat-details">
                  <span className="stat-label">Custom Battles Fought</span>
                  <span className="stat-value">{user.battlesFought || 0}</span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">🏆</div>
                <div className="stat-details">
                  <span className="stat-label">Custom Wins</span>
                  <span className="stat-value">{user.customWins || 0}</span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">📈</div>
                <div className="stat-details">
                  <span className="stat-label">Win Rate</span>
                  <span className="stat-value">
                    {user.battlesFought > 0 
                      ? `${Math.round((user.customWins || 0) / user.battlesFought * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ashes Mode Statistics */}
          <div className="stats-card battle-stats ashes-mode">
            <div className="stats-card-header">
              <h2>🔥 Ashes Mode Statistics</h2>
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">⚡</div>
                <div className="stat-details">
                  <span className="stat-label">Ashes Battles Fought</span>
                  <span className="stat-value">{user.ashesBattles || 0}</span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">👑</div>
                <div className="stat-details">
                  <span className="stat-label">Ashes Wins</span>
                  <span className="stat-value">{user.ashesWins || 0}</span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">📊</div>
                <div className="stat-details">
                  <span className="stat-label">Win Rate</span>
                  <span className="stat-value">
                    {user.ashesBattles > 0 
                      ? `${Math.round((user.ashesWins || 0) / user.ashesBattles * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Rating & Tier */}
          <div className="stats-card battle-stats">
            <div className="stats-card-header">
              <h2>⭐ Overall Performance</h2>
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">🎮</div>
                <div className="stat-details">
                  <span className="stat-label">Total Battles</span>
                  <span className="stat-value">
                    {(user.battlesFought || 0) + (user.ashesBattles || 0)}
                  </span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">🏆</div>
                <div className="stat-details">
                  <span className="stat-label">Total Wins</span>
                  <span className="stat-value">
                    {(user.customWins || 0) + (user.ashesWins || 0)}
                  </span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">📊</div>
                <div className="stat-details">
                  <span className="stat-label">Win Percentage</span>
                  <span className="stat-value rating">
                    {((user.battlesFought || 0) + (user.ashesBattles || 0)) > 0 
                      ? `${Math.round(((user.customWins || 0) + (user.ashesWins || 0)) / ((user.battlesFought || 0) + (user.ashesBattles || 0)) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
