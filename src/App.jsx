/**
 * YATRA Event Entry Scanner
 * 
 * Main application component.
 * Handles authentication state and renders appropriate view.
 */

import { useState, useEffect } from 'react';
import PasswordGate, { isAuthenticated } from './components/PasswordGate';
import Scanner from './components/Scanner';
import './App.css';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setChecking(false);
  }, []);

  // Handle successful authentication
  const handleAuthenticated = () => {
    setAuthenticated(true);
  };

  // Handle logout
  const handleLogout = () => {
    setAuthenticated(false);
  };

  // Show nothing while checking auth
  if (checking) {
    return (
      <div className="app-loading">
        <p>Loading...</p>
      </div>
    );
  }

  // Show password gate if not authenticated
  if (!authenticated) {
    return <PasswordGate onAuthenticated={handleAuthenticated} />;
  }

  // Show scanner if authenticated
  return <Scanner onLogout={handleLogout} />;
}
