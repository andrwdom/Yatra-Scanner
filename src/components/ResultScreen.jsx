/**
 * ResultScreen Component
 * 
 * Full-screen result display after ticket verification.
 * GREEN = Entry allowed
 * RED = Entry rejected
 * 
 * Enhanced with:
 * - Current day display
 * - Timestamp
 * - Clear action buttons
 * - Specific rejection reasons
 */

import { useEffect } from 'react';

export default function ResultScreen({ result, onDismiss, onManualSearch }) {
  const { allowed, reason, message, ticketType, name } = result;

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Get display text based on reason
  const getReasonText = () => {
    switch (reason) {
      case 'VALID':
        return 'ENTRY ALLOWED';
      case 'ALREADY_USED':
        return 'ALREADY USED';
      case 'INVALID_TICKET':
        return 'INVALID TICKET';
      case 'ERROR':
        return 'SYSTEM ERROR';
      default:
        return 'REJECTED';
    }
  };

  // Get current time
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div 
      className={`result-screen ${allowed ? 'result-allowed' : 'result-rejected'}`}
    >
      <div className="result-content">
        {/* Large status icon */}
        <div className="result-icon">
          {allowed ? '✓' : '✕'}
        </div>

        {/* Main status text */}
        <h1 className="result-status">
          {getReasonText()}
        </h1>

        {/* Ticket details */}
        {name && (
          <p className="result-name">{name}</p>
        )}
        
        {ticketType && (
          <p className="result-type">
            {ticketType} Ticket
          </p>
        )}

        {/* Time info */}
        <div className="result-info">
          <p className="result-time">{currentTime}</p>
        </div>

        {/* Additional message */}
        <p className="result-message">{message}</p>

        {/* Action buttons */}
        <div className="result-actions">
          <button onClick={onDismiss} className="result-btn-primary">
            Scan Next
          </button>
          {!allowed && (
            <button onClick={onManualSearch} className="result-btn-secondary">
              Manual Search
            </button>
          )}
        </div>

        {/* Tap hint */}
        <p className="result-hint">Auto-dismiss in 4s or tap button</p>
      </div>
    </div>
  );
}
