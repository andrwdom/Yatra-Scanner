# Troubleshooting Search Feature

## Issue: Search returns "No tickets found"

### Step 1: Verify the Function Exists

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor**
3. Run this query:

```sql
-- Check if search_tickets function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'search_tickets';
```

**Expected result:** Should show 1 row with `search_tickets` and `FUNCTION`

**If nothing shows up:** The function wasn't created. Run the full migration again:
- Copy all of `supabase/migrations/001_tickets_table.sql`
- Paste into SQL Editor
- Click "Run"

---

### Step 2: Test the Function Directly

Run this in **SQL Editor**:

```sql
-- Test search function with 'alice'
SELECT * FROM search_tickets('alice');
```

**Expected result:** Should return 1 row with Alice Kumar's ticket

**If it returns empty:**
- The function works but data doesn't match
- Check if test tickets were inserted

---

### Step 3: Verify Test Data Exists

```sql
-- Check if Alice's ticket exists
SELECT * FROM tickets WHERE name ILIKE '%alice%';
```

**Expected result:** Should show Alice Kumar's ticket

**If nothing shows:**
- Test data wasn't inserted
- Run the INSERT statement again (see below)

---

### Step 4: Re-insert Test Data

```sql
-- Delete old test data (if any)
DELETE FROM tickets WHERE email LIKE '%@test.com' OR email LIKE '%@example.com';

-- Insert fresh test data
INSERT INTO tickets (code_6_digit, email, name, ticket_type) VALUES
('123456', 'alice@test.com', 'Alice Kumar', 'DAY1'),
('234567', 'bob@test.com', 'Bob Sharma', 'DAY2'),
('345678', 'charlie@test.com', 'Charlie Patel', 'COMBO');
```

---

### Step 5: Test Function Permissions

The function might not have proper permissions. Run this:

```sql
-- Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION search_tickets(VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION get_ticket_by_code(VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION verify_and_mark_ticket(UUID, INTEGER) TO anon;
```

---

### Step 6: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try searching again for "alice"
4. Look for any red error messages

**Common errors:**
- `permission denied for function search_tickets` → Run Step 5
- `function search_tickets does not exist` → Run Step 1
- Network error → Check Supabase URL in .env

---

## Quick Fix (Most Common Issue)

**Most likely cause:** The SQL migration didn't run completely or functions weren't created.

**Quick solution:**

1. Go to Supabase **SQL Editor**
2. Run this complete script:

```sql
-- ============================================
-- COMPLETE SETUP - Run this if search doesn't work
-- ============================================

-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_6_digit VARCHAR(6) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    ticket_type VARCHAR(10) NOT NULL CHECK (ticket_type IN ('DAY1', 'DAY2', 'COMBO')),
    day1_used BOOLEAN DEFAULT FALSE,
    day2_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create search function
CREATE OR REPLACE FUNCTION search_tickets(p_query VARCHAR(255))
RETURNS TABLE (
    id UUID,
    code_6_digit VARCHAR(6),
    email VARCHAR(255),
    name VARCHAR(255),
    ticket_type VARCHAR(10),
    day1_used BOOLEAN,
    day2_used BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.code_6_digit, t.email, t.name, t.ticket_type, t.day1_used, t.day2_used
    FROM tickets t
    WHERE t.code_6_digit = p_query
       OR t.email ILIKE '%' || p_query || '%'
       OR t.name ILIKE '%' || p_query || '%'
    LIMIT 20;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION search_tickets(VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION search_tickets(VARCHAR) TO authenticated;

-- 4. Insert test data
INSERT INTO tickets (code_6_digit, email, name, ticket_type) VALUES
('123456', 'alice@test.com', 'Alice Kumar', 'DAY1'),
('234567', 'bob@test.com', 'Bob Sharma', 'DAY2'),
('345678', 'charlie@test.com', 'Charlie Patel', 'COMBO')
ON CONFLICT (code_6_digit) DO NOTHING;

-- 5. Test search
SELECT * FROM search_tickets('alice');
```

3. You should see Alice Kumar's ticket in the results at the bottom
4. Go back to your app and try searching again

---

## Still Not Working?

### Check RLS (Row Level Security)

If RLS is enabled, it might be blocking the search function.

**Option 1: Disable RLS (Quick Fix)**
```sql
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
```

**Option 2: Add Proper RLS Policy**
```sql
-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Allow anon role to read all tickets
CREATE POLICY "Allow search access" ON tickets
FOR SELECT
TO anon
USING (true);
```

---

## After Fixing

Once search works, test with these queries in your app:
- `alice` → Should find Alice Kumar
- `bob` → Should find Bob Sharma
- `123456` → Should find ticket by code
- `@test.com` → Should find all 3 test tickets
- `kumar` → Should find Alice Kumar

---

## Prevention for Production

Before your event:
1. ✅ Verify all 3 functions exist (`search_tickets`, `get_ticket_by_code`, `verify_and_mark_ticket`)
2. ✅ Grant proper permissions to `anon` role
3. ✅ Test search with real data
4. ✅ Configure RLS properly
5. ✅ Test on mobile device before event day
