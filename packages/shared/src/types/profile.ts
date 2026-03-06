/**
 * User Profile related types for submissions, saved items, and notification preferences
 */

export type ContentType = 'business' | 'event' | 'deal' | 'job' | 'news' | 'review';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'draft';

export interface UserSubmission {
  submission_id: string;
  user_id: string;
  content_type: ContentType;
  content_id: string;
  title: string;
  status: SubmissionStatus;
  submitted_at: string;
  updated_at: string;
  rejection_reason?: string;
}

export interface SavedItem {
  saved_id: string;
  user_id: string;
  item_type: ContentType;
  item_id: string;
  item_title: string;
  item_subtitle?: string;
  item_image_url?: string;
  saved_at: string;
}

export type NotificationChannel = 'email' | 'whatsapp' | 'push' | 'in_app';
export type NotificationFrequency = 'immediate' | 'daily' | 'weekly' | 'never';

export interface NotificationPreference {
  type: string;
  label: string;
  description: string;
  enabled: boolean;
  frequency: NotificationFrequency;
  channels: NotificationChannel[];
}

export interface NotificationPreferences {
  user_id: string;
  preferences: NotificationPreference[];
  updated_at: string;
}

export interface UpdateProfileInput {
  display_name?: string;
  city?: string;
  state?: string;
  preferred_channel?: 'whatsapp' | 'web' | 'both';
  avatar_url?: string;
}
