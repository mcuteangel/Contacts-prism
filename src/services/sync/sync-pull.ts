/**
 * Sync Pull Module - Handle server delta synchronization
 */

import { db, nowIso } from "@/database/db";
import { ErrorManager } from "@/lib/error-manager";
import type { ApiResponse, ContactSyncData, GroupSyncData } from "@/types/api";

export interface PullResult {
  inserted: number;
  updated: number;
  deleted: number;
  serverTime: string;
  groupsUpserts: number;
  groupsDeletes: number;
  contactsUpserts: number;
  contactsDeletes: number;
}

export interface PullOptions {
  baseUrl?: string;
  accessToken?: string;
}

export interface ServerDeltaPayload {
  serverTime: string;
  contacts: ContactSyncData[];
  groups: GroupSyncData[];
}

/**
 * Fetch delta changes from server
 */
export async function fetchServerDelta(
  since: string | null,
  options: PullOptions = {}
): Promise<ApiResponse<ServerDeltaPayload>> {
  try {
    const { baseUrl, accessToken } = options;
    
    if (!baseUrl) {
      return { ok: false, error: "Missing endpoint baseUrl" };
    }



    const url = new URL("/posts", baseUrl); // استفاده از JSONPlaceholder endpoint
    if (since) {
      url.searchParams.set("since", since);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Pull failed: ${response.status} ${response.statusText}`
      };
    }

    const json = await response.json();
    const payload: ServerDeltaPayload = {
      serverTime: json.serverTime,
      contacts: Array.isArray(json.contacts) ? json.contacts : [],
      groups: Array.isArray(json.groups) ? json.groups : [],
    };

    return { ok: true, data: payload };

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
 * Check if remote timestamp is newer than local
 */
function isNewer(localUpdatedAt?: string, remoteUpdatedAt?: string): boolean {
  if (!localUpdatedAt) return true;
  if (!remoteUpdatedAt) return false;
  return Date.parse(remoteUpdatedAt) > Date.parse(localUpdatedAt);
}

/**
 * Apply contacts from server delta
 */
async function applyContactsFromDelta(
  contacts: ContactSyncData[]
): Promise<{ inserted: number; updated: number; deleted: number }> {
  let inserted = 0;
  let updated = 0;
  let deleted = 0;

  for (const contact of contacts) {
    const local = await db.contacts.get(contact.id);

    // Handle deleted contacts
    if (contact._deleted_at) {
      if (local && isNewer(local.updated_at, contact.updated_at)) {
        const next = { 
          ...local, 
          _deleted_at: contact._deleted_at, 
          updated_at: contact.updated_at, 
          _conflict: false 
        };
        await db.contacts.put(next);
        deleted++;
      }
      continue;
    }

    // Handle new contacts
    if (!local) {
      await db.contacts.put({
        id: contact.id,
        user_id: contact.user_id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        gender: (contact.gender as 'male' | 'female' | 'other' | 'not_specified') ?? "not_specified",
        role: null, // role is only for user types, not contacts
        company: contact.company ?? null,
        address: contact.address ?? null,
        notes: contact.notes ?? null,
        created_at: contact.created_at ?? contact.updated_at,
        updated_at: contact.updated_at,
        _deleted_at: null,
        _version: 1,
        _conflict: false,
        phoneNumbers: contact.phoneNumbers ?? [],
        position: contact.position ?? contact.role ?? null,
        groupId: contact.groupId ?? null,
      });
      inserted++;
      continue;
    }

    // Handle updated contacts (LWW - Last Write Wins)
    if (isNewer(local.updated_at, contact.updated_at)) {
      const next = {
        ...local,
        first_name: contact.first_name,
        last_name: contact.last_name,
        gender: (contact.gender as 'male' | 'female' | 'other' | 'not_specified') ?? local.gender,
        role: contact.role ?? local.role,
        company: contact.company ?? local.company,
        address: contact.address ?? local.address,
        notes: contact.notes ?? local.notes,
        updated_at: contact.updated_at,
        _deleted_at: null,
        _conflict: false,
      };
      await db.contacts.put(next);
      updated++;
    }
  }

  return { inserted, updated, deleted };
}

/**
 * Apply groups from server delta
 */
async function applyGroupsFromDelta(
  groups: GroupSyncData[]
): Promise<{ inserted: number; updated: number; deleted: number }> {
  let inserted = 0;
  let updated = 0;
  let deleted = 0;

  for (const group of groups) {
    const local = await db.groups.get(group.id);

    // Handle deleted groups
    if (group.deleted_at) {
      if (local) {
        const deletedAt = group.deleted_at ?? nowIso();
        const next = { 
          ...local, 
          deleted_at: deletedAt, 
          updated_at: group.updated_at ?? deletedAt 
        };
        await db.groups.put(next);
        deleted++;
      }
      continue;
    }

    // Handle new groups
    if (!local) {
      await db.groups.put({
        id: group.id,
        user_id: group.user_id,
        name: group.name,
        color: group.color ?? null,
        created_at: group.created_at ?? group.updated_at,
        updated_at: group.updated_at,
        deleted_at: null,
        version: group.version ?? 1,
      });
      inserted++;
      continue;
    }

    // Handle updated groups (LWW)
    if (isNewer(local.updated_at, group.updated_at)) {
      const next = {
        ...local,
        name: group.name,
        color: group.color ?? null,
        updated_at: group.updated_at,
        deleted_at: null,
        version: group.version ?? local.version ?? 1,
      };
      await db.groups.put(next);
      updated++;
    }
  }

  return { inserted, updated, deleted };
}

/**
 * Process server delta and apply changes locally
 */
export async function processDelta(
  since: string | null,
  options: PullOptions = {}
): Promise<PullResult> {
  try {
    const result = await fetchServerDelta(since, options);
    
    if (!result.ok) {
      // Return empty result on error
      const fallbackTime = since ?? nowIso();
      return {
        inserted: 0,
        updated: 0,
        deleted: 0,
        serverTime: fallbackTime,
        groupsUpserts: 0,
        groupsDeletes: 0,
        contactsUpserts: 0,
        contactsDeletes: 0,
      };
    }

    const { contacts, groups, serverTime } = result.data;

    // Apply changes in a transaction
    const [contactsResult, groupsResult] = await db.transaction(
      "rw", 
      db.contacts, 
      db.groups, 
      async () => {
        const contactsResult = await applyContactsFromDelta(contacts);
        const groupsResult = await applyGroupsFromDelta(groups);
        return [contactsResult, groupsResult];
      }
    );

    return {
      inserted: contactsResult.inserted + groupsResult.inserted,
      updated: contactsResult.updated + groupsResult.updated,
      deleted: contactsResult.deleted + groupsResult.deleted,
      serverTime,
      groupsUpserts: groupsResult.inserted + groupsResult.updated,
      groupsDeletes: groupsResult.deleted,
      contactsUpserts: contactsResult.inserted + contactsResult.updated,
      contactsDeletes: contactsResult.deleted,
    };

  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error('Unknown delta processing error');
    ErrorManager.logError(errorInstance, {
      component: 'SyncPull',
      action: 'processDelta'
    });

    const fallbackTime = since ?? nowIso();
    return {
      inserted: 0,
      updated: 0,
      deleted: 0,
      serverTime: fallbackTime,
      groupsUpserts: 0,
      groupsDeletes: 0,
      contactsUpserts: 0,
      contactsDeletes: 0,
    };
  }
}