/**
 * Ticket Verification Logic
 * 
 * This module handles all ticket verification operations.
 * 
 * CRITICAL: The actual atomic verification happens in the Postgres function
 * `verify_and_mark_ticket`. This ensures that even if two volunteers scan
 * the same ticket at the exact same moment, only ONE will succeed.
 * 
 * The row-level lock (FOR UPDATE) in the SQL function prevents race conditions.
 */

import { supabase } from './supabase';

/**
 * Result codes for ticket verification
 */
export const VerificationResult = {
  VALID: 'VALID',           // Entry allowed
  ALREADY_USED: 'ALREADY_USED', // Ticket already scanned
  WRONG_DAY: 'WRONG_DAY',   // Ticket not valid for current day
  INVALID_TICKET: 'INVALID_TICKET', // Ticket not found
  ERROR: 'ERROR',           // System error
};

/**
 * Verify a ticket by UUID (from QR code)
 * 
 * CRITICAL: Accepts explicit day parameter (not auto-detected)
 * 
 * @param {string} ticketId - UUID from QR code
 * @param {number} currentDay - Explicitly selected day (1 or 2)
 * @returns {Promise<{
 *   allowed: boolean,
 *   reason: string,
 *   message: string,
 *   ticketType?: string,
 *   name?: string
 * }>}
 */
export async function verifyTicketById(ticketId, currentDay) {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ticketId)) {
      return {
        allowed: false,
        reason: VerificationResult.INVALID_TICKET,
        message: 'Invalid QR code format',
      };
    }

    // Validate day parameter
    if (currentDay !== 1 && currentDay !== 2) {
      return {
        allowed: false,
        reason: VerificationResult.ERROR,
        message: 'Invalid day selection',
      };
    }

    // Call the atomic verification function
    // This is where the magic happens - the Postgres function handles locking
    const { data, error } = await supabase.rpc('verify_and_mark_ticket', {
      p_ticket_id: ticketId,
      p_current_day: currentDay,
    });

    if (error) {
      console.error('Verification error:', error);
      return {
        allowed: false,
        reason: VerificationResult.ERROR,
        message: 'Verification failed. Please try again.',
      };
    }

    return {
      allowed: data.allowed,
      reason: data.reason,
      message: data.message,
      ticketType: data.ticket_type,
      name: data.name,
    };
  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      allowed: false,
      reason: VerificationResult.ERROR,
      message: 'Connection error. Check your network.',
    };
  }
}

/**
 * Verify a ticket by 6-digit code (manual entry)
 * 
 * CRITICAL: Accepts explicit day parameter (not auto-detected)
 * 
 * @param {string} code - 6-digit code
 * @param {number} currentDay - Explicitly selected day (1 or 2)
 * @returns {Promise<{
 *   allowed: boolean,
 *   reason: string,
 *   message: string,
 *   ticketType?: string,
 *   name?: string
 * }>}
 */
export async function verifyTicketByCode(code, currentDay) {
  try {
    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return {
        allowed: false,
        reason: VerificationResult.INVALID_TICKET,
        message: 'Code must be 6 digits',
      };
    }

    // First, get the ticket ID by code
    const { data: ticketId, error: lookupError } = await supabase.rpc('get_ticket_by_code', {
      p_code: code,
    });

    if (lookupError) {
      console.error('Lookup error:', lookupError);
      return {
        allowed: false,
        reason: VerificationResult.ERROR,
        message: 'Lookup failed. Please try again.',
      };
    }

    if (!ticketId) {
      return {
        allowed: false,
        reason: VerificationResult.INVALID_TICKET,
        message: 'Invalid code - ticket not found',
      };
    }

    // Now verify using the ticket ID with explicit day
    return verifyTicketById(ticketId, currentDay);
  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      allowed: false,
      reason: VerificationResult.ERROR,
      message: 'Connection error. Check your network.',
    };
  }
}

/**
 * Search tickets by email or code (for fallback verification)
 * 
 * @param {string} query - Search query (email or code)
 * @returns {Promise<Array<{
 *   id: string,
 *   code_6_digit: string,
 *   email: string,
 *   name: string,
 *   ticket_type: string,
 *   day1_used: boolean,
 *   day2_used: boolean
 * }>>}
 */
export async function searchTickets(query) {
  try {
    if (!query || query.length < 3) {
      return [];
    }

    const { data, error } = await supabase.rpc('search_tickets', {
      p_query: query.trim(),
    });

    if (error) {
      console.error('Search error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error:', err);
    return [];
  }
}

/**
 * Get ticket status without marking as used (for display only)
 * 
 * @param {string} ticketId - UUID of ticket
 * @returns {Promise<{
 *   found: boolean,
 *   ticket?: object
 * }>}
 */
export async function getTicketStatus(ticketId) {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error || !data) {
      return { found: false };
    }

    return { found: true, ticket: data };
  } catch (err) {
    console.error('Status lookup error:', err);
    return { found: false };
  }
}
