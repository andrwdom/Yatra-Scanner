# 🚀 Quick Start Checklist

Follow this checklist in order:

## ☐ 1. Supabase Account Setup (5 minutes)
- [ ] Go to https://supabase.com
- [ ] Sign up with GitHub or email
- [ ] Create new project named "YATRA Event Scanner"
- [ ] Choose FREE plan
- [ ] Select region (closest to your location)
- [ ] Wait for project to provision (~2 minutes)

## ☐ 2. Get Your Credentials (2 minutes)
- [ ] Click ⚙️ **Settings** (left sidebar, bottom)
- [ ] Click **API**
- [ ] Copy **Project URL** (looks like: `https://xxx.supabase.co`)
- [ ] Copy **anon/public** key (long string starting with `eyJ...`)

## ☐ 3. Create .env File (1 minute)
- [ ] Create file: `D:\Productivity\YATRA SCANNER\.env`
- [ ] Add this content (replace with YOUR values):

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...YOUR-KEY-HERE
VITE_GATE_PASSWORD=YourSecurePassword123
VITE_CURRENT_DAY=1
```

## ☐ 4. Set Up Database (3 minutes)
- [ ] In Supabase, click **SQL Editor** (left sidebar)
- [ ] Open file: `supabase/migrations/001_tickets_table.sql`
- [ ] Copy ALL contents
- [ ] Paste into SQL Editor
- [ ] Click **"Run"**
- [ ] Verify: Click **Table Editor** → should see **tickets** table

## ☐ 5. Disable RLS (1 minute)
- [ ] In **Table Editor** → **tickets**
- [ ] Click shield icon
- [ ] Toggle **"Enable RLS"** to OFF
- [ ] Click **"Save"**

## ☐ 6. Add Test Tickets (1 minute)
- [ ] Go back to **SQL Editor**
- [ ] Run this SQL:

```sql
INSERT INTO tickets (code_6_digit, email, name, ticket_type) VALUES
('123456', 'test1@example.com', 'Test User 1', 'DAY1'),
('234567', 'test2@example.com', 'Test User 2', 'DAY2'),
('345678', 'test3@example.com', 'Test User 3', 'COMBO');
```

## ☐ 7. Test the App (2 minutes)
- [ ] Stop dev server (Ctrl+C)
- [ ] Restart: `npm run dev`
- [ ] Open: http://localhost:5173/
- [ ] Enter password (from your .env file)
- [ ] Try manual code: **123456**
- [ ] Should see GREEN screen (if Day 1) ✅

---

## ✅ You're Done!

The app is now fully functional. Next steps:

### Before the Event:
1. Add real attendee tickets (CSV import recommended)
2. Generate QR codes for each ticket (use the UUID from database)
3. Print tickets with QR code + 6-digit code
4. Test scanning with real QR codes
5. Set correct `VITE_CURRENT_DAY` (1 or 2)

### On Event Day:
1. Deploy app to Vercel/Netlify (for HTTPS and mobile access)
2. Share app URL with volunteers
3. Give them the password
4. Volunteers scan at gate!

---

## 📱 Mobile Testing

To test on your phone while on same WiFi:

1. Find your computer's IP (shown in terminal, e.g., `192.168.1.11:5173`)
2. On phone, open: `http://YOUR-IP:5173`
3. Allow camera access when prompted

---

## 🆘 Common Issues

**Blank page?**
→ Check .env file exists and has correct format
→ Restart dev server

**"Invalid API key"?**
→ Make sure you copied the **anon** key, not service_role
→ No extra spaces in .env

**Tickets not found?**
→ Check SQL migration ran successfully
→ Check test tickets were inserted

**Camera not working?**
→ Only works on HTTPS or localhost
→ Deploy to get HTTPS for mobile testing

---

Need detailed help? See **SUPABASE_SETUP_GUIDE.md**
