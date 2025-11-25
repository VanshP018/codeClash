import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';
import Leaderboard from './pages/Leaderboard';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App mounted, checking localStorage...');
    const user = localStorage.getItem('user');
    console.log('User from localStorage:', user);
    
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {
        console.error('Error parsing user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    console.log('isSignUp state changed:', isSignUp);
  }, [isSignUp]);

  const handleSignUp = (user) => {
    console.log('Sign up successful:', user);
    setCurrentUser(user);
    setIsSignUp(false);
  };

  const handleLogin = (user) => {
    console.log('Login successful:', user);
    setCurrentUser(user);
    setIsSignUp(false);
  };

  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsSignUp(false);
  };

  const toggleAuthMode = () => {
    console.log('Toggling auth mode from', isSignUp, 'to', !isSignUp);
    setIsSignUp(!isSignUp);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div>
                {isSignUp ? (
                  <div className="auth-container">
                    <SignUp onSignUp={handleSignUp} />
                    <div className="toggle-link">
                      <p>Already have an account? <button type="button" onClick={toggleAuthMode}>Login</button></p>
                    </div>
                  </div>
                ) : (
                  <div className="auth-container">
                    <Login onLogin={handleLogin} />
                    <div className="toggle-link">
                      <p>Don't have an account? <button type="button" onClick={toggleAuthMode}>Sign Up</button></p>
                    </div>
                  </div>
                )}
              </div>
            )
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            currentUser ? (
              <Dashboard user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/room/:code" 
          element={
            currentUser ? (
              <Room user={currentUser} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/leaderboard" 
          element={
            currentUser ? (
              <Leaderboard user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
