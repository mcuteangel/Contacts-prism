/**
 * Sync Pull Module - Handle server delta operations
 */

import { nowIso } from "@/database/db";
import { ErrorManager } from "@/lib/error-manager";
import type { ApiResponse } from "@/types/api";

export interface PullResult {
  inserted: number;
  updated: number;
  deleted: number;
  conflicts: number;
  errors: number;
}

export interface PullOptions {
  lastSync?: string;
  batchSize?: number;
}

/**
 * Fetch server delta for synchronization
 */
export async function fetchServerDelta(
  options: PullOptions & { accessToken?: string } = {}
): Promise<ApiResponse<any>> {
  try {
    // Use singleton Supabase client to avoid multiple instances
    const { supabaseClient } = await import('@/integrations/supabase/client');
    const supabase = supabaseClient;
    
    // Set authorization header if access token is provided
    const headers: Record<string, string> = {};
    if (options.accessToken) {
      headers['Authorization'] = `Bearer ${options.accessToken}`;
    }
    
    const response = await supabase.functions.invoke('sync-delta', {
        body: {
            clientTime: nowIso(),
            lastSync: options.lastSync || '1970-01-01T00:00:00Z'
        },
        headers
    });
    
    if (response.error) {
        throw new Error(`Failed to fetch server delta: ${response.error.message}`);
    }
    
    return {
      ok: true,
      data: response.data
    };

  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error('Unknown pull error');
    ErrorManager.logError(errorInstance, {
      component: 'SyncPull',
      action: 'fetchServerDelta'
    });
    
    return {
      ok: false,
      error: errorInstance.message
    };
  }
}

/**
 * Process server delta and update local database
 */
export async function processDelta(
  lastSyncAt: string | null,
  options: { baseUrl?: string; accessToken?: string } = {}
): Promise<{
  inserted: number;
  updated: number;
  deleted: number;
  conflicts: number;
  errors: number;
  contactsUpserts: number;
  contactsDeletes: number;
  groupsUpserts: number;
  groupsDeletes: number;
  serverTime: string;
}> {
  let inserted = 0;
  let updated = 0;
  let deleted = 0;
  let conflicts = 0;
  let errors = 0;
  let contactsUpserts = 0;
  let contactsDeletes = 0;
  let groupsUpserts = 0;
  let groupsDeletes = 0;

  try {
    console.log('Fetching server delta since:', lastSyncAt);
    
    // Fetch delta from server
    const deltaResult = await fetchServerDelta({ lastSync: lastSyncAt });
    
    if (!deltaResult.ok) {
      throw new Error(`Failed to fetch delta: ${deltaResult.error}`);
    }
    
    const delta = deltaResult.data;
    console.log('Processing delta:', JSON.stringify(delta, null, 2));
    
    const serverTime = delta.serverTime || new Date().toISOString();
    
    // Import database and contact service
    const { db } = await import('@/database/db');
    const { toUI } = await import('@/services/contact-service');
    
    // Process contacts
    if (delta.contacts && Array.isArray(delta.contacts)) {
      for (const contact of delta.contacts) {
        try {
          console.log('Processing contact:', contact.id);
          
          // Check if contact exists locally
          const existingContact = await db.contacts.get(contact.id);
          
          if (existingContact) {
            // Update existing contact
            await db.contacts.update(contact.id, {
              first_name: contact.first_name,
              last_name: contact.last_name,
              gender: contact.gender,
              company: contact.company,
              address: contact.address,
              notes: contact.notes,
              updated_at: contact.updated_at,
              _version: (existingContact._version || 0) + 1
            });
            updated++;
            contactsUpserts++;
          } else {
            // Insert new contact
            await db.contacts.add({
              id: contact.id,
              user_id: contact.user_id,
              first_name: contact.first_name,
              last_name: contact.last_name,
              gender: contact.gender || 'not_specified',
              role: null,
              company: contact.company,
              address: contact.address,
              notes: contact.notes,
              created_at: contact.created_at,
              updated_at: contact.updated_at,
              phoneNumbers: [],
              position: null,
              groupId: null,
              _version: 1
            });
            inserted++;
            contactsUpserts++;
          }
          
        } catch (error) {
          errors++;
          console.error('Error processing contact:', error);
        }
      }
    }
    
    // Process groups
    if (delta.groups && Array.isArray(delta.groups)) {
      for (const group of delta.groups) {
        try {
          console.log('Processing group:', group.id);
          
          // Check if group exists locally
          const existingGroup = await db.groups.get(group.id);
          
          if (existingGroup) {
            // Update existing group
            await db.groups.update(group.id, {
              name: group.name,
              color: group.color,
              updated_at: group.updated_at || group.created_at,
              version: (existingGroup.version || 0) + 1
            });
            updated++;
            groupsUpserts++;
          } else {
            // Insert new group
            await db.groups.add({
              id: group.id,
              user_id: group.user_id,
              name: group.name,
              color: group.color,
              created_at: group.created_at,
              updated_at: group.updated_at || group.created_at,
              deleted_at: null,
              version: 1
            });
            inserted++;
            groupsUpserts++;
          }
          
        } catch (error) {
          errors++;
          console.error('Error processing group:', error);
        }
      }
    }

    console.log(`Delta processing completed: inserted=${inserted}, updated=${updated}, deleted=${deleted}, conflicts=${conflicts}, errors=${errors}`);
    
    return {
      inserted,
      updated,
      deleted,
      conflicts,
      errors,
      contactsUpserts,
      contactsDeletes,
      groupsUpserts,
      groupsDeletes,
      serverTime
    };
    
  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error('Unknown delta processing error');
    ErrorManager.logError(errorInstance, {
      component: 'SyncPull',
      action: 'processDelta'
    });
    
    throw error;
  }
}