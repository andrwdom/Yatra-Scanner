/**
 * PasswordGate Component
 * 
 * Simple password authentication for volunteers.
 * No OAuth, no Supabase Auth - just a shared password.
 * Session persisted in localStorage.
 */

import { useState } from 'react';
import { getGatePassword } from '../lib/supabase';

const SESSION_KEY = 'yatra_scanner_auth';

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return localStorage.getItem(SESSION_KEY) === 'true';
}

/**
 * Clear authentication
 */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export default function PasswordGate({ onAuthenticated }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Small delay to prevent brute force
    setTimeout(() => {
      const correctPassword = getGatePassword();
      
      if (password === correctPassword) {
        localStorage.setItem(SESSION_KEY, 'true');
        onAuthenticated();
      } else {
        setError('Incorrect password');
        setPassword('');
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="password-gate">
      <div className="gate-container">
        <div className="gate-header">
          <h1>YATRA</h1>
          <p>Event Entry Scanner</p>
        </div>

        <form onSubmit={handleSubmit} className="gate-form">
          <label htmlFor="password">Volunteer Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="off"
            autoFocus
            disabled={loading}
          />
          
          {error && <div className="gate-error">{error}</div>}
          
          <button type="submit" disabled={loading || !password}>
            {loading ? 'Verifying...' : 'Enter'}
          </button>
        </form>

        <div className="gate-footer">
          <p>Authorized volunteers only</p>
        </div>
      </div>
    </div>
  );
}
