# YATRA Scanner - Deployment Guide

## 🚀 Quick Deployment Checklist

### Step 1: Database Setup (Supabase)

1. **Run the override logs migration:**
   ```sql
   -- Copy and run: supabase/migrations/002_override_logs.sql
   ```

2. **Verify all functions exist:**
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public';
   ```
   
   Should show:
   - `verify_and_mark_ticket`
   - `get_ticket_by_code`
   - `search_tickets`
   - `admin_force_allow`
   - `admin_reset_entry`
   - `get_ticket_override_logs`

3. **Grant permissions:**
   ```sql
   GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
   ```

### Step 2: Environment Variables

Update your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Volunteer password
VITE_GATE_PASSWORD=VolunteerPass2024

# Admin PIN (different from volunteer password!)
VITE_ADMIN_PIN=9876

# Default day (volunteers can change this in UI)
VITE_DEFAULT_DAY=1
```

**CRITICAL:**
- Use different values for `VITE_GATE_PASSWORD` and `VITE_ADMIN_PIN`
- Never commit `.env` to version control
- Share passwords securely with team

### Step 3: Test Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Test each feature:
# - Day selector (switch between Day 1 and Day 2)
# - QR scan
# - Manual entry
# - Search
# - Admin override (enter admin PIN)
```

### Step 4: Build for Production

```bash
npm run build
```

### Step 5: Deploy

**Option A: Vercel (Recommended)**
```bash
npm install -g vercel
vercel --prod
```

Add environment variables in Vercel dashboard.

**Option B: Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

Add environment variables in Netlify dashboard.

---

## 📱 On Event Day

### Morning Setup (1 hour before gates open)

1. **Verify correct day is set:**
   - Open scanner app
   - Login with volunteer password
   - Check day selector shows correct day
   - Volunteers can toggle if needed

2. **Test with sample tickets:**
   - Scan a test QR code
   - Enter a test 6-digit code
   - Verify GREEN screen appears
   - Scan same ticket again
   - Verify RED "Already Used" appears

3. **Brief volunteers:**
   - Password for scanner login
   - How to switch days (if needed)
   - When to use search mode
   - When to call admin for override

4. **Admin PIN distribution:**
   - Only give admin PIN to 2-3 trusted admins
   - Explain when overrides are appropriate
   - Emphasize all overrides are logged

### During Event

**Volunteer Workflow:**
1. Attendee shows QR code
2. Volunteer scans with camera
3. GREEN = allow entry
4. RED = reject and explain why

**If QR doesn't work:**
1. Switch to Manual tab
2. Ask attendee for 6-digit code
3. Enter code and verify

**If ticket issue:**
1. Use Search tab
2. Search by email or code
3. Check ticket status
4. Call admin if override needed

**Admin Override (Emergency Only):**
- Login with admin PIN
- Search for ticket
- Choose action:
  - **Force Allow**: Legitimate attendee, system glitch
  - **Reset Entry**: Wrong ticket scanned by mistake
- Enter your name
- Enter detailed reason (required)
- Confirm action

---

## 🔒 Security Best Practices

### Password Management

1. **Volunteer Password:**
   - Share via secure channel (Signal, WhatsApp)
   - Change between days if possible
   - Don't write on physical boards

2. **Admin PIN:**
   - Only 2-3 people should know
   - Separate from volunteer password
   - Never share publicly

### Override Logging

All admin actions are logged with:
- Ticket details
- Action type (ALLOW/RESET)
- Day
- Reason
- Admin name
- Timestamp

**Post-event audit:**
```sql
-- View all overrides
SELECT * FROM override_logs ORDER BY created_at DESC;

-- Count overrides by admin
SELECT admin_identifier, COUNT(*) 
FROM override_logs 
GROUP BY admin_identifier;
```

---

## 🛠️ Troubleshooting

### "Day not updating in UI"
- Restart dev server after changing `.env`
- OR use day selector in UI (no restart needed)

### "Admin override not working"
- Check admin PIN in `.env` matches
- Verify `002_override_logs.sql` migration ran
- Check browser console for errors

### "Search returns no results"
- Verify `search_tickets` function exists
- Check RLS policies allow read access
- Try exact 6-digit code first

### "Double-scan prevention not working"
- Verify `FOR UPDATE` is in SQL function
- Check that both scans use same `currentDay`
- Review database transaction logs

### "Offline/Network Error"
- Scanner requires internet connection
- Check Supabase project is not paused
- Verify API keys are correct

---

## 📊 Post-Event Analysis

### View Entry Statistics

```sql
-- Total entries by day
SELECT 
  SUM(CASE WHEN day1_used THEN 1 ELSE 0 END) as day1_entries,
  SUM(CASE WHEN day2_used THEN 1 ELSE 0 END) as day2_entries
FROM tickets;

-- Entries by ticket type
SELECT ticket_type, 
  SUM(CASE WHEN day1_used THEN 1 ELSE 0 END) as day1,
  SUM(CASE WHEN day2_used THEN 1 ELSE 0 END) as day2
FROM tickets
GROUP BY ticket_type;

-- No-show analysis
SELECT ticket_type, COUNT(*) as no_shows
FROM tickets
WHERE NOT day1_used AND NOT day2_used
GROUP BY ticket_type;
```

### View Override Activity

```sql
-- All overrides with context
SELECT 
  t.code_6_digit,
  t.name,
  ol.admin_action,
  ol.day,
  ol.reason,
  ol.admin_identifier,
  ol.created_at
FROM override_logs ol
JOIN tickets t ON ol.ticket_id = t.id
ORDER BY ol.created_at DESC;

-- Overrides per hour
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as override_count
FROM override_logs
GROUP BY hour
ORDER BY hour;
```

---

## 🎯 Performance Optimization

### For High-Traffic Gates

1. **Multiple scanners:**
   - Each volunteer gets their own device
   - All connect to same Supabase backend
   - Atomic verification prevents duplicates

2. **Network optimization:**
   - Ensure strong WiFi at gate
   - Consider 4G backup
   - Test connection speed before event

3. **UI optimization:**
   - Already optimized (no heavy animations)
   - Works on low-end Android phones
   - Auto-dismiss results after 4 seconds

---

## 📝 Maintenance

### Between Events

1. **Clear test data:**
   ```sql
   DELETE FROM tickets WHERE email LIKE '%@test.com';
   DELETE FROM override_logs WHERE ticket_id IN 
     (SELECT id FROM tickets WHERE email LIKE '%@test.com');
   ```

2. **Reset tickets for new event:**
   ```sql
   UPDATE tickets SET 
     day1_used = FALSE,
     day2_used = FALSE;
   
   -- Clear override logs
   TRUNCATE override_logs;
   ```

3. **Backup data:**
   - Export tickets table as CSV
   - Export override_logs as CSV
   - Store securely for records

---

## 🔐 Admin Override Guidelines

### When to Use Force Allow

✅ **Appropriate:**
- Attendee has valid ticket but QR damaged
- System glitch during initial scan
- Legitimate VIP/special circumstance
- Technical issue with specific ticket

❌ **Never:**
- Friend/family without ticket
- Ticket was legitimately used already
- Person asking for "special favor"

### When to Use Reset Entry

✅ **Appropriate:**
- Volunteer scanned wrong ticket by accident
- Attendee scanned but didn't enter (left immediately)
- Test scan that wasn't meant to count

❌ **Never:**
- Attendee wants to re-enter after leaving
- Selling re-entry
- Circumventing ticket policies

**Remember:** All overrides are permanently logged!

---

## 📱 Mobile Device Setup

### Recommended Devices
- Any smartphone with camera
- Minimum: Android 8+ or iOS 12+
- Good lighting at gate recommended

### Browser Compatibility
- Chrome (recommended)
- Safari (iOS)
- Firefox
- Edge

### Camera Permissions
1. First scan will request camera access
2. Must allow in browser settings
3. HTTPS required for camera (deploy provides this)

---

## ✅ Pre-Event Final Checklist

**24 Hours Before:**
- [ ] Database migrations applied
- [ ] Test tickets created and tested
- [ ] Environment variables set
- [ ] App deployed and accessible
- [ ] Volunteer passwords distributed
- [ ] Admin PIN to authorized personnel only

**1 Hour Before:**
- [ ] Test QR scanning
- [ ] Test manual entry
- [ ] Test day switching
- [ ] Test admin override
- [ ] Verify network connection
- [ ] Devices charged
- [ ] Backup device ready

**Go Time:**
- [ ] All volunteers logged in
- [ ] Correct day selected
- [ ] First test scan successful
- [ ] Admin on standby

---

Good luck with your event! 🎉
