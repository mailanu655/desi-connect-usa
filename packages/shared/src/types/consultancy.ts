/**
 * Consultancy Model (Section 6.1)
 *
 * Verified listings of desi consultancies with community ratings
 * and fraud alerts. P1 priority, MVP feature.
 */

export type ConsultancyStatus = 'active' | 'pending' | 'suspended' | 'flagged_fraud';
export type ConsultancySpecialization =
  | 'it_staffing'
  | 'h1b_sponsor'
  | 'opt_cpt'
  | 'gc_processing'
  | 'immigration_legal'
  | 'tax_accounting'
  | 'general';

export interface Consultancy {
  consultancy_id: string;
  name: string;
  description: string;
  specializations: ConsultancySpecialization[];
  website_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string;
  state: string;

  average_rating: number;
  review_count: number;

  /** Community-verified flag — has gone through verification process */
  is_verified: boolean;

  /** Fraud alert flag — if community reports reach threshold */
  fraud_alert: boolean;
  fraud_alert_reason: string | null;

  status: ConsultancyStatus;
  submitted_by: string | null;
  submission_source: 'website' | 'whatsapp' | 'admin' | 'seed';
  created_at: string;
  updated_at: string;
}

export interface CreateConsultancyInput {
  name: string;
  description?: string;
  specializations?: ConsultancySpecialization[];
  website_url?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city: string;
  state: string;
  submitted_by?: string | null;
  submission_source: 'website' | 'whatsapp' | 'admin' | 'seed';
}

export interface ConsultancySearchParams {
  query?: string;
  city?: string;
  state?: string;
  specialization?: ConsultancySpecialization;
  verified_only?: boolean;
  min_rating?: number;
  page?: number;
  limit?: number;
  sort_by?: 'rating' | 'name' | 'newest' | 'review_count';
}
