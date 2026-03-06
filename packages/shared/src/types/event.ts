/**
 * Events Model (Section 6.1)
 *
 * Community events (Diwali, Holi, temple events, networking)
 * with RSVP and reminders. P1 priority, Phase 2 for full feature.
 * Basic event listing is in MVP.
 */

export type EventCategory =
  | 'cultural'
  | 'religious'
  | 'networking'
  | 'educational'
  | 'food_festival'
  | 'sports'
  | 'charity'
  | 'business'
  | 'other';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'pending';

export interface Event {
  event_id: string;
  title: string;
  description: string;
  category: EventCategory;

  venue_name: string | null;
  address: string | null;
  city: string;
  state: string;
  is_virtual: boolean;
  virtual_url: string | null;

  image_url: string | null;
  organizer_name: string | null;
  organizer_contact: string | null;
  ticket_url: string | null;
  is_free: boolean;
  price: string | null;

  starts_at: string;
  ends_at: string | null;
  rsvp_count: number;

  status: EventStatus;
  submitted_by: string | null;
  submission_source: 'website' | 'whatsapp' | 'admin' | 'seed' | 'tavily';
  created_at: string;
  updated_at: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  category: EventCategory;
  venue_name?: string | null;
  address?: string | null;
  city: string;
  state: string;
  is_virtual?: boolean;
  virtual_url?: string | null;
  image_url?: string | null;
  organizer_name?: string | null;
  organizer_contact?: string | null;
  ticket_url?: string | null;
  is_free?: boolean;
  price?: string | null;
  starts_at: string;
  ends_at?: string | null;
  submitted_by?: string | null;
  submission_source: 'website' | 'whatsapp' | 'admin' | 'seed' | 'tavily';
}

export interface EventSearchParams {
  query?: string;
  category?: EventCategory;
  city?: string;
  state?: string;
  is_virtual?: boolean;
  is_free?: boolean;
  starts_after?: string;
  starts_before?: string;
  page?: number;
  limit?: number;
  sort_by?: 'date' | 'popular' | 'newest';
}
