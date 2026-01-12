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
    const tickets = await searchTickets(query);
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
    const { last_used_at } = ticket;

    // Check if ticket was used within last 14 hours
    if (last_used_at) {
      const lastUsed = new Date(last_used_at);
      const hoursSinceUse = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUse < 14) {
        return { text: 'Recently Used', class: 'badge-error' };
      }
    }

    return { text: 'Valid', class: 'badge-success' };
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
                  <span className={ticket.last_used_at ? 'used' : 'unused'}>
                    {ticket.last_used_at 
                      ? `Last used: ${new Date(ticket.last_used_at).toLocaleString()}`
                      : 'Never used'}
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
