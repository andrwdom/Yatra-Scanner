/**
 * Supabase Client Configuration
 * 
 * This module initializes the Supabase client for database operations.
 * All ticket verification calls go through this client.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Missing Supabase environment variables!');
  console.error('Please create a .env file in the root directory.');
  console.error('See env.example or SETUP_INSTRUCTIONS.md for details.');
}

// Use placeholder values if not configured (allows UI to load)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      // We're not using Supabase Auth - just the database
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

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
