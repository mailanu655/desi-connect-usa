import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ConsultanciesPage from '@/app/consultancies/page';
import { Consultancy, ApiResponse } from '@/lib/api-client';

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

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });

// Mock consultancy data
const mockConsultancies: Consultancy[] = [
  {
    consultancy_id: 'cons-1',
    name: 'TechBridge Solutions',
    specialization: 'it_staffing',
    description: 'Premier IT staffing consultancy',
    city: 'San Jose',
    state: 'CA',
    rating: 4.5,
    review_count: 23,
    is_verified: true,
    fraud_alert: false,
    status: 'active',
  },
  {
    consultancy_id: 'cons-2',
    name: 'Visa Path Immigration',
    specialization: 'h1b_sponsor',
    description: 'H-1B and green card processing',
    city: 'New York',
    state: 'NY',
    rating: 3.2,
    review_count: 8,
    is_verified: false,
    fraud_alert: true,
    fraud_alert_reason: 'Multiple fraud reports received',
    status: 'active',
  },
  {
    consultancy_id: 'cons-3',
    name: 'DesiTax Accounting',
    specialization: 'tax_accounting',
    description: 'Tax and accounting services',
    city: 'Chicago',
    state: 'IL',
    rating: 4.8,
    review_count: 45,
    is_verified: true,
    fraud_alert: false,
    status: 'active',
  },
];

const mockApiResponse: ApiResponse<Consultancy[]> = {
  data: mockConsultancies,
  pagination: { page: 1, limit: 12, total: 3, totalPages: 1 },
};

describe('ConsultanciesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });
  });

  describe('Component Rendering', () => {
    it('should export the page component', () => {
      expect(ConsultanciesPage).toBeDefined();
      expect(typeof ConsultanciesPage).toBe('function');
    });

    it('should render the page title "Desi Consultancy Directory"', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const heading = screen.getByRole('heading', {
          name: /desi consultancy directory/i,
        });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should render the description text', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const description = screen.getByText(/find and review Indian consultancies/i);
        expect(description).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch and display consultancy names', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('TechBridge Solutions')).toBeInTheDocument();
        expect(screen.getByText('Visa Path Immigration')).toBeInTheDocument();
        expect(screen.getByText('DesiTax Accounting')).toBeInTheDocument();
      });
    });

    it('should show verified badge for verified consultancies', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const verifiedBadges = screen.getAllByText('✓ Verified');
        expect(verifiedBadges.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should show fraud alert for flagged consultancies', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const fraudAlerts = screen.getAllByText(/fraud alert/i);
        const fraudAlert = fraudAlerts.find(el => el.tagName === 'SPAN')!;
        expect(fraudAlert).toBeInTheDocument();
      });
    });

    it('should show specialization labels', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(screen.getAllByText(/IT Staffing/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/H-1B Sponsorship/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Tax & Accounting/i).length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should show rating stars and review count', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/23 reviews?/i)).toBeInTheDocument();
        expect(screen.getByText(/8 reviews?/i)).toBeInTheDocument();
        expect(screen.getByText(/45 reviews?/i)).toBeInTheDocument();
      });
    });

    it('should show city and state', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/San Jose, CA/i)).toBeInTheDocument();
        expect(screen.getByText(/New York, NY/i)).toBeInTheDocument();
        expect(screen.getByText(/Chicago, IL/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when fetch is pending', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<ConsultanciesPage />);

      const loadingSpinner = screen.getByRole('status');
      expect(loadingSpinner).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load consultancies/i)
        ).toBeInTheDocument();
      });
    });

    it('should show "Try again" button on error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /try again/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show "No consultancies found" when empty data returned', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
        }),
      });

      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/no consultancies found/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Search', () => {
    it('should render search input with aria-label', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const searchInput = screen.getByLabelText(/search consultancies/i);
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('should render Search button', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
      });
    });

    it('should update search input on user typing', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const searchInput = screen.getByLabelText(
          /search consultancies/i
        ) as HTMLInputElement;
        expect(searchInput).toBeInTheDocument();

        act(() => {
          fireEvent.change(searchInput, { target: { value: 'Tech' } });
        });

        expect(searchInput.value).toBe('Tech');
      });
    });
  });

  describe('Filters', () => {
    it('should render specialization dropdown', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(
          screen.getByLabelText(/specialization/i)
        ).toBeInTheDocument();
      });
    });

    it('should render City filter input', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      });
    });

    it('should render State filter input', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
      });
    });

    it('should render Sort By dropdown with options', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const sortDropdown = screen.getByLabelText(/sort by/i);
        expect(sortDropdown).toBeInTheDocument();
      });
    });

    it('should have sort options: Highest Rated, Most Reviewed, Name A-Z, Newest', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const sortDropdown = screen.getByLabelText(/sort by/i) as HTMLSelectElement;
        const options = Array.from(sortDropdown.options).map(opt => opt.value);

        expect(options).toContain('rating');
        expect(options).toContain('review_count');
        expect(options).toContain('name');
        expect(options).toContain('newest');
      });
    });

    it('should render "Verified only" checkbox', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/verified only/i)).toBeInTheDocument();
      });
    });

    it('should render "Clear all filters" button', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /clear all filters/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Results Count', () => {
    it('should show results count like "3 consultancies found"', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/3 consultancies? found/i)
        ).toBeInTheDocument();
      });
    });

    it('should show singular "consultancy" when count is 1', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [mockConsultancies[0]],
          pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
        }),
      });

      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/1 consultancy found/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should not show pagination when totalPages is 1', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
      });
    });

    it('should show pagination when totalPages > 1', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: mockConsultancies,
          pagination: { page: 1, limit: 2, total: 6, totalPages: 3 },
        }),
      });

      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
      });
    });

    it('should display Previous and Next buttons in pagination', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: mockConsultancies,
          pagination: { page: 1, limit: 2, total: 6, totalPages: 3 },
        }),
      });

      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });
  });

  describe('Links', () => {
    it('should link consultancy cards to correct detail page', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        const consultancyLinks = links.filter(link => 
          link.getAttribute('data-href')?.includes('/consultancies/cons-')
        );

        expect(
          consultancyLinks.some(link => 
            link.getAttribute('data-href') === '/consultancies/cons-1'
          )
        ).toBe(true);

        expect(
          consultancyLinks.some(link => 
            link.getAttribute('data-href') === '/consultancies/cons-2'
          )
        ).toBe(true);

        expect(
          consultancyLinks.some(link => 
            link.getAttribute('data-href') === '/consultancies/cons-3'
          )
        ).toBe(true);
      });
    });

    it('should make consultancy names clickable links', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const techBridgeLink = screen.getByRole('link', {
          name: /techbridge solutions/i,
        });
        expect(techBridgeLink).toHaveAttribute('data-href', '/consultancies/cons-1');
      });
    });
  });

  describe('API Integration', () => {
    it('should call fetch with correct URL on mount', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should call fetch again when "Try again" button is clicked after error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });

      act(() => {
        fireEvent.click(tryAgainButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Filter Interactions', () => {
    it('should filter by verified status when checkbox is checked', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const verifiedCheckbox = screen.getByLabelText(
          /verified only/i
        ) as HTMLInputElement;
        expect(verifiedCheckbox).toBeInTheDocument();

        act(() => {
          fireEvent.click(verifiedCheckbox);
        });

        expect(verifiedCheckbox.checked).toBe(true);
      });
    });

    it('should update city filter on input change', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const cityInput = screen.getByLabelText(/city/i) as HTMLInputElement;
        expect(cityInput).toBeInTheDocument();

        act(() => {
          fireEvent.change(cityInput, { target: { value: 'San Jose' } });
        });

        expect(cityInput.value).toBe('San Jose');
      });
    });

    it('should update state filter on input change', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const stateInput = screen.getByLabelText(/state/i) as HTMLInputElement;
        expect(stateInput).toBeInTheDocument();

        act(() => {
          fireEvent.change(stateInput, { target: { value: 'CA' } });
        });

        expect(stateInput.value).toBe('CA');
      });
    });

    it('should clear all filters when "Clear all filters" button is clicked', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const verifiedCheckbox = screen.getByLabelText(
          /verified only/i
        ) as HTMLInputElement;
        const cityInput = screen.getByLabelText(/city/i) as HTMLInputElement;

        act(() => {
          fireEvent.click(verifiedCheckbox);
          fireEvent.change(cityInput, { target: { value: 'San Jose' } });
        });

        expect(verifiedCheckbox.checked).toBe(true);
        expect(cityInput.value).toBe('San Jose');

        const clearButton = screen.getByRole('button', {
          name: /clear all filters/i,
        });

        act(() => {
          fireEvent.click(clearButton);
        });

        expect(verifiedCheckbox.checked).toBe(false);
        expect(cityInput.value).toBe('');
      });
    });
  });

  describe('Sorting', () => {
    it('should update results when sort option changes', async () => {
      await act(async () => {
        render(<ConsultanciesPage />);
      });

      await waitFor(() => {
        const sortDropdown = screen.getByLabelText(/sort by/i);
        expect(sortDropdown).toBeInTheDocument();

        act(() => {
          fireEvent.change(sortDropdown, { target: { value: 'review_count' } });
        });

        expect(sortDropdown).toHaveValue('review_count');
      });
    });
  });
});
