# Supabase Setup Guide - Complete Walkthrough

## Step 1: Create a Supabase Account & Project

### 1.1 Sign Up for Supabase
1. Go to https://supabase.com
2. Click "Start your project" or "Sign In"
3. Sign up using:
   - GitHub (recommended - fastest)
   - Or email/password

### 1.2 Create a New Project
1. After login, click **"New Project"**
2. Fill in the details:
   - **Name**: `YATRA Event Scanner` (or any name you like)
   - **Database Password**: Create a strong password and **SAVE IT** (you'll need this)
   - **Region**: Choose closest to your location (e.g., Mumbai/Singapore for India)
   - **Pricing Plan**: Select **FREE** (perfect for testing and small events)
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to be provisioned

---

## Step 2: Get Your Environment Variables

### 2.1 Find Your API Credentials
1. Once your project is ready, look at the left sidebar
2. Click on the **⚙️ Settings** icon (at the bottom)
3. Click **"API"** in the settings menu

### 2.2 Copy Your Credentials
You'll see two important values:

**1. Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```
- This is your `VITE_SUPABASE_URL`
- Copy the entire URL

**2. Project API keys:**
Look for the table with API keys. You'll see:
- `anon` key (public) ← **This is what you need**
- `service_role` key ← **DO NOT use this in your app**

Copy the **`anon / public`** key (the longer one starting with `eyJ...`)
- This is your `VITE_SUPABASE_ANON_KEY`

### 2.3 Create Your .env File
Now create a file called `.env` in your project root:

**Location:** `D:\Productivity\YATRA SCANNER\.env`

**Contents:**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here

# Volunteer Access Password (choose a secure password)
VITE_GATE_PASSWORD=MySecurePassword2024

# Current Event Day (1 or 2)
VITE_CURRENT_DAY=1
```

**Important:** Replace the placeholder values with your actual credentials!

---

## Step 3: Set Up the Database

### 3.1 Open the SQL Editor
1. In your Supabase dashboard (left sidebar)
2. Click **"SQL Editor"** (icon looks like `</>`
3. You'll see a blank SQL editor

### 3.2 Run the Migration Script
1. Open the file: `D:\Productivity\YATRA SCANNER\supabase\migrations\001_tickets_table.sql`
2. **Copy the ENTIRE contents** of that file
3. **Paste it** into the Supabase SQL Editor
4. Click **"Run"** button (bottom right of the editor)
5. You should see: ✅ **"Success. No rows returned"**

This creates:
- ✅ `tickets` table with proper schema
- ✅ `verify_and_mark_ticket()` function (atomic verification)
- ✅ `get_ticket_by_code()` function (lookup by 6-digit code)
- ✅ `search_tickets()` function (search by email/code)

### 3.3 Verify the Table Was Created
1. Click **"Table Editor"** in the left sidebar
2. You should see a table called **`tickets`**
3. Click on it - you'll see the columns:
   - `id` (uuid)
   - `code_6_digit` (varchar)
   - `email` (varchar)
   - `name` (varchar)
   - `ticket_type` (varchar)
   - `day1_used` (boolean)
   - `day2_used` (boolean)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

---

## Step 4: Add Test Tickets (Optional but Recommended)

### 4.1 Create Sample Tickets for Testing
1. Go back to **SQL Editor**
2. Run this SQL to create 3 test tickets:

```sql
INSERT INTO tickets (code_6_digit, email, name, ticket_type) VALUES
('123456', 'alice@example.com', 'Alice Kumar', 'DAY1'),
('234567', 'bob@example.com', 'Bob Sharma', 'DAY2'),
('345678', 'charlie@example.com', 'Charlie Patel', 'COMBO');
```

3. Click **"Run"**
4. You should see: ✅ **"Success. 3 rows affected"**

### 4.2 View Your Test Data
1. Go to **Table Editor** → **tickets**
2. You should see your 3 test tickets

Now you can test the scanner with these codes:
- **123456** - DAY1 ticket
- **234567** - DAY2 ticket  
- **345678** - COMBO ticket

---

## Step 5: Configure Row Level Security (RLS)

**Important for Production:** By default, Supabase enables Row Level Security (RLS). For this scanner app, we need to allow operations.

### Option A: Disable RLS (Quick - Good for Testing)
1. Go to **Table Editor** → **tickets**
2. Click the **shield icon** next to the table name
3. Toggle **"Enable RLS"** to **OFF**
4. Click **"Save"**

### Option B: Create RLS Policies (Recommended for Production)
If you want to keep RLS enabled (more secure), run this SQL:

```sql
-- Allow all operations with the anon key
CREATE POLICY "Allow all operations" ON tickets
FOR ALL
TO anon
USING (true)
WITH CHECK (true);
```

---

## Step 6: Test Your Setup

### 6.1 Restart Your Dev Server
1. Stop the current server (Ctrl+C in terminal)
2. Run: `npm run dev`
3. Open browser: http://localhost:5173/

### 6.2 Test Login
- Password: Whatever you set in `VITE_GATE_PASSWORD` (e.g., `MySecurePassword2024`)
- Click **"Enter"**

### 6.3 Test QR/Manual Entry
1. Click the **"⌨️ Manual"** tab
2. Enter one of the test codes: `123456`
3. You should see:
   - GREEN screen if Day 1 (and `VITE_CURRENT_DAY=1`)
   - Or RED screen with "Wrong Day" if Day 2

### 6.4 Test Search
1. Click **"🔍 Search"** tab
2. Search for: `alice@example.com` or `123456`
3. You should see the ticket details

---

## Step 7: Production Ticket Generation

### How to Add Real Tickets

**Option 1: Manual Entry (Small Event)**
1. Go to Supabase **Table Editor** → **tickets**
2. Click **"Insert"** → **"Insert row"**
3. Fill in:
   - `code_6_digit`: 6-digit code (e.g., 987654)
   - `email`: attendee email
   - `name`: attendee name
   - `ticket_type`: DAY1, DAY2, or COMBO

**Option 2: CSV Import (Recommended for Bulk)**
1. Prepare a CSV file with columns:
   ```
   code_6_digit,email,name,ticket_type
   111111,user1@college.edu,John Doe,DAY1
   222222,user2@college.edu,Jane Smith,COMBO
   ```
2. In Table Editor, click **"..."** → **"Import data from CSV"**
3. Upload your CSV

**Option 3: Generate via Script**
Create a Node.js script to auto-generate tickets with QR codes. (I can help with this if needed!)

### Generate QR Codes
For each ticket, generate a QR code containing just the **UUID** (not the 6-digit code):

**QR Code Content Format:**
```
abc12345-6789-0abc-def0-123456789abc
```
(Just the UUID from the `id` column)

**Tools to generate QR codes:**
- Online: https://www.qr-code-generator.com/
- Bulk: Use Python with `qrcode` library
- Node.js: Use `qrcode` npm package

Print these QR codes on the physical tickets along with:
- The 6-digit code (as fallback)
- Attendee name
- Ticket type

---

## Summary: Quick Reference

### Your .env file should look like:
```env
VITE_SUPABASE_URL=https://abcdefg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-long-key
VITE_GATE_PASSWORD=YourVolunteerPassword123
VITE_CURRENT_DAY=1
```

### On Event Day:
1. **Day 1:** Set `VITE_CURRENT_DAY=1`, restart server
2. **Day 2:** Set `VITE_CURRENT_DAY=2`, restart server
3. Give volunteers the password from `VITE_GATE_PASSWORD`
4. Volunteers scan tickets using the app

---

## Troubleshooting

### "Invalid API key" error
- Check that you copied the **anon/public** key, NOT the service_role key
- Make sure there are no extra spaces in the .env file

### "Relation 'tickets' does not exist"
- The SQL migration didn't run successfully
- Go back to SQL Editor and run the migration script again

### Cannot insert/update tickets
- Row Level Security (RLS) is blocking you
- Disable RLS or create the policy (see Step 5)

### Tickets not verifying
- Check that `VITE_CURRENT_DAY` matches the ticket type
- DAY1 tickets only work on Day 1
- DAY2 tickets only work on Day 2
- COMBO tickets work on both days (once per day)

---

## Need Help?

If you run into issues:
1. Check the browser console (F12) for errors
2. Check Supabase logs: Dashboard → Logs
3. Verify your .env file has correct values
4. Make sure dev server was restarted after creating/editing .env

Good luck with your event! 🎉
