import React, { useState, useEffect } from 'react';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
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

  if (currentUser) {
    return <Dashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
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
  );
}

export default App;
