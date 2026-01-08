/**
 * ManualEntry Component
 * 
 * 6-digit code input for manual ticket verification.
 * Used when QR scanning fails or is not possible.
 * 
 * Designed for fast entry with large touch targets.
 */

import { useState, useRef, useEffect } from 'react';

export default function ManualEntry({ onSubmit, disabled }) {
  const [code, setCode] = useState('');
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);

    // Auto-submit when 6 digits entered
    if (value.length === 6) {
      onSubmit(value);
      setCode('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.length === 6) {
      onSubmit(code);
      setCode('');
    }
  };

  const handleKeypadClick = (digit) => {
    if (disabled) return;
    
    const newCode = (code + digit).slice(0, 6);
    setCode(newCode);

    // Auto-submit when 6 digits entered
    if (newCode.length === 6) {
      onSubmit(newCode);
      setCode('');
    }
  };

  const handleClear = () => {
    setCode('');
    inputRef.current?.focus();
  };

  const handleBackspace = () => {
    setCode(code.slice(0, -1));
  };

  return (
    <div className="manual-entry">
      <form onSubmit={handleSubmit}>
        <div className="code-display">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={code}
            onChange={handleChange}
            placeholder="______"
            maxLength={6}
            disabled={disabled}
            autoComplete="off"
            className="code-input"
          />
          <div className="code-boxes">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className={`code-box ${code[i] ? 'filled' : ''}`}
              >
                {code[i] || ''}
              </div>
            ))}
          </div>
        </div>

        {/* Virtual keypad for reliability on mobile */}
        <div className="keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              className="keypad-btn"
              onClick={() => handleKeypadClick(String(digit))}
              disabled={disabled}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            className="keypad-btn keypad-clear"
            onClick={handleClear}
            disabled={disabled}
          >
            CLR
          </button>
          <button
            type="button"
            className="keypad-btn"
            onClick={() => handleKeypadClick('0')}
            disabled={disabled}
          >
            0
          </button>
          <button
            type="button"
            className="keypad-btn keypad-back"
            onClick={handleBackspace}
            disabled={disabled}
          >
            ←
          </button>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={disabled || code.length !== 6}
        >
          Verify Code
        </button>
      </form>

      <p className="manual-hint">
        Enter the 6-digit code printed on the ticket
      </p>
    </div>
  );
}
