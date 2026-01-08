# What's New - Enhanced Event Scanner

## 🎯 Major Features Added

### 1. **Explicit Day Selection** ✅ CRITICAL
- **Day selector UI** at top of scanner
- Two clear buttons: DAY 1 | DAY 2
- Volunteer manually selects correct day
- NO automatic date/timezone detection
- Confirmation dialog when switching days
- Selected day passed explicitly to all verification calls

**Why:** Prevents issues with device clocks, timezones, or date misconfigurations.

---

### 2. **Admin Override System** ✅ CRITICAL

**Access Control:**
- Separate admin PIN (different from volunteer password)
- PIN stored in environment variable (`VITE_ADMIN_PIN`)
- PIN verification before access to override functions

**Override Functions:**

**A) Force Allow Entry**
- Manually marks ticket as used for selected day
- Use when: Legitimate attendee, system glitch, damaged QR
- Requires: Admin name + detailed reason (min 10 characters)
- Action is permanently logged

**B) Reset Entry**
- Manually resets ticket usage for selected day
- Use when: Wrong ticket scanned, test scan, immediate mistake
- Requires: Admin name + detailed reason (min 10 characters)
- Action is permanently logged

**Override UI:**
1. Click "Admin Override" button in footer
2. Enter admin PIN
3. Search for ticket (by code, email, or UUID)
4. View full ticket details
5. View override history for that ticket
6. Choose action and provide justification
7. Confirm (with warning)

---

### 3. **Override Logging** ✅ CRITICAL

**New Database Table:** `override_logs`

Fields:
- `id` - Unique log entry
- `ticket_id` - Which ticket was affected
- `admin_action` - ALLOW or RESET
- `day` - DAY1 or DAY2
- `reason` - Admin's explanation
- `admin_identifier` - Admin name for accountability
- `created_at` - Timestamp

**Audit Trail:**
- Every override action is logged
- Cannot be deleted or modified
- Viewable in override UI
- Queryable for post-event analysis

**SQL Functions Added:**
- `admin_force_allow()` - Marks as used + logs
- `admin_reset_entry()` - Resets usage + logs
- `get_ticket_override_logs()` - View history

---

### 4. **Enhanced Result Screen** ✅

**Improvements:**
- Shows current day (DAY 1 / DAY 2)
- Shows current time (HH:MM:SS)
- Clear action buttons:
  - "Scan Next" (dismiss and continue)
  - "Manual Search" (for rejected tickets)
- Auto-dismiss extended to 4 seconds
- More detailed rejection reasons

**Result Types:**
- ✅ GREEN: ENTRY ALLOWED
- ❌ RED: ALREADY USED
- ❌ RED: WRONG DAY
- ❌ RED: INVALID TICKET
- ❌ RED: SYSTEM ERROR

---

### 5. **Hardened Verification Logic** ✅

**Explicit Day Parameter:**
- All verification functions now accept `currentDay` parameter
- NO automatic date detection
- Day is explicitly passed from UI state
- Prevents timezone/clock issues

**Updated Functions:**
- `verifyTicketById(ticketId, currentDay)`
- `verifyTicketByCode(code, currentDay)`

**Atomic Verification Still Enforced:**
- `SELECT ... FOR UPDATE` row locking
- Transaction-based updates
- Race condition prevention
- Two simultaneous scans → only one succeeds

---

### 6. **Fast Search Enhancements** ✅

**Already Existing, Now Enhanced:**
- Accepts email, 6-digit code, or UUID
- Shows full ticket status
- Day 1 and Day 2 usage indicators
- Can verify directly from search results
- Now respects selected day for verification

---

## 🔄 Breaking Changes

### Environment Variables

**RENAMED:**
- `VITE_CURRENT_DAY` → `VITE_DEFAULT_DAY`

**NEW:**
- `VITE_ADMIN_PIN` (required for override features)

**Updated .env format:**
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GATE_PASSWORD=...
VITE_ADMIN_PIN=9999          # NEW!
VITE_DEFAULT_DAY=1           # RENAMED
```

### Function Signatures

**CHANGED:**
```javascript
// Old
verifyTicketById(ticketId)
verifyTicketByCode(code)

// New - requires explicit day
verifyTicketById(ticketId, currentDay)
verifyTicketByCode(code, currentDay)
```

---

## 📁 New Files

### Database
- `supabase/migrations/002_override_logs.sql` - Override system schema

### Components
- `src/components/DaySelector.jsx` - Day selection UI
- `src/components/AdminOverride.jsx` - Admin interface

### Services
- `src/lib/adminOverride.js` - Override operations

### Documentation
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `WHATS_NEW.md` - This file

### Configuration
- `env.example` - Updated with admin PIN

---

## 🔧 Setup Required

### 1. Update Environment Variables

Add to your `.env`:
```env
VITE_ADMIN_PIN=your-secure-pin
VITE_DEFAULT_DAY=1
```

### 2. Run Database Migration

In Supabase SQL Editor:
```bash
# Copy and run entire file
supabase/migrations/002_override_logs.sql
```

### 3. Restart Dev Server

```bash
# Stop current server
Ctrl + C

# Restart
npm run dev
```

---

## 🎨 UI Changes

### Header
- Removed day badge from header
- Day now shown in dedicated selector

### New Section (after header)
- Day selector with DAY 1 / DAY 2 buttons
- Active day highlighted in white
- Confirmation on day switch

### Footer
- Added "Admin Override" button
- Positioned below status text

### Result Screen
- Added day display
- Added time display
- Added action buttons
- Improved layout

---

## 🚀 How to Use New Features

### Day Selection (Volunteers)

1. Login with volunteer password
2. Check day selector shows correct day
3. If wrong, click correct day button
4. Confirm switch
5. All scans now use selected day

### Admin Override (Admins Only)

1. Click "Admin Override" in footer
2. Enter admin PIN
3. Search for problematic ticket
4. Review ticket status and history
5. Choose action:
   - Force Allow (if legitimate)
   - Reset Entry (if mistake)
6. Enter your name
7. Provide detailed reason
8. Confirm action
9. Action is logged permanently

### Fast Recovery

**Scenario: QR camera fails**
1. Switch to Manual tab
2. Ask attendee for 6-digit code
3. Enter and verify

**Scenario: Lost ticket**
1. Click Search tab
2. Enter attendee email
3. Find ticket
4. Check status
5. Verify or call admin

---

## ✅ Testing Checklist

### Day Selection
- [ ] Switch from Day 1 to Day 2
- [ ] DAY1 ticket rejected on Day 2
- [ ] DAY2 ticket rejected on Day 1
- [ ] COMBO ticket works on both days

### Admin Override
- [ ] Wrong PIN rejected
- [ ] Correct PIN grants access
- [ ] Can search and find tickets
- [ ] Force allow works and logs
- [ ] Reset entry works and logs
- [ ] Override history displays

### Verification
- [ ] QR scan respects selected day
- [ ] Manual entry respects selected day
- [ ] Search respects selected day
- [ ] Double-scan still prevented

### Result Screen
- [ ] Shows correct day
- [ ] Shows current time
- [ ] "Scan Next" dismisses
- [ ] "Manual Search" switches to search

---

## 📊 Database Schema

### New Table: override_logs

```sql
CREATE TABLE override_logs (
    id UUID PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id),
    admin_action VARCHAR(20),  -- 'ALLOW' | 'RESET'
    day VARCHAR(10),           -- 'DAY1' | 'DAY2'
    reason TEXT,
    admin_identifier TEXT,
    created_at TIMESTAMPTZ
);
```

### New Functions

1. `admin_force_allow(ticket_id, day, reason, admin_name)`
2. `admin_reset_entry(ticket_id, day, reason, admin_name)`
3. `get_ticket_override_logs(ticket_id)`

---

## 🔒 Security Improvements

### Multi-Layer Access Control

1. **Level 1:** Volunteer password (scanner access)
2. **Level 2:** Admin PIN (override access)

### Accountability

- All overrides logged with:
  - Who (admin name)
  - What (action type)
  - When (timestamp)
  - Why (reason)
  - Which ticket

### Audit Trail

- Immutable override logs
- Post-event review possible
- Pattern detection for misuse

---

## 🎯 Production Readiness

### What Was Tested
✅ Day selection and switching
✅ Explicit day parameter passing
✅ Admin PIN protection
✅ Override actions and logging
✅ Enhanced result screen
✅ Search with day context

### What to Test Before Event
- [ ] Deploy to production URL
- [ ] Test on actual mobile devices
- [ ] Test with real QR codes
- [ ] Verify override logging works
- [ ] Check all SQL functions exist
- [ ] Distribute credentials securely

---

## 📞 Support

### Common Issues

**"Day not changing"**
- Restart dev server after `.env` change
- OR use day selector in UI (preferred)

**"Admin override button not working"**
- Check `VITE_ADMIN_PIN` is set
- Run 002_override_logs.sql migration
- Check browser console for errors

**"Verification still using wrong day"**
- Check day selector shows correct day
- Verify explicit day is passed to functions
- Check SQL function is being called

### Getting Help

1. Check browser console (F12)
2. Check Supabase logs
3. Review `DEPLOYMENT_GUIDE.md`
4. Check `TROUBLESHOOTING_SEARCH.md`

---

## 📈 Performance Impact

### No Significant Performance Impact

- Day selector: Lightweight UI, no network calls
- Admin override: Only used occasionally
- Override logging: Single INSERT, fast
- Verification logic: Same atomic transaction

### Still Optimized For

- Low-end Android phones
- Slow 3G/4G connections
- High-volume gates
- Quick scan → result flow

---

## 🎉 Summary

The scanner is now **production-ready** with:

✅ Manual day control (no auto-detection)
✅ Admin override system with logging
✅ Enhanced security (2-level access)
✅ Better error recovery
✅ Full audit trail
✅ Improved UX

**Ready for live event use with long queues!**
