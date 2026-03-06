/**
 * Business Directory Model (Section 6.1 - Website Features)
 *
 * Searchable listings with categories (restaurants, groceries, temples, salons, etc.),
 * ratings, photos, map view. P0 priority, MVP feature.
 */

export type BusinessCategory =
  | 'restaurant'
  | 'grocery'
  | 'temple'
  | 'salon'
  | 'clothing'
  | 'jewelry'
  | 'medical'
  | 'legal'
  | 'tax_accounting'
  | 'real_estate'
  | 'travel'
  | 'education'
  | 'other';

export type BusinessStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type SubmissionSource = 'website' | 'whatsapp' | 'admin' | 'seed';

export interface Business {
  business_id: string;
  name: string;
  category: BusinessCategory;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  hours: string | null;
  photo_urls: string[];
  latitude: number | null;
  longitude: number | null;
  average_rating: number;
  review_count: number;
  status: BusinessStatus;
  submitted_by: string | null;
  submission_source: SubmissionSource;
  is_verified: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessInput {
  name: string;
  category: BusinessCategory;
  description?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string | null;
  email?: string | null;
  website_url?: string | null;
  hours?: string | null;
  photo_urls?: string[];
  latitude?: number | null;
  longitude?: number | null;
  submitted_by?: string | null;
  submission_source: SubmissionSource;
}

export interface BusinessSearchParams {
  query?: string;
  category?: BusinessCategory;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  radius_miles?: number;
  page?: number;
  limit?: number;
  sort_by?: 'rating' | 'distance' | 'name' | 'newest';
}
