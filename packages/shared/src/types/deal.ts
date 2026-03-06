/**
 * Deals & Coupons Model (Section 6.1)
 *
 * Business-submitted deals with expiry dates, QR code coupons,
 * location-based filtering. P1 priority, MVP feature.
 */

export type DealStatus = 'active' | 'expired' | 'pending' | 'rejected';
export type DealType = 'percentage_off' | 'fixed_amount' | 'bogo' | 'free_item' | 'other';

export interface Deal {
  deal_id: string;

  /** Link to the business offering the deal */
  business_id: string;
  business_name: string;

  title: string;
  description: string;
  deal_type: DealType;

  /** e.g., "20" for 20% off */
  discount_value: string | null;
  coupon_code: string | null;
  terms: string | null;
  image_url: string | null;

  city: string;
  state: string;

  status: DealStatus;
  submitted_by: string | null;
  submission_source: 'website' | 'whatsapp' | 'admin' | 'seed';

  starts_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDealInput {
  business_id: string;
  business_name: string;
  title: string;
  description: string;
  deal_type: DealType;
  discount_value?: string | null;
  coupon_code?: string | null;
  terms?: string | null;
  image_url?: string | null;
  city: string;
  state: string;
  submitted_by?: string | null;
  submission_source: 'website' | 'whatsapp' | 'admin' | 'seed';
  starts_at?: string;
  expires_at: string;
}

export interface DealSearchParams {
  query?: string;
  city?: string;
  state?: string;
  deal_type?: DealType;
  active_only?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'newest' | 'expiring_soon' | 'popular';
}
