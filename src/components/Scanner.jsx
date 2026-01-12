/**
 * Scanner Component
 * 
 * Main scanner interface with:
 * 1. QR Scan - Camera-based QR code scanning
 * 2. Manual Entry - 6-digit code input
 * 3. Search - Fallback ticket lookup
 * 4. Admin Override - Protected admin actions
 * 
 * CRITICAL: Uses explicit day selection (not auto-detection)
 */

import { useState, useCallback } from 'react';
import QRScanner from './QRScanner';
import ManualEntry from './ManualEntry';
import FallbackSearch from './FallbackSearch';
import ResultScreen from './ResultScreen';
import AdminOverride from './AdminOverride';
import { verifyTicketById, verifyTicketByCode } from '../lib/ticketVerification';
import { logout } from './PasswordGate';

const MODES = {
  QR: 'qr',
  MANUAL: 'manual',
  SEARCH: 'search',
};

export default function Scanner({ onLogout }) {
  const [mode, setMode] = useState(MODES.QR);
  const [result, setResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [showAdminOverride, setShowAdminOverride] = useState(false);

  // Handle QR code scan
  const handleQRScan = useCallback(async (scannedText) => {
    if (verifying) return; // Prevent double-scan
    
    setVerifying(true);
    // Single ticket type - no day parameter needed
    const verificationResult = await verifyTicketById(scannedText);
    setResult(verificationResult);
    setVerifying(false);
  }, [verifying]);

  // Handle manual code entry
  const handleManualEntry = useCallback(async (code) => {
    if (verifying) return;
    
    setVerifying(true);
    // Single ticket type - no day parameter needed
    const verificationResult = await verifyTicketByCode(code);
    setResult(verificationResult);
    setVerifying(false);
  }, [verifying]);

  // Handle search result verification
  const handleSearchResult = useCallback((verificationResult) => {
    setResult(verificationResult);
  }, []);

  // Dismiss result screen
  const handleDismiss = useCallback(() => {
    setResult(null);
  }, []);

  // Switch to manual search from result screen
  const handleSwitchToSearch = useCallback(() => {
    setResult(null);
    setMode(MODES.SEARCH);
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    onLogout();
  };

  // Show admin override if active
  if (showAdminOverride) {
    return (
      <AdminOverride
        onClose={() => setShowAdminOverride(false)}
        onResult={setResult}
      />
    );
  }

  // Show result screen if we have a result
  if (result) {
    return (
      <ResultScreen
        result={result}
        onDismiss={handleDismiss}
        onManualSearch={handleSwitchToSearch}
      />
    );
  }

  return (
    <div className="scanner">
      {/* Header */}
      <header className="scanner-header">
        <div className="header-left">
          <h1>YATRA</h1>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Mode tabs */}
      <nav className="mode-tabs">
        <button
          className={`mode-tab ${mode === MODES.QR ? 'active' : ''}`}
          onClick={() => setMode(MODES.QR)}
        >
          📷 QR Scan
        </button>
        <button
          className={`mode-tab ${mode === MODES.MANUAL ? 'active' : ''}`}
          onClick={() => setMode(MODES.MANUAL)}
        >
          ⌨️ Manual
        </button>
        <button
          className={`mode-tab ${mode === MODES.SEARCH ? 'active' : ''}`}
          onClick={() => setMode(MODES.SEARCH)}
        >
          🔍 Search
        </button>
      </nav>

      {/* Main content area */}
      <main className="scanner-content">
        {verifying && (
          <div className="verifying-overlay">
            <p>Verifying...</p>
          </div>
        )}

        {mode === MODES.QR && (
          <QRScanner onScan={handleQRScan} disabled={verifying} />
        )}

        {mode === MODES.MANUAL && (
          <ManualEntry onSubmit={handleManualEntry} disabled={verifying} />
        )}

        {mode === MODES.SEARCH && (
          <FallbackSearch onResult={handleSearchResult} />
        )}
      </main>

      {/* Footer with admin override and status */}
      <footer className="scanner-footer">
        <p>Ready to scan</p>
        <button 
          className="admin-override-trigger"
          onClick={() => setShowAdminOverride(true)}
        >
          Admin Override
        </button>
      </footer>
    </div>
  );
}
