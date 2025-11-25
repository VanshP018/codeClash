import React from 'react';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user.username}!</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
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
      </div>
    </div>
  );
};

export default Dashboard;
