/**
 * Supabase Client Configuration
 * 
 * This module initializes the Supabase client for database operations.
 * All ticket verification calls go through this client.
 * 
 * CRITICAL: Uses ONLY environment variables from .env file
 * NO hardcoded database URLs or keys
 */

import { createClient } from '@supabase/supabase-js';

// Read ONLY from environment variables - NO hardcoded values, NO old database references
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY)?.trim();

// DEBUG: Show what we're using (from .env file)
console.log('🔍 Supabase Configuration (from .env file):');
console.log('   VITE_SUPABASE_URL:', supabaseUrl);
console.log('   VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ? 'SET' : 'NOT SET');
console.log('   VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('   Using key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : 'MISSING');

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('   Please check your .env file in the project root');
  console.error('   Required: VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY');
  throw new Error('Missing required Supabase environment variables. Check your .env file.');
}

const finalUrl = supabaseUrl;
const finalKey = supabaseAnonKey;

console.log('✅ Supabase Client Created:');
console.log('   Connecting to:', finalUrl);

// Create client
const client = createClient(
  finalUrl, 
  finalKey, 
  {
    auth: {
      // We're not using Supabase Auth - just the database
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Test connection on initialization
(async () => {
  try {
    console.log('🔍 Testing Supabase connection to:', finalUrl);
    const { data, error } = await client
      .from('tickets')
      .select('id, name, email')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      console.error('   Error message:', error.message);
      console.error('   Error details:', error);
    } else {
      console.log('✅ Connection test successful!');
      console.log('   Sample data:', data);
    }
  } catch (err) {
    console.error('❌ Connection test error:', err);
  }
})();

export const supabase = client;

/**
 * Get default event day from environment (can be overridden in UI)
 * @returns {number} 1 or 2
 */
export function getDefaultDay() {
  const day = parseInt(import.meta.env.VITE_DEFAULT_DAY, 10);
  return day === 2 ? 2 : 1; // Default to Day 1 if not set
}

/**
 * Get gate password from environment
 * @returns {string}
 */
export function getGatePassword() {
  const password = import.meta.env.VITE_GATE_PASSWORD;
  if (!password) {
    console.warn('⚠️ VITE_GATE_PASSWORD not set in .env file. Using default "demo123"');
    return 'demo123'; // Default password for testing
  }
  return password;
}

/**
 * Get admin PIN from environment
 * @returns {string}
 */
export function getAdminPin() {
  const pin = import.meta.env.VITE_ADMIN_PIN;
  if (!pin) {
    console.warn('⚠️ VITE_ADMIN_PIN not set in .env file. Using default "9999"');
    return '9999'; // Default PIN for testing
  }
  return pin;
}
