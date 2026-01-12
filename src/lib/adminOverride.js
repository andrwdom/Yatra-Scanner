/**
 * Admin Override Service
 * 
 * Handles all admin-only operations:
 * - Force allow entry
 * - Reset entry
 * - Override logging
 * 
 * CRITICAL: These functions bypass normal validation
 * Only accessible with valid admin PIN
 */

import { supabase } from './supabase';

/**
 * Admin action to force allow entry for a ticket
 * 
 * @param {string} ticketId - UUID of ticket
 * @param {number} day - Optional day parameter (kept for compatibility, not used)
 * @param {string} reason - Admin's reason for override
 * @param {string} adminIdentifier - Admin name/ID for audit
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function adminForceAllow(ticketId, day, reason, adminIdentifier) {
  try {
    if (!reason || reason.trim().length < 10) {
      return {
        success: false,
        message: 'Reason must be at least 10 characters'
      };
    }

    const { data, error } = await supabase.rpc('admin_force_allow', {
      p_ticket_id: ticketId,
      p_reason: reason.trim(),
      p_admin_identifier: adminIdentifier.trim()
    });

    if (error) {
      console.error('Admin force allow error:', error);
      return {
        success: false,
        message: 'Override failed. Check connection.'
      };
    }

    return data;
  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      success: false,
      message: 'System error during override'
    };
  }
}

/**
 * Admin action to reset entry for a ticket
 * 
 * @param {string} ticketId - UUID of ticket
 * @param {number} day - Optional day parameter (kept for compatibility, not used)
 * @param {string} reason - Admin's reason for reset
 * @param {string} adminIdentifier - Admin name/ID for audit
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function adminResetEntry(ticketId, day, reason, adminIdentifier) {
  try {
    if (!reason || reason.trim().length < 10) {
      return {
        success: false,
        message: 'Reason must be at least 10 characters'
      };
    }

    const { data, error } = await supabase.rpc('admin_reset_entry', {
      p_ticket_id: ticketId,
      p_reason: reason.trim(),
      p_admin_identifier: adminIdentifier.trim()
    });

    if (error) {
      console.error('Admin reset entry error:', error);
      return {
        success: false,
        message: 'Reset failed. Check connection.'
      };
    }

    return data;
  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      success: false,
      message: 'System error during reset'
    };
  }
}

/**
 * Get override logs for a specific ticket
 * 
 * @param {string} ticketId - UUID of ticket
 * @returns {Promise<Array>}
 */
export async function getOverrideLogs(ticketId) {
  try {
    const { data, error } = await supabase.rpc('get_ticket_override_logs', {
      p_ticket_id: ticketId
    });

    if (error) {
      console.error('Get override logs error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error:', err);
    return [];
  }
}
