/**
 * RSVP Model
 *
 * Event RSVP tracking for attendee management
 * Links events to user RSVPs with status and attendance info
 */

export type RSVPStatus = 'going' | 'interested' | 'cancelled';

export interface RSVP {
  rsvp_id: string;
  event_id: string;
  user_id: string;
  status: RSVPStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateRsvpInput {
  event_id: string;
  user_id: string;
  status?: RSVPStatus;
}
