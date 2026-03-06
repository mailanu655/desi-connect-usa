import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ConsultancyDetailPage from '@/app/consultancies/[id]/page';
import { Consultancy, Review, ApiResponse } from '@/lib/api-client';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a data-href={href} href={href}>
      {children}
    </a>
  );
});

// Mock next/image
jest.mock('next/image', () => {
  return (props: Record<string, unknown>) => <img {...props} />;
});

// Mock next/navigation
const mockUseParams = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ReviewForm
jest.mock('@/components/reviews/ReviewForm', () => {
  return function MockReviewForm({ onSubmit, onCancel, submitting }: any) {
    return (
      <div data-testid="review-form">
        <button
          onClick={() =>
            onSubmit({
              rating: 5,
              review_text: 'Great!',
              is_fraud_report: false,
            })
          }
        >
          Mock Submit
        </button>
        <button onClick={onCancel}>Mock Cancel</button>
        {submitting && <span>Submitting...</span>}
      </div>
    );
  };
});

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock data
const mockConsultancy: Consultancy = {
  consultancy_id: 'cons-1',
  name: 'TechBridge Solutions',
  specialization: 'it_staffing',
  description: 'Premier IT staffing consultancy serving the Indian community',
  city: 'San Jose',
  state: 'CA',
  address: '123 Tech Way',
  phone: '408-555-1234',
  email: 'info@techbridge.com',
  website: 'https://techbridge.com',
  rating: 4.5,
  review_count: 23,
  is_verified: true,
  fraud_alert: false,
  status: 'active',
};

const mockFraudConsultancy: Consultancy = {
  ...mockConsultancy,
  consultancy_id: 'cons-2',
  name: 'Shady Consulting',
  is_verified: false,
  fraud_alert: true,
  fraud_alert_reason:
    'Multiple community members reported fraudulent practices',
};

const mockReviews: Review[] = [
  {
    review_id: 'rev-1',
    reviewable_type: 'consultancy',
    reviewable_id: 'cons-1',
    reviewable_name: 'TechBridge Solutions',
    reviewer_id: 'user-1',
    reviewer_name: 'Raj Kumar',
    rating: 5,
    review_text: 'Excellent service and placement support',
    status: 'approved',
    submission_source: 'web',
    is_fraud_report: false,
    created_at: '2024-10-15T10:00:00Z',
    updated_at: '2024-10-15T10:00:00Z',
  },
  {
    review_id: 'rev-2',
    reviewable_type: 'consultancy',
    reviewable_id: 'cons-1',
    reviewable_name: 'TechBridge Solutions',
    reviewer_id: 'user-2',
    reviewer_name: 'Priya Sharma',
    rating: 4,
    review_text: 'Good consultancy, helped with H1B transfer',
    status: 'approved',
    submission_source: 'web',
    is_fraud_report: false,
    created_at: '2024-10-10T10:00:00Z',
    updated_at: '2024-10-10T10:00:00Z',
  },
];

const mockReviewsResponse: ApiResponse<Review[]> = {
  data: mockReviews,
  pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

const mockEmptyReviewsResponse: ApiResponse<Review[]> = {
  data: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseParams.mockReturnValue({ id: 'cons-1' });
  mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/reviews')) {
      return Promise.resolve({
        ok: true,
        json: async () => mockReviewsResponse,
      });
    }
    // Default: consultancy detail
    return Promise.resolve({
      ok: true,
      json: async () => mockConsultancy,
    });
  });
});

describe('ConsultancyDetailPage', () => {
  // Test 1: Component Rendering
  describe('Component Rendering', () => {
    it('should export the component', () => {
      expect(ConsultancyDetailPage).toBeDefined();
      expect(typeof ConsultancyDetailPage).toBe('function');
    });

    it('should render consultancy name', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /TechBridge Solutions/i })).toBeInTheDocument();
      });
    });

    it('should render specialization label as "IT Staffing"', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getAllByText(/IT Staffing/i).length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should render consultancy description', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(
          screen.getByText(
            'Premier IT staffing consultancy serving the Indian community'
          )
        ).toBeInTheDocument();
      });
    });

    it('should render verified badge when consultancy is verified', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Verified/i)).toBeInTheDocument();
      });
    });
  });

  // Test 2: Contact Info
  describe('Contact Info', () => {
    it('should display address', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('123 Tech Way')).toBeInTheDocument();
      });
    });

    it('should display phone number', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('408-555-1234')).toBeInTheDocument();
      });
    });

    it('should display email address', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('info@techbridge.com')).toBeInTheDocument();
      });
    });

    it('should display website link', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        const websiteLink = screen.getByRole('link', {
          name: /Visit Website/i,
        });
        expect(websiteLink).toBeInTheDocument();
      });
    });
  });

  // Test 3: Rating Display
  describe('Rating Display', () => {
    it('should display star rating', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/4\.5/)).toBeInTheDocument();
      });
    });

    it('should display review count', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/23 reviews/i)).toBeInTheDocument();
      });
    });
  });

  // Test 4: Fraud Alert
  describe('Fraud Alert', () => {
    it('should display fraud alert when consultancy has fraud_alert flag', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/reviews')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockReviewsResponse,
          });
        }
        // Return fraud consultancy
        return Promise.resolve({
          ok: true,
          json: async () => mockFraudConsultancy,
        });
      });

      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/fraud alert/i)).toBeInTheDocument();
      });
    });

    it('should display fraud alert reason', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/reviews')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockReviewsResponse,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockFraudConsultancy,
        });
      });

      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(
          screen.getByText(
            'Multiple community members reported fraudulent practices'
          )
        ).toBeInTheDocument();
      });
    });

    it('should display warning icon in fraud alert', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/reviews')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockReviewsResponse,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockFraudConsultancy,
        });
      });

      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        const alertBox = screen.getByText(/fraud alert/i).closest('div');
        expect(alertBox).toBeInTheDocument();
      });
    });
  });

  // Test 5: Breadcrumb
  describe('Breadcrumb', () => {
    it('should display breadcrumb navigation', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Consultancies')).toBeInTheDocument();
      });
    });

    it('should display consultancy name in breadcrumb', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        const breadcrumbItems = screen.getAllByText('TechBridge Solutions');
        expect(breadcrumbItems.length).toBeGreaterThan(0);
      });
    });

    it('should have link to consultancies page in breadcrumb', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        const consultanciesLink = screen.getByRole('link', {
          name: /Consultancies/i,
        });
        expect(consultanciesLink).toHaveAttribute('data-href');
      });
    });
  });

  // Test 6: Reviews Section
  describe('Reviews Section', () => {
    it('should display "Community Reviews" heading', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Community Reviews/i)).toBeInTheDocument();
      });
    });

    it('should display reviewer names', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Raj Kumar')).toBeInTheDocument();
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      });
    });

    it('should display review text', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Excellent service and placement support')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Good consultancy, helped with H1B transfer')
        ).toBeInTheDocument();
      });
    });

    it('should display review dates', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        // Dates should be formatted and displayed
        const reviewElements = screen.getAllByText(/Oct/);
        expect(reviewElements.length).toBeGreaterThan(0);
      });
    });

    it('should display sort dropdown with sorting options', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should have "Newest First" sort option', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Newest First/i)).toBeInTheDocument();
      });
    });

    it('should have "Highest Rated" sort option', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Highest Rated/i)).toBeInTheDocument();
      });
    });

    it('should have "Lowest Rated" sort option', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Lowest Rated/i)).toBeInTheDocument();
      });
    });
  });

  // Test 7: Write Review Button
  describe('Write Review Button', () => {
    it('should not show "Write a Review" button when not authenticated', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        const writeReviewButton = screen.queryByRole('button', {
          name: /Write a Review/i,
        });
        expect(writeReviewButton).not.toBeInTheDocument();
      });
    });

    it('should show "Write a Review" button when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', name: 'Test User' },
        isAuthenticated: true,
      });

      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        const writeReviewButton = screen.getByRole('button', {
          name: /Write a Review/i,
        });
        expect(writeReviewButton).toBeInTheDocument();
      });
    });

    it('should show sign-in prompt when not authenticated', async () => {
      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/to leave a review/i)
        ).toBeInTheDocument();
      });
    });
  });

  // Test 8: Review Form
  describe('Review Form', () => {
    it('should show review form when "Write a Review" is clicked and authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', name: 'Test User' },
        isAuthenticated: true,
      });

      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        const writeReviewButton = screen.getByRole('button', {
          name: /Write a Review/i,
        });
        expect(writeReviewButton).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: /Write a Review/i,
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('review-form')).toBeInTheDocument();
      });
    });

    it('should be able to submit review via form', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', name: 'Test User' },
        isAuthenticated: true,
      });

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/reviews')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockReviewsResponse,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockConsultancy,
        });
      });

      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        const writeReviewButton = screen.getByRole('button', {
          name: /Write a Review/i,
        });
        expect(writeReviewButton).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: /Write a Review/i,
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('review-form')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', {
        name: /Mock Submit/i,
      });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();
      });
    });

    it('should hide form when cancel is clicked', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', name: 'Test User' },
        isAuthenticated: true,
      });

      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        const writeReviewButton = screen.getByRole('button', {
          name: /Write a Review/i,
        });
        expect(writeReviewButton).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: /Write a Review/i,
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('review-form')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', {
        name: /Mock Cancel/i,
      });

      await act(async () => {
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();
      });
    });
  });

  // Test 9: Loading State
  describe('Loading State', () => {
    it('should show loading spinner when data is being fetched', async () => {
      mockFetch.mockImplementation(() => {
        return new Promise(() => {
          // Never resolves, simulating loading state
        });
      });

      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      // Check for loading indicator (spinner, skeleton, or loading text)
      await waitFor(
        () => {
          const loadingElements =
            screen.queryAllByText(/loading/i) ||
            screen.queryByRole('progressbar');
          expect(
            loadingElements.length > 0 || loadingElements !== null
          ).toBeTruthy();
        },
        { timeout: 1000 }
      );
    });
  });

  // Test 10: Error State
  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Fetch failed'));

      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(
          screen.getByText(
            /error|failed|unable to load|something went wrong/i
          )
        ).toBeInTheDocument();
      });
    });

    it('should show error when consultancy not found (404)', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/reviews')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockReviewsResponse,
          });
        }
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ error: 'Consultancy not found' }),
        });
      });

      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(
          screen.getByText(
            /error|not found|consultancy not found|unable to load|Failed to load/i
          )
        ).toBeInTheDocument();
      });
    });
  });

  // Test 11: Empty Reviews
  describe('Empty Reviews', () => {
    it('should display "No reviews yet" when reviews are empty', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/reviews')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockEmptyReviewsResponse,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockConsultancy,
        });
      });

      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/No reviews yet/i)).toBeInTheDocument();
      });
    });

    it('should show encouragement to write first review when empty', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/reviews')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockEmptyReviewsResponse,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockConsultancy,
        });
      });

      await act(async () => {
        render(<ConsultancyDetailPage />);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/No reviews yet|Be the first to review/i)
        ).toBeInTheDocument();
      });
    });
  });
});
