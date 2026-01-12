-- ============================================
-- FIX SEARCH FUNCTIONALITY - RLS Policy Fix
-- ============================================
-- This script fixes the search issue by allowing the anon role
-- to SELECT from the tickets table for search functionality
-- ============================================

-- Step 1: Check if RLS is enabled
-- Run this first to see current status:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'tickets';

-- Step 2: Create RLS policy to allow anon role to search tickets
-- This allows unauthenticated users (anon) to search tickets
-- First, drop the policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anon select for search" ON tickets;

-- Now create the policy
CREATE POLICY "Allow anon select for search" ON tickets
  FOR SELECT
  TO anon
  USING (true);

-- Step 3: Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tickets';

-- ============================================
-- Alternative: If you want to disable RLS temporarily for testing
-- (NOT RECOMMENDED FOR PRODUCTION)
-- ============================================
-- ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;

-- ============================================
-- To re-enable RLS after testing:
-- ============================================
-- ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Test the search after running this
-- ============================================
-- Try searching in your app for "anto" or any name that exists in the database
