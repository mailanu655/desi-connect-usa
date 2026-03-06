'use client';

import { useState } from 'react';

interface ReviewFormProps {
  onSubmit: (data: { rating: number; review_text: string; is_fraud_report: boolean }) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export default function ReviewForm({ onSubmit, onCancel, submitting = false }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isFraudReport, setIsFraudReport] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    if (isFraudReport && !reviewText.trim()) {
      newErrors.review_text = 'Please describe the fraud incident';
    }
    if (reviewText.trim().length > 2000) {
      newErrors.review_text = 'Review must be 2000 characters or less';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      rating,
      review_text: reviewText.trim(),
      is_fraud_report: isFraudReport,
    });
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Review form">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>

      {/* Star Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-3xl focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              role="radio"
              aria-checked={rating === star}
            >
              <span className={star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}>
                ★
              </span>
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-600">
              {rating} star{rating !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {errors.rating && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.rating}</p>
        )}
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <label htmlFor="review_text" className="block text-sm font-medium text-gray-700 mb-2">
          Your Review {isFraudReport && <span className="text-red-500">*</span>}
        </label>
        <textarea
          id="review_text"
          name="review_text"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={isFraudReport
            ? 'Please describe the fraud incident in detail...'
            : 'Share your experience (optional)...'}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <div className="flex justify-between mt-1">
          {errors.review_text ? (
            <p className="text-sm text-red-600" role="alert">{errors.review_text}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-400">{reviewText.length}/2000</span>
        </div>
      </div>

      {/* Fraud Report Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFraudReport}
            onChange={(e) => setIsFraudReport(e.target.checked)}
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            name="is_fraud_report"
          />
          <span className="text-gray-700">🚩 Report as fraudulent</span>
        </label>
        {isFraudReport && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 rounded px-3 py-2">
            Fraud reports are reviewed by our moderation team. Please provide specific details about the fraudulent activity.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 text-sm text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}
