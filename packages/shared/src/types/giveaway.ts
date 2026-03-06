/**
 * Viral Giveaway Campaign types
 * Week 10: "Win free meals at local Indian restaurants"
 * KingSumo-style entry with referral tracking and winner selection
 */

export type GiveawayStatus = 'draft' | 'active' | 'paused' | 'ended' | 'cancelled';

export type EntryMethod =
  | 'email_signup'
  | 'social_share'
  | 'referral'
  | 'newsletter_subscribe'
  | 'whatsapp_subscribe'
  | 'visit_business'
  | 'leave_review'
  | 'submit_event'
  | 'daily_visit';

export interface GiveawayCampaign {
  campaign_id: string;
  title: string;
  description: string;
  short_description: string;
  prize_description: string;
  prize_value: string;
  prize_image_url?: string;
  sponsor_name: string;
  sponsor_logo_url?: string;
  sponsor_website?: string;
  status: GiveawayStatus;
  start_date: string;
  end_date: string;
  city?: string;
  state?: string;
  rules_url?: string;
  terms_text?: string;
  max_entries_per_user: number;
  entry_methods: EntryMethodConfig[];
  total_entries: number;
  total_participants: number;
  winner_count: number;
  winners?: GiveawayWinner[];
  share_url: string;
  og_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface EntryMethodConfig {
  method: EntryMethod;
  label: string;
  description: string;
  points: number;
  max_entries: number;
  is_required: boolean;
  action_url?: string;
  verification_type?: 'automatic' | 'manual' | 'none';
}

export interface GiveawayEntry {
  entry_id: string;
  campaign_id: string;
  participant_id: string;
  entry_method: EntryMethod;
  points_earned: number;
  referral_code?: string;
  referred_by?: string;
  metadata?: Record<string, string>;
  is_verified: boolean;
  created_at: string;
}

export interface GiveawayParticipant {
  participant_id: string;
  campaign_id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  total_entries: number;
  total_points: number;
  referral_code: string;
  referral_count: number;
  referral_entries: number;
  entries: GiveawayEntry[];
  joined_at: string;
}

export interface GiveawayWinner {
  winner_id: string;
  campaign_id: string;
  participant_id: string;
  participant_name: string;
  participant_email: string;
  prize_description: string;
  total_entries: number;
  selected_at: string;
  notified: boolean;
  claimed: boolean;
  claimed_at?: string;
}

export interface GiveawayReferral {
  referral_code: string;
  referrer_id: string;
  referrer_name: string;
  campaign_id: string;
  total_referrals: number;
  share_url: string;
}

export interface CreateGiveawayInput {
  title: string;
  description: string;
  short_description: string;
  prize_description: string;
  prize_value: string;
  prize_image_url?: string;
  sponsor_name: string;
  sponsor_logo_url?: string;
  sponsor_website?: string;
  start_date: string;
  end_date: string;
  city?: string;
  state?: string;
  rules_url?: string;
  terms_text?: string;
  max_entries_per_user?: number;
  entry_methods: EntryMethodConfig[];
  winner_count?: number;
}

export interface GiveawayEntryInput {
  campaign_id: string;
  entry_method: EntryMethod;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  referral_code?: string;
  metadata?: Record<string, string>;
}

export interface GiveawayStats {
  campaign_id: string;
  total_entries: number;
  total_participants: number;
  entries_today: number;
  participants_today: number;
  referral_entries: number;
  top_referrers: Array<{
    participant_id: string;
    name: string;
    referral_count: number;
  }>;
  entry_method_breakdown: Array<{
    method: EntryMethod;
    count: number;
    percentage: number;
  }>;
  daily_entries: Array<{
    date: string;
    entries: number;
    participants: number;
  }>;
  city_breakdown: Array<{
    city: string;
    state: string;
    participants: number;
  }>;
}

export interface GiveawaySearchParams {
  status?: GiveawayStatus;
  city?: string;
  state?: string;
  page?: number;
  limit?: number;
}
