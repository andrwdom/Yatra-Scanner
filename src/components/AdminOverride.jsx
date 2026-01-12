/**
 * AdminOverride Component
 * 
 * Protected admin interface for:
 * - Force allowing entry (when legitimate issue)
 * - Resetting entry (when wrong ticket scanned)
 * - Viewing ticket status and override logs
 * 
 * Access: Requires separate admin PIN
 * All actions are logged for audit trail
 */

import { useState } from 'react';
import { searchTickets, getTicketStatus } from '../lib/ticketVerification';
import { adminForceAllow, adminResetEntry, getOverrideLogs } from '../lib/adminOverride';
import { getAdminPin } from '../lib/supabase';

export default function AdminOverride({ onClose, onResult }) {
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [overrideLogs, setOverrideLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [actionReason, setActionReason] = useState('');
  const [adminName, setAdminName] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  // Verify admin PIN
  const handlePinSubmit = (e) => {
    e.preventDefault();
    const correctPin = getAdminPin();
    
    if (pinInput === correctPin) {
      setPinVerified(true);
      setPinError('');
    } else {
      setPinError('Invalid admin PIN');
      setPinInput('');
    }
  };

  // Search for tickets
  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 3) return;
    
    setLoading(true);
    const results = await searchTickets(searchQuery);
    setSearchResults(results);
    setLoading(false);
  };

  // Select a ticket to view details
  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setLoading(true);
    
    // Get override logs for this ticket
    const logs = await getOverrideLogs(ticket.id);
    setOverrideLogs(logs);
    
    setLoading(false);
  };

  // Force allow entry
  const handleForceAllow = async () => {
    if (!actionReason || actionReason.trim().length < 10) {
      alert('Please provide a reason (minimum 10 characters)');
      return;
    }
    
    if (!adminName || adminName.trim().length < 2) {
      alert('Please enter your name for audit trail');
      return;
    }

    if (!confirm(`Force allow entry for ${selectedTicket.name}?\n\nThis action will be logged.`)) {
      return;
    }

    setActionInProgress(true);
    const result = await adminForceAllow(
      selectedTicket.id,
      currentDay,
      actionReason,
      adminName
    );
    setActionInProgress(false);

    if (result.success) {
      alert(`✓ Entry forced successfully\n\n${result.message}`);
      setActionReason('');
      // Refresh ticket details
      handleSelectTicket(selectedTicket);
    } else {
      alert(`✗ Failed to force entry\n\n${result.message}`);
    }
  };

  // Reset entry
  const handleResetEntry = async () => {
    if (!actionReason || actionReason.trim().length < 10) {
      alert('Please provide a reason (minimum 10 characters)');
      return;
    }
    
    if (!adminName || adminName.trim().length < 2) {
      alert('Please enter your name for audit trail');
      return;
    }

    if (!confirm(`Reset entry for ${selectedTicket.name}?\n\nThis action will be logged.`)) {
      return;
    }

    setActionInProgress(true);
    const result = await adminResetEntry(
      selectedTicket.id,
      currentDay,
      actionReason,
      adminName
    );
    setActionInProgress(false);

    if (result.success) {
      alert(`✓ Entry reset successfully\n\n${result.message}`);
      setActionReason('');
      // Refresh ticket details
      handleSelectTicket(selectedTicket);
    } else {
      alert(`✗ Failed to reset entry\n\n${result.message}`);
    }
  };

  // PIN verification screen
  if (!pinVerified) {
    return (
      <div className="admin-override-screen">
        <div className="admin-overlay-content">
          <h2>ADMIN OVERRIDE</h2>
          <p className="admin-warning">Protected Area - Admin Access Only</p>
          
          <form onSubmit={handlePinSubmit} className="admin-pin-form">
            <label htmlFor="admin-pin">Enter Admin PIN:</label>
            <input
              id="admin-pin"
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              autoFocus
              maxLength={6}
            />
            
            {pinError && <div className="admin-pin-error">{pinError}</div>}
            
            <div className="admin-pin-buttons">
              <button type="submit" disabled={!pinInput}>
                Verify
              </button>
              <button type="button" onClick={onClose} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Main admin interface
  return (
    <div className="admin-override-screen">
      <div className="admin-header">
        <h2>ADMIN OVERRIDE MODE</h2>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      <div className="admin-content">
        {/* Search section */}
        {!selectedTicket && (
          <div className="admin-search-section">
            <h3>Search Ticket</h3>
            <div className="admin-search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Email, code, or UUID..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} disabled={loading || searchQuery.length < 3}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="admin-search-results">
                {searchResults.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="admin-ticket-result"
                    onClick={() => handleSelectTicket(ticket)}
                  >
                    <div className="admin-ticket-code">{ticket.six_digit_code}</div>
                    <div className="admin-ticket-info">
                      <div className="admin-ticket-name">{ticket.name}</div>
                      <div className="admin-ticket-email">{ticket.email}</div>
                      {ticket.college && (
                        <div className="admin-ticket-college">{ticket.college}</div>
                      )}
                    </div>
                    <div className="admin-ticket-status">
                      <span className={ticket.ticket_status === 'used' ? 'used' : 'unused'}>
                        {ticket.ticket_status === 'used' 
                          ? 'Used'
                          : ticket.ticket_status === 'valid'
                          ? 'Valid'
                          : ticket.ticket_status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ticket details and actions */}
        {selectedTicket && (
          <div className="admin-ticket-details">
            <button onClick={() => setSelectedTicket(null)} className="back-btn">
              ← Back to Search
            </button>

            <div className="admin-ticket-card">
              <h3>Ticket Details</h3>
              <div className="admin-detail-row">
                <span className="label">Code:</span>
                <span className="value">{selectedTicket.six_digit_code}</span>
              </div>
              <div className="admin-detail-row">
                <span className="label">Name:</span>
                <span className="value">{selectedTicket.name}</span>
              </div>
              <div className="admin-detail-row">
                <span className="label">Email:</span>
                <span className="value">{selectedTicket.email}</span>
              </div>
              {selectedTicket.college && (
                <div className="admin-detail-row">
                  <span className="label">College:</span>
                  <span className="value">{selectedTicket.college}</span>
                </div>
              )}
              <div className="admin-detail-row">
                <span className="label">Status:</span>
                <span className={`value ${selectedTicket.ticket_status === 'used' ? 'used' : 'unused'}`}>
                  {selectedTicket.ticket_status || 'Unknown'}
                </span>
              </div>
              {selectedTicket.registration_id && (
                <div className="admin-detail-row">
                  <span className="label">Registration ID:</span>
                  <span className="value">{selectedTicket.registration_id}</span>
                </div>
              )}
            </div>

            {/* Override actions */}
            <div className="admin-actions-card">
              <h3>Override Actions</h3>
              
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Your name (for audit)"
                className="admin-name-input"
              />
              
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Reason for override (minimum 10 characters)..."
                rows={3}
                className="admin-reason-input"
              />

              <div className="admin-action-buttons">
                <button
                  onClick={handleForceAllow}
                  disabled={actionInProgress || !actionReason || !adminName}
                  className="force-allow-btn"
                >
                  Force Allow Entry
                </button>
                <button
                  onClick={handleResetEntry}
                  disabled={actionInProgress || !actionReason || !adminName}
                  className="reset-entry-btn"
                >
                  Reset Entry
                </button>
              </div>
            </div>

            {/* Override logs */}
            {overrideLogs.length > 0 && (
              <div className="admin-logs-card">
                <h3>Override History</h3>
                {overrideLogs.map((log) => (
                  <div key={log.id} className="admin-log-entry">
                    <div className="log-header">
                      <span className={`log-action ${log.admin_action.toLowerCase()}`}>
                        {log.admin_action}
                      </span>
                      <span className="log-day">{log.day}</span>
                      <span className="log-time">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="log-reason">{log.reason}</div>
                    <div className="log-admin">By: {log.admin_identifier}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
