/**
 * DaySelector Component
 * 
 * CRITICAL: Allows explicit day selection for event scanning
 * 
 * Requirements:
 * - Must be clearly visible to volunteers
 * - Exactly one day active at all times
 * - NO automatic date detection
 * - Volunteer manually selects the correct day
 * 
 * This prevents timezone/clock issues and ensures
 * volunteers are always in control of which day's
 * tickets are being validated.
 */

export default function DaySelector({ currentDay, onDayChange }) {
  return (
    <div className="day-selector">
      <label className="day-selector-label">EVENT DAY:</label>
      <div className="day-selector-buttons">
        <button
          className={`day-btn ${currentDay === 1 ? 'active' : ''}`}
          onClick={() => onDayChange(1)}
          type="button"
        >
          DAY 1
        </button>
        <button
          className={`day-btn ${currentDay === 2 ? 'active' : ''}`}
          onClick={() => onDayChange(2)}
          type="button"
        >
          DAY 2
        </button>
      </div>
    </div>
  );
}
