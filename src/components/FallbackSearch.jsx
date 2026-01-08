/**
 * FallbackSearch Component
 * 
 * Search tickets by email or code for edge cases.
 * Shows ticket status and allows manual verification.
 * 
 * Used when:
 * - QR code is damaged
 * - Attendee lost their ticket
 * - Need to check status without scanning
 */

import { useState } from 'react';
import { searchTickets, verifyTicketById } from '../lib/ticketVerification';

export default function FallbackSearch({ currentDay, onResult }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [verifying, setVerifying] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.length < 3) return;

    setSearching(true);
    const tickets = await searchTickets(query);
    setResults(tickets);
    setSearching(false);
  };

  const handleVerify = async (ticketId) => {
    setVerifying(ticketId);
    const result = await verifyTicketById(ticketId, currentDay);
    setVerifying(null);
    onResult(result);
  };

  const getStatusBadge = (ticket) => {
    const { ticket_type, day1_used, day2_used } = ticket;

    if (ticket_type === 'DAY1') {
      if (currentDay !== 1) return { text: 'Wrong Day', class: 'badge-warning' };
      if (day1_used) return { text: 'Used', class: 'badge-error' };
      return { text: 'Valid', class: 'badge-success' };
    }

    if (ticket_type === 'DAY2') {
      if (currentDay !== 2) return { text: 'Wrong Day', class: 'badge-warning' };
      if (day2_used) return { text: 'Used', class: 'badge-error' };
      return { text: 'Valid', class: 'badge-success' };
    }

    if (ticket_type === 'COMBO') {
      if (currentDay === 1 && day1_used) return { text: 'Day 1 Used', class: 'badge-error' };
      if (currentDay === 2 && day2_used) return { text: 'Day 2 Used', class: 'badge-error' };
      return { text: 'Valid', class: 'badge-success' };
    }

    return { text: 'Unknown', class: 'badge-warning' };
  };

  return (
    <div className="fallback-search">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email or code..."
          className="search-input"
          autoComplete="off"
        />
        <button 
          type="submit" 
          disabled={searching || query.length < 3}
          className="search-btn"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="search-results">
          <p className="results-count">{results.length} ticket(s) found</p>
          
          {results.map((ticket) => {
            const status = getStatusBadge(ticket);
            const isVerifying = verifying === ticket.id;

            return (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <span className="ticket-code">{ticket.code_6_digit}</span>
                  <span className={`ticket-badge ${status.class}`}>
                    {status.text}
                  </span>
                </div>

                <div className="ticket-details">
                  {ticket.name && <p className="ticket-name">{ticket.name}</p>}
                  {ticket.email && <p className="ticket-email">{ticket.email}</p>}
                  <p className="ticket-type">{ticket.ticket_type} Ticket</p>
                </div>

                <div className="ticket-usage">
                  <span className={ticket.day1_used ? 'used' : 'unused'}>
                    Day 1: {ticket.day1_used ? '✓ Used' : '○ Not used'}
                  </span>
                  <span className={ticket.day2_used ? 'used' : 'unused'}>
                    Day 2: {ticket.day2_used ? '✓ Used' : '○ Not used'}
                  </span>
                </div>

                <button
                  onClick={() => handleVerify(ticket.id)}
                  disabled={isVerifying || status.class !== 'badge-success'}
                  className="verify-btn"
                >
                  {isVerifying ? 'Verifying...' : 'Allow Entry'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {results.length === 0 && query.length >= 3 && !searching && (
        <p className="no-results">No tickets found for "{query}"</p>
      )}
    </div>
  );
}
