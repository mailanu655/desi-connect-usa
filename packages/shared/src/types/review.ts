/**
 * Reviews Model (Section 7.1 - WhatsApp Bot: Consultancy Rating)
 *
 * Community reviews for businesses and consultancies.
 * Reviews can be submitted via both WhatsApp and website.
 */

export type ReviewableType = 'business' | 'consultancy';
export type ReviewStatus = 'published' | 'pending' | 'rejected' | 'flagged';

export interface Review {
  review_id: string;

  /** What type of entity is being reviewed */
  reviewable_type: ReviewableType;

  /** ID of the business or consultancy being reviewed */
  reviewable_id: string;

  /** Name of the reviewed entity (denormalized for display) */
  reviewable_name: string;

  /** Who wrote the review */
  reviewer_id: string;
  reviewer_name: string;

  /** Rating from 1-5 stars */
  rating: number;

  /** Optional review text */
  review_text: string | null;

  status: ReviewStatus;
  submission_source: 'website' | 'whatsapp';

  /** For fraud-related consultancy reviews */
  is_fraud_report: boolean;

  created_at: string;
  updated_at: string;
}

export interface CreateReviewInput {
  reviewable_type: ReviewableType;
  reviewable_id: string;
  reviewable_name: string;
  reviewer_id: string;
  reviewer_name: string;
  rating: number;
  review_text?: string | null;
  submission_source: 'website' | 'whatsapp';
  is_fraud_report?: boolean;
}

export interface ReviewSearchParams {
  reviewable_type?: ReviewableType;
  reviewable_id?: string;
  reviewer_id?: string;
  min_rating?: number;
  max_rating?: number;
  is_fraud_report?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'newest' | 'highest_rating' | 'lowest_rating';
}
