/**
 * Authentication types for Desi Connect USA
 * Supports: Google OAuth, Email Magic Link, Phone OTP
 * Identity linking between WhatsApp (phone) and Website (email)
 */

export type AuthProvider = 'google' | 'email_magic_link' | 'phone_otp' | 'whatsapp' | 'none';
export type PreferredChannel = 'whatsapp' | 'web' | 'both';
export type CreatedVia = 'whatsapp' | 'website';

export interface UserProfile {
  user_id: string;
  phone_number: string | null;
  email: string | null;
  display_name: string;
  avatar_url?: string;
  identity_linked: boolean;
  preferred_channel: PreferredChannel;
  city?: string;
  state?: string;
  created_via: CreatedVia;
  auth_provider: AuthProvider;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  session_id: string;
  user_id: string;
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  created_at: string;
}

export interface GoogleOAuthPayload {
  google_id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface MagicLinkPayload {
  email: string;
  token: string;
  expires_at: string;
}

export interface PhoneOtpPayload {
  phone_number: string;
  otp_code: string;
  expires_at: string;
}

export interface IdentityLinkRequest {
  user_id: string;
  phone_number: string;
  otp_code: string;
}

export interface IdentityLinkResult {
  success: boolean;
  message: string;
  user?: UserProfile;
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  session?: AuthSession;
  error?: string;
  is_new_user?: boolean;
}

export interface OtpVerification {
  verification_id: string;
  phone_number: string;
  status: 'pending' | 'verified' | 'expired' | 'failed';
  created_at: string;
  expires_at: string;
}
