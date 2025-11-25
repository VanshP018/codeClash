import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);

  // Safety check for user
  if (!user) {
    return null;
  }

  const isActive = (path) => {
    return location.pathname === path;
  };

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
    <>
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">⚔️</span>
            <span className="logo-text">CodeClash</span>
          </div>
        </div>

        <div className="sidebar-user">
          <div 
            className="sidebar-avatar"
            onClick={() => setShowProfile(true)}
          >
            {user.username ? user.username.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-username">{user.username || 'User'}</span>
            <span className="sidebar-rating">⭐ {user.rating || 800}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Dashboard</span>
          </button>

          <button 
            className={`nav-item ${isActive('/leaderboard') ? 'active' : ''}`}
            onClick={() => navigate('/leaderboard')}
          >
            <span className="nav-icon">🏆</span>
            <span className="nav-text">Leaderboard</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn-sidebar" onClick={onLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Logout</span>
          </button>
        </div>
      </div>

      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Profile</h2>
              <button className="close-btn" onClick={() => setShowProfile(false)}>✕</button>
            </div>

            <div className="profile-modal-body">
              <div className="profile-avatar-large">
                {user.username ? user.username.charAt(0).toUpperCase() : '?'}
              </div>

              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <span className="profile-label">Username</span>
                  <span className="profile-value">{user.username || 'Unknown'}</span>
                </div>

                <div className="profile-info-item">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{user.email || 'N/A'}</span>
                </div>

                <div className="profile-info-item">
                  <span className="profile-label">User ID</span>
                  <span className="profile-value">{user.id || 'N/A'}</span>
                </div>

                <div className="profile-info-item">
                  <span className="profile-label">Battle Rating</span>
                  <span className="profile-value rating">{user.rating || 800}</span>
                </div>

                <div className="profile-info-item">
                  <span className="profile-label">Battles Fought</span>
                  <span className="profile-value">{user.battlesFought || 0}</span>
                </div>

                <div className="profile-info-item">
                  <span className="profile-label">Tier</span>
                  <span 
                    className="profile-value tier"
                    style={{ color: getTierColor(user.tier || 'Beginner') }}
                  >
                    {user.tier || 'Beginner'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
