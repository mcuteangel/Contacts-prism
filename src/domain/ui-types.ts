// Centralized UI DTOs for Contacts/Groups and related sub-entities
// These types are used across services and UI to avoid per-file redefinitions.

export type PhoneNumberUI = {
  id?: string | number;
  type: string;
  number: string;
};

export type EmailAddressUI = {
  id?: string | number;
  type: string;
  address: string;
};

export type CustomFieldUI = {
  id?: string | number;
  name: string;
  value: string;
  type?: string; // optional for compatibility
};

export type GroupUI = {
  id?: string | number;
  userId?: string;
  name: string;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  version?: number;
  // Compatibility: some UIs may show count
  membersCount?: number;
};

export type ContactUI = {
  // identifiers
  id?: string | number;
  userId?: string;

  // name
  firstName: string;
  lastName: string;

  // optional display fields
  gender?: "male" | "female" | "other" | "not_specified";
  position?: string;
  company?: string | null;
  address?: string | null;
  notes?: string | null;

  // grouping
  groupId?: string | number | null;

  // timestamps and state
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  version?: number;
  conflict?: boolean;

  // relations
  phoneNumbers?: PhoneNumberUI[];
  emails?: EmailAddressUI[];
  customFields?: CustomFieldUI[];
  tags?: string[];
};