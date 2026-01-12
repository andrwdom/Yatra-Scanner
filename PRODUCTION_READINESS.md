# Production Readiness Checklist

## ✅ Frontend Code Status

### Completed
- ✅ Fixed column name mismatch (`code_6_digit` → `six_digit_code`)
- ✅ Updated queries to match actual database schema
- ✅ Removed references to non-existent fields
- ✅ Updated UI components to display correct fields
- ✅ Error handling implemented
- ✅ Input validation in place

### ⚠️ Issues to Address Before Production

#### 1. **CRITICAL: Database Function Missing/Outdated**
   - **Issue**: `verify_and_mark_ticket` function is called but may not exist or may use wrong schema
   - **Current State**: Function expects `ticket_status` field but migrations show `last_used_at`
   - **Action Required**: 
     - Create/update `verify_and_mark_ticket` function in Supabase to work with `ticket_status`
     - Function should:
       - Check if `ticket_status = 'valid'`
       - Set `ticket_status = 'used'` when verified
       - Return JSONB with `allowed`, `reason`, `message`, `name`
   - **Location**: Supabase SQL Editor

#### 2. **Database Functions Required**
   The following RPC functions must exist in your database:
   - ✅ `verify_and_mark_ticket(p_ticket_id UUID)` - **NEEDS TO BE CREATED/UPDATED**
   - ❓ `admin_force_allow(p_ticket_id, p_reason, p_admin_identifier)` - Verify exists
   - ❓ `admin_reset_entry(p_ticket_id, p_reason, p_admin_identifier)` - Verify exists
   - ❓ `get_ticket_override_logs(p_ticket_id)` - Verify exists

#### 3. **Console Logging**
   - **Issue**: Multiple `console.log` statements in production code
   - **Impact**: Performance, security (may expose sensitive data)
   - **Action**: Remove or make conditional based on environment
   - **Files**: `src/lib/ticketVerification.js` (13 console statements)

#### 4. **Row Level Security (RLS)**
   - **Issue**: Need to verify RLS policies allow ticket queries
   - **Action Required**: 
     - Verify `tickets` table has proper RLS policies
     - Ensure `anon` role can SELECT from `tickets` table (for search)
     - Ensure `anon` role can execute `verify_and_mark_ticket` function
   - **Check**: Supabase Dashboard → Authentication → Policies

#### 5. **Database Schema Verification**
   - **Action Required**: Verify your actual database matches BACKEND_DOCUMENTATION.md:
     - `tickets` table has: `id`, `registration_id`, `email`, `name`, `college`, `six_digit_code`, `qr_payload`, `ticket_status`
     - Column `six_digit_code` exists (not `code_6_digit`)
     - Column `ticket_status` exists (not `last_used_at`)

## 🔧 Required Database Setup

### Step 1: Create/Update Verification Function

Run this in Supabase SQL Editor:

```sql
-- Create/Update verify_and_mark_ticket function
-- This works with ticket_status field (not last_used_at)
CREATE OR REPLACE FUNCTION verify_and_mark_ticket(
    p_ticket_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket RECORD;
BEGIN
    -- Lock the row FOR UPDATE to prevent concurrent modifications
    SELECT * INTO v_ticket
    FROM tickets
    WHERE id = p_ticket_id
    FOR UPDATE;

    -- Ticket not found
    IF v_ticket IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'allowed', false,
            'reason', 'INVALID_TICKET',
            'message', 'Ticket not found'
        );
    END IF;

    -- Check ticket status
    IF v_ticket.ticket_status = 'used' THEN
        RETURN jsonb_build_object(
            'success', true,
            'allowed', false,
            'reason', 'ALREADY_USED',
            'message', 'Ticket has already been used',
            'name', v_ticket.name
        );
    END IF;

    IF v_ticket.ticket_status != 'valid' THEN
        RETURN jsonb_build_object(
            'success', true,
            'allowed', false,
            'reason', 'INVALID_TICKET',
            'message', 'Ticket is not valid',
            'name', v_ticket.name
        );
    END IF;

    -- Ticket is valid - mark as used
    UPDATE tickets 
    SET ticket_status = 'used', updated_at = NOW()
    WHERE id = p_ticket_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'allowed', true,
        'reason', 'VALID',
        'message', 'Entry allowed',
        'name', v_ticket.name
    );
END;
$$;

-- Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION verify_and_mark_ticket(UUID) TO anon;
```

### Step 2: Verify RLS Policies

```sql
-- Check if tickets table allows SELECT for anon role
-- This is needed for search functionality

-- If RLS is enabled, you need a policy like:
CREATE POLICY "Allow anon select for search" ON tickets
  FOR SELECT
  TO anon
  USING (true);  -- Or more restrictive based on your needs
```

### Step 3: Test the Function

```sql
-- Test with a valid ticket ID
SELECT verify_and_mark_ticket('your-ticket-uuid-here');
```

## 📋 Pre-Production Checklist

- [ ] Database function `verify_and_mark_ticket` created/updated
- [ ] RLS policies configured for `tickets` table
- [ ] All RPC functions exist and have proper permissions
- [ ] Database schema matches BACKEND_DOCUMENTATION.md
- [ ] Console.log statements removed or made conditional
- [ ] Environment variables configured (.env file)
- [ ] Test ticket verification flow end-to-end
- [ ] Test search functionality
- [ ] Test admin override functions
- [ ] Verify error handling works correctly
- [ ] Test with actual ticket data

## 🚨 Critical Before Launch

1. **Database Function**: The `verify_and_mark_ticket` function MUST be created/updated
2. **RLS Policies**: Must allow necessary queries
3. **Testing**: Test with real ticket data before production
4. **Console Logs**: Remove or conditionally disable for production

## 📝 Notes

- The frontend code is ready and matches the documented schema
- The main blocker is ensuring the database functions exist and match the expected interface
- All queries now use direct table access (no RPC dependency for search)
- Error handling is comprehensive

## 🎯 Next Steps

1. Run the SQL function creation script above
2. Verify RLS policies
3. Test with sample tickets
4. Remove console.log statements (or make them conditional)
5. Deploy to production
