/**
 * مجموعه type‌های API برای PRISM Contacts
 * این فایل شامل تمام interface‌ها و type‌های مورد نیاز برای API calls است
 */

// ===== Base API Types =====

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ===== Sync Types =====

export interface SyncPayload {
  contacts?: ContactSyncData[];
  groups?: GroupSyncData[];
  phone_numbers?: PhoneNumberSyncData[];
  email_addresses?: EmailSyncData[];
  custom_fields?: CustomFieldSyncData[];
  contact_groups?: ContactGroupSyncData[];
}

export interface SyncResponse {
  appliedIds: string[];
  conflicts: ConflictData[];
  errors: SyncError[];
}

export interface ConflictData {
  entityId: string;
  entity: string;
  localVersion: number;
  serverVersion: number;
  conflictType: 'version' | 'deleted' | 'modified';
}

export interface SyncError {
  entityId: string;
  entity: string;
  error: string;
  code?: string;
}

// ===== Entity Sync Data Types =====

export interface ContactSyncData {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female' | 'other' | 'not_specified';
  role?: string | null;
  company?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  _deleted_at?: string | null;
  _version: number;
  _conflict?: boolean;
  phoneNumbers?: PhoneNumberSyncData[];
  position?: string | null;
  groupId?: string | null;
}

export interface GroupSyncData {
  id: string;
  user_id: string;
  name: string;
  color?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  version: number;
}

export interface PhoneNumberSyncData {
  id: string;
  user_id: string;
  contact_id: string;
  phone_type: string;
  phone_number: string;
  created_at: string;
}

export interface EmailSyncData {
  id: string;
  user_id: string;
  contact_id: string;
  email_type: string;
  email_address: string;
  created_at: string;
}

export interface CustomFieldSyncData {
  id: string;
  user_id: string;
  contact_id: string;
  field_name: string;
  field_value: string;
  created_at: string;
}

export interface ContactGroupSyncData {
  contact_id: string;
  group_id: string;
  user_id: string;
  assigned_at: string;
}

// ===== Server Pull Types =====

export interface ServerPullResponse {
  contacts: ContactSyncData[];
  groups: GroupSyncData[];
  phone_numbers: PhoneNumberSyncData[];
  email_addresses: EmailSyncData[];
  custom_fields: CustomFieldSyncData[];
  contact_groups: ContactGroupSyncData[];
  lastSyncAt: string;
}

// ===== Outbox Types =====

export interface OutboxItemPayload {
  entityId: string;
  entity: string;
  op: 'insert' | 'update' | 'delete';
  version: number;
  payload: Record<string, any>;
}

// ===== Auth Types =====

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role?: string;
  };
  session: {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
  };
}

// ===== Search Types =====

export interface SearchFilters {
  text?: string;
  group?: string;
  starred?: boolean;
  pinned?: boolean;
  dateFilters?: {
    createdAt?: Date;
    updatedAt?: Date;
  };
  tags?: string[];
}

export interface SearchResponse<T> {
  results: T[];
  total: number;
  query: string;
  filters: SearchFilters;
}

// ===== Export/Import Types =====

export interface ExportData {
  meta: {
    version: string;
    exportedAt: string;
    itemCount: {
      contacts: number;
      groups: number;
      contactGroups: number;
    };
  };
  data: {
    contacts: ContactSyncData[];
    groups: GroupSyncData[];
    contactGroups: ContactGroupSyncData[];
  };
}

export interface ImportResult {
  imported: {
    contacts: number;
    groups: number;
    contactGroups: number;
  };
  skipped: {
    contacts: number;
    groups: number;
    contactGroups: number;
  };
  errors?: string[];
}

// ===== Performance Types =====

export interface PerformanceMetrics {
  loadTime: number;
  searchTime: number;
  syncTime: number;
  renderTime: number;
  memoryUsage?: number;
}

// ===== Type Guards =====

export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return obj && typeof obj === 'object' && typeof obj.ok === 'boolean';
}

export function isApiError(obj: any): obj is ApiError {
  return obj && typeof obj === 'object' && typeof obj.message === 'string';
}

export function isSyncResponse(obj: any): obj is SyncResponse {
  return obj && 
    typeof obj === 'object' && 
    Array.isArray(obj.appliedIds) &&
    Array.isArray(obj.conflicts) &&
    Array.isArray(obj.errors);
}

// ===== Utility Types =====

export type EntityType = 'contacts' | 'groups' | 'phone_numbers' | 'email_addresses' | 'custom_fields' | 'contact_groups';

export type SyncOperation = 'insert' | 'update' | 'delete';

export type SyncStatus = 'queued' | 'sending' | 'error' | 'done';

export interface TypedApiResponse<T> extends ApiResponse<T> {
  data: T;
}

export interface TypedApiError extends ApiResponse<never> {
  ok: false;
  error: string;
}