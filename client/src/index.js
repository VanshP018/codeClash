import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Clear localStorage on app startup to ensure fresh start
if (!sessionStorage.getItem('sessionInitialized')) {
  // First time in this session - clear old data
  localStorage.clear();
  sessionStorage.setItem('sessionInitialized', 'true');
  console.log('Initialized fresh session - cleared localStorage');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
