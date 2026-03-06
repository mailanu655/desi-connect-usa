/**
 * User Identity Model (Section 5.2 of Implementation Plan)
 *
 * Unified identity that supports both WhatsApp (phone-based) and
 * Website (email-based) authentication. The identity_linked field
 * tracks whether a user's phone and email have been merged.
 */

import type { AuthProvider, PreferredChannel, CreatedVia, IdentityLinkRequest, IdentityLinkResult } from './auth';

export interface User {
  /** UUID primary key - internal unique identifier used across all tables */
  user_id: string;

  /** WhatsApp identifier — set on first WhatsApp interaction */
  phone_number: string | null;

  /** Website identifier — set on website registration */
  email: string | null;

  /** User-facing name, collected during onboarding on either channel */
  display_name: string;

  /** True when phone + email belong to the same person (identity linked) */
  identity_linked: boolean;

  /** Used for notification routing decisions */
  preferred_channel: PreferredChannel;

  /** Primary metro area for localized content (e.g., "Dallas-Fort Worth", "Bay Area") */
  city: string | null;

  /** Which channel the user first engaged through */
  created_via: CreatedVia;

  /** OAuth provider for website login */
  auth_provider: AuthProvider;

  /** ISO 8601 timestamp */
  created_at: string;

  /** ISO 8601 timestamp */
  updated_at: string;
}

export interface CreateUserInput {
  phone_number?: string | null;
  email?: string | null;
  display_name: string;
  preferred_channel?: PreferredChannel;
  city?: string | null;
  created_via: CreatedVia;
  auth_provider?: AuthProvider;
}

export interface UpdateUserInput {
  phone_number?: string | null;
  email?: string | null;
  display_name?: string;
  identity_linked?: boolean;
  preferred_channel?: PreferredChannel;
  city?: string | null;
  auth_provider?: AuthProvider;
}

/**
 * Re-export Identity Linking types from auth module for backward compatibility
 */
export type { IdentityLinkRequest, IdentityLinkResult } from './auth';
