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

export default function FallbackSearch({ onResult }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [verifying, setVerifying] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.length < 3) return;

    setSearching(true);
    console.log('🔍 FallbackSearch: Searching for:', query);
    const tickets = await searchTickets(query);
    console.log('🔍 FallbackSearch: Results:', tickets);
    setResults(tickets);
    setSearching(false);
  };

  const handleVerify = async (ticketId) => {
    setVerifying(ticketId);
    // Single ticket type - no day parameter needed
    const result = await verifyTicketById(ticketId);
    setVerifying(null);
    onResult(result);
  };

  const getStatusBadge = (ticket) => {
    // Use ticket_status from database
    const status = ticket.ticket_status?.toLowerCase();
    
    if (status === 'used') {
      return { text: 'Used', class: 'badge-error' };
    } else if (status === 'valid') {
      return { text: 'Valid', class: 'badge-success' };
    } else if (status === 'cancelled') {
      return { text: 'Cancelled', class: 'badge-error' };
    } else {
      // Default to valid if status is unknown
      return { text: 'Valid', class: 'badge-success' };
    }
  };

  return (
    <div className="fallback-search">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email, phone, code, or name..."
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
                  <span className="ticket-code">{ticket.six_digit_code}</span>
                  <span className={`ticket-badge ${status.class}`}>
                    {status.text}
                  </span>
                </div>

                <div className="ticket-details">
                  {ticket.name && <p className="ticket-name">{ticket.name}</p>}
                  {ticket.email && <p className="ticket-email">{ticket.email}</p>}
                  {ticket.college && <p className="ticket-college">{ticket.college}</p>}
                  {ticket.ticket_status && (
                    <p className="ticket-status">Status: {ticket.ticket_status}</p>
                  )}
                </div>

                <div className="ticket-usage">
                  <span className={ticket.ticket_status === 'used' ? 'used' : 'unused'}>
                    {ticket.ticket_status === 'used' 
                      ? 'Used'
                      : ticket.ticket_status === 'valid' 
                      ? 'Valid - Never used'
                      : ticket.ticket_status || 'Unknown status'}
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
