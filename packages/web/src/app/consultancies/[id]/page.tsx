export const dynamic = 'force-dynamic';
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, Consultancy, Review, ApiResponse } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import ReviewForm from '@/components/reviews/ReviewForm';

const SPECIALIZATION_LABELS: Record<string, string> = {
  it_staffing: 'IT Staffing',
  h1b_sponsor: 'H-1B Sponsorship',
  opt_cpt: 'OPT/CPT',
  gc_processing: 'Green Card Processing',
  immigration_legal: 'Immigration Legal',
  tax_accounting: 'Tax & Accounting',
  general: 'General',
};

export default function ConsultancyDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, isAuthenticated } = useAuth();

  const [consultancy, setConsultancy] = useState<Consultancy | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewSortBy, setReviewSortBy] = useState('newest');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchConsultancy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getConsultancyById(id);
      setConsultancy(data);
    } catch (err) {
      console.error('Error fetching consultancy:', err);
      setError('Failed to load consultancy details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      const response: ApiResponse<Review[]> = await apiClient.getReviews({
        reviewable_type: 'consultancy',
        reviewable_id: id,
        sort_by: reviewSortBy,
        page: reviewsPage,
        limit: 10,
      });
      setReviews(response.data);
      if (response.pagination) {
        setReviewsTotalPages(response.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  }, [id, reviewSortBy, reviewsPage]);

  useEffect(() => {
    if (id) {
      fetchConsultancy();
      fetchReviews();
    }
  }, [id, fetchConsultancy, fetchReviews]);

  const handleReviewSubmit = async (data: { rating: number; review_text: string; is_fraud_report: boolean }) => {
    if (!consultancy || !user) return;

    try {
      setSubmittingReview(true);
      setReviewError(null);
      await apiClient.submitReview({
        reviewable_type: 'consultancy',
        reviewable_id: consultancy.consultancy_id,
        reviewable_name: consultancy.name,
        rating: data.rating,
        review_text: data.review_text || null,
        is_fraud_report: data.is_fraud_report,
      });
      setReviewSuccess('Your review has been submitted and is pending moderation.');
      setShowReviewForm(false);
      fetchReviews();
    } catch (err) {
      console.error('Error submitting review:', err);
      setReviewError('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= Math.round(rating) ? 'text-yellow-400 text-lg' : 'text-gray-300 text-lg'}>
          ★
        </span>
      ))}
      <span className="ml-1 text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-r-transparent" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-2 text-gray-500">Loading consultancy details...</p>
      </div>
    );
  }

  if (error || !consultancy) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 text-lg">{error || 'Consultancy not found.'}</p>
        <Link href="/consultancies" className="mt-4 text-orange-600 hover:underline inline-block">
          ← Back to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/consultancies" className="hover:text-orange-600">Consultancies</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{consultancy.name}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{consultancy.name}</h1>
            <p className="mt-1 text-gray-500">
              {SPECIALIZATION_LABELS[consultancy.specialization] || consultancy.specialization}
            </p>
          </div>
          <div className="flex gap-2">
            {consultancy.is_verified && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        {consultancy.fraud_alert && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-red-700 font-semibold">⚠ Community Fraud Alert</p>
            {consultancy.fraud_alert_reason && (
              <p className="text-red-600 text-sm mt-1">{consultancy.fraud_alert_reason}</p>
            )}
          </div>
        )}

        {consultancy.description && (
          <p className="mt-4 text-gray-700">{consultancy.description}</p>
        )}

        {/* Rating summary */}
        <div className="mt-4 flex items-center gap-4">
          {renderStars(consultancy.rating || 0)}
          <span className="text-gray-500">
            ({consultancy.review_count || 0} review{(consultancy.review_count || 0) !== 1 ? 's' : ''})
          </span>
        </div>

        {/* Contact info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Location</h3>
            {consultancy.address && <p className="text-gray-700">{consultancy.address}</p>}
            <p className="text-gray-700">{consultancy.city}, {consultancy.state}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Contact</h3>
            {consultancy.phone && (
              <p className="text-gray-700">
                <span className="text-gray-500">Phone:</span> {consultancy.phone}
              </p>
            )}
            {consultancy.email && (
              <p className="text-gray-700">
                <span className="text-gray-500">Email:</span> {consultancy.email}
              </p>
            )}
            {consultancy.website && (
              <p>
                <a
                  href={consultancy.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:underline"
                >
                  Visit Website →
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Community Reviews</h2>
          <div className="flex items-center gap-4">
            <select
              value={reviewSortBy}
              onChange={(e) => { setReviewSortBy(e.target.value); setReviewsPage(1); }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              aria-label="Sort reviews"
            >
              <option value="newest">Newest First</option>
              <option value="highest_rating">Highest Rated</option>
              <option value="lowest_rating">Lowest Rated</option>
            </select>
            {isAuthenticated && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm hover:bg-orange-700"
              >
                Write a Review
              </button>
            )}
          </div>
        </div>

        {!isAuthenticated && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
            <p className="text-gray-600">
              <Link href="/auth/login" className="text-orange-600 hover:underline">Sign in</Link> to leave a review.
            </p>
          </div>
        )}

        {/* Review Success */}
        {reviewSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700">{reviewSuccess}</p>
          </div>
        )}

        {/* Review Error */}
        {reviewError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{reviewError}</p>
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <div className="mb-6 border border-gray-200 rounded-lg p-4">
            <ReviewForm
              onSubmit={handleReviewSubmit}
              onCancel={() => setShowReviewForm(false)}
              submitting={submittingReview}
            />
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.review_id} className="border-b border-gray-100 pb-6 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{review.reviewer_name}</span>
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm text-gray-400">{formatDate(review.created_at)}</span>
                </div>
                {review.is_fraud_report && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                      🚩 Fraud Report
                    </span>
                  </div>
                )}
                {review.review_text && (
                  <p className="text-gray-700">{review.review_text}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reviews Pagination */}
        {reviewsTotalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
              disabled={reviewsPage === 1}
              className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {reviewsPage} of {reviewsTotalPages}
            </span>
            <button
              onClick={() => setReviewsPage((p) => Math.min(reviewsTotalPages, p + 1))}
              disabled={reviewsPage === reviewsTotalPages}
              className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
