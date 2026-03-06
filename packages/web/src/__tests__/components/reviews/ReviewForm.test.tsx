import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewForm from '@/components/reviews/ReviewForm';

describe('ReviewForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    submitting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // Component Rendering
  // ==========================================

  describe('Rendering', () => {
    it('renders the form with title', () => {
      render(<ReviewForm {...defaultProps} />);
      expect(screen.getByText('Write a Review')).toBeInTheDocument();
    });

    it('renders the form element with correct aria-label', () => {
      render(<ReviewForm {...defaultProps} />);
      expect(screen.getByRole('form', { name: 'Review form' })).toBeInTheDocument();
    });

    it('renders 5 star rating buttons', () => {
      render(<ReviewForm {...defaultProps} />);
      const starButtons = screen.getAllByRole('radio');
      expect(starButtons).toHaveLength(5);
    });

    it('renders star buttons with correct aria-labels', () => {
      render(<ReviewForm {...defaultProps} />);
      expect(screen.getByRole('radio', { name: '1 star' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: '2 stars' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: '3 stars' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: '4 stars' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: '5 stars' })).toBeInTheDocument();
    });

    it('renders the review text textarea', () => {
      render(<ReviewForm {...defaultProps} />);
      expect(screen.getByLabelText(/Your Review/i)).toBeInTheDocument();
    });

    it('renders the fraud report checkbox', () => {
      render(<ReviewForm {...defaultProps} />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByText(/Report as fraudulent/)).toBeInTheDocument();
    });

    it('renders Submit and Cancel buttons', () => {
      render(<ReviewForm {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Submit Review' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('renders character count indicator', () => {
      render(<ReviewForm {...defaultProps} />);
      expect(screen.getByText('0/2000')).toBeInTheDocument();
    });

    it('shows rating label with required asterisk', () => {
      render(<ReviewForm {...defaultProps} />);
      const ratingLabel = screen.getByText('Rating');
      expect(ratingLabel).toBeInTheDocument();
      expect(ratingLabel.parentElement?.querySelector('.text-red-500')).toBeInTheDocument();
    });
  });

  // ==========================================
  // Star Rating Interaction
  // ==========================================

  describe('Star Rating', () => {
    it('allows selecting a star rating', () => {
      render(<ReviewForm {...defaultProps} />);
      const star3 = screen.getByRole('radio', { name: '3 stars' });
      fireEvent.click(star3);
      expect(star3).toHaveAttribute('aria-checked', 'true');
    });

    it('shows selected rating text', () => {
      render(<ReviewForm {...defaultProps} />);
      const star4 = screen.getByRole('radio', { name: '4 stars' });
      fireEvent.click(star4);
      expect(screen.getByText('4 stars')).toBeInTheDocument();
    });

    it('allows changing the rating', () => {
      render(<ReviewForm {...defaultProps} />);
      fireEvent.click(screen.getByRole('radio', { name: '3 stars' }));
      expect(screen.getByText('3 stars')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('radio', { name: '5 stars' }));
      expect(screen.getByText('5 stars')).toBeInTheDocument();
    });

    it('shows singular "star" for rating of 1', () => {
      render(<ReviewForm {...defaultProps} />);
      fireEvent.click(screen.getByRole('radio', { name: '1 star' }));
      expect(screen.getByText('1 star')).toBeInTheDocument();
    });

    it('all stars are initially unselected (aria-checked=false)', () => {
      render(<ReviewForm {...defaultProps} />);
      const stars = screen.getAllByRole('radio');
      stars.forEach((star) => {
        expect(star).toHaveAttribute('aria-checked', 'false');
      });
    });
  });

  // ==========================================
  // Review Text
  // ==========================================

  describe('Review Text', () => {
    it('allows typing review text', () => {
      render(<ReviewForm {...defaultProps} />);
      const textarea = screen.getByLabelText(/Your Review/i) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Great experience!' } });
      expect(textarea.value).toBe('Great experience!');
    });

    it('updates character count as text is typed', () => {
      render(<ReviewForm {...defaultProps} />);
      const textarea = screen.getByLabelText(/Your Review/i);
      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      expect(screen.getByText('11/2000')).toBeInTheDocument();
    });

    it('has maxLength attribute of 2000', () => {
      render(<ReviewForm {...defaultProps} />);
      const textarea = screen.getByLabelText(/Your Review/i);
      expect(textarea).toHaveAttribute('maxLength', '2000');
    });

    it('shows default placeholder text', () => {
      render(<ReviewForm {...defaultProps} />);
      expect(screen.getByPlaceholderText('Share your experience (optional)...')).toBeInTheDocument();
    });

    it('shows fraud-specific placeholder when fraud report is checked', () => {
      render(<ReviewForm {...defaultProps} />);
      fireEvent.click(screen.getByRole('checkbox'));
      expect(screen.getByPlaceholderText('Please describe the fraud incident in detail...')).toBeInTheDocument();
    });
  });

  // ==========================================
  // Fraud Report
  // ==========================================

  describe('Fraud Report', () => {
    it('toggles fraud report checkbox', () => {
      render(<ReviewForm {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('shows fraud warning message when checked', () => {
      render(<ReviewForm {...defaultProps} />);
      fireEvent.click(screen.getByRole('checkbox'));
      expect(screen.getByText(/Fraud reports are reviewed by our moderation team/)).toBeInTheDocument();
    });

    it('hides fraud warning message when unchecked', () => {
      render(<ReviewForm {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(screen.getByText(/Fraud reports are reviewed by our moderation team/)).toBeInTheDocument();
      fireEvent.click(checkbox);
      expect(screen.queryByText(/Fraud reports are reviewed by our moderation team/)).not.toBeInTheDocument();
    });

    it('makes review text required for fraud reports', () => {
      render(<ReviewForm {...defaultProps} />);
      // Check fraud report
      fireEvent.click(screen.getByRole('checkbox'));
      // Select a rating
      fireEvent.click(screen.getByRole('radio', { name: '1 star' }));
      // Submit without text
      fireEvent.submit(screen.getByRole('form', { name: 'Review form' }));
      expect(screen.getByText('Please describe the fraud incident')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // Form Validation
  // ==========================================

  describe('Validation', () => {
    it('shows error when submitting without rating', () => {
      render(<ReviewForm {...defaultProps} />);
      fireEvent.submit(screen.getByRole('form', { name: 'Review form' }));
      expect(screen.getByText('Please select a rating')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('clears rating error after selecting a star', () => {
      render(<ReviewForm {...defaultProps} />);
      fireEvent.submit(screen.getByRole('form', { name: 'Review form' }));
      expect(screen.getByText('Please select a rating')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('radio', { name: '4 stars' }));
      fireEvent.submit(screen.getByRole('form', { name: 'Review form' }));
      expect(screen.queryByText('Please select a rating')).not.toBeInTheDocument();
    });

    it('allows submission with just a rating (no text)', () => {
      render(<ReviewForm {...defaultProps} />);
      fireEvent.click(screen.getByRole('radio', { name: '5 stars' }));
      fireEvent.submit(screen.getByRole('form', { name: 'Review form' }));
      expect(mockOnSubmit).toHaveBeenCalledWith({
        rating: 5,
        review_text: '',
        is_fraud_report: false,
      });
    });

    it('trims review text before submission', () => {
      render(<ReviewForm {...defaultProps} />);
      fireEvent.click(screen.getByRole('radio', { name: '4 stars' }));
      fireEvent.change(screen.getByLabelText(/Your Review/i), {
        target: { value: '  Great service!  ' },
      });
      fireEvent.submit(screen.getByRole('form', { name: 'Review form' }));
      expect(mockOnSubmit).toHaveBeenCalledWith({
        rating: 4,
        review_text: 'Great service!',
        is_fraud_report: false,
      });
    });

    it('submits fraud report with all fields', () => {
      render(<ReviewForm {...defaultProps} />);
      fireEvent.click(screen.getByRole('radio', { name: '1 star' }));
      fireEvent.change(screen.getByLabelText(/Your Review/i), {
        target: { value: 'This company is fraudulent because...' },
      });
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.submit(screen.getByRole('form', { name: 'Review form' }));
      expect(mockOnSubmit).toHaveBeenCalledWith({
        rating: 1,
        review_text: 'This company is fraudulent because...',
        is_fraud_report: true,
      });
    });

    it('error messages have role="alert"', () => {
      render(<ReviewForm {...defaultProps} />);
      fireEvent.submit(screen.getByRole('form', { name: 'Review form' }));
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // Cancel & Submitting State
  // ==========================================

  describe('Actions', () => {
    it('calls onCancel when Cancel button is clicked', () => {
      render(<ReviewForm {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('shows "Submitting..." text when submitting', () => {
      render(<ReviewForm {...defaultProps} submitting={true} />);
      expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument();
    });

    it('disables Submit button when submitting', () => {
      render(<ReviewForm {...defaultProps} submitting={true} />);
      expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled();
    });

    it('disables Cancel button when submitting', () => {
      render(<ReviewForm {...defaultProps} submitting={true} />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });

    it('does not disable buttons when not submitting', () => {
      render(<ReviewForm {...defaultProps} submitting={false} />);
      expect(screen.getByRole('button', { name: 'Submit Review' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled();
    });
  });
});
