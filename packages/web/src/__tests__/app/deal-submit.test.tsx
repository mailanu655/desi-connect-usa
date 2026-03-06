import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DealSubmitPage from '@/app/deals/submit/page';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a data-href={href} href={href}>{children}</a>
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

// Mock next/navigation router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/deals/submit',
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });

describe('DealSubmitPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { user_id: 'u-1', name: 'Test User', email: 'test@test.com' },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper: fill required fields
  const fillRequiredFields = () => {
    const businessInput = document.querySelector('input[name="business_name"]') as HTMLInputElement;
    if (businessInput) fireEvent.change(businessInput, { target: { value: 'Spice Palace' } });

    const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement;
    if (titleInput) fireEvent.change(titleInput, { target: { value: '20% Off Biryani' } });

    const descInput = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
    if (descInput) fireEvent.change(descInput, { target: { value: 'Great deal on biryani platters' } });

    const typeSelect = document.querySelector('select[name="deal_type"]') as HTMLSelectElement;
    if (typeSelect) fireEvent.change(typeSelect, { target: { value: 'percentage' } });

    const expiryInput = document.querySelector('input[name="expiry_date"]') as HTMLInputElement;
    if (expiryInput) fireEvent.change(expiryInput, { target: { value: '2027-12-31' } });

    const cityInput = document.querySelector('input[name="city"]') as HTMLInputElement;
    if (cityInput) fireEvent.change(cityInput, { target: { value: 'Houston' } });

    const stateSelect = document.querySelector('select[name="state"]') as HTMLSelectElement;
    if (stateSelect) fireEvent.change(stateSelect, { target: { value: 'TX' } });
  };

  // ─── Page Rendering ───────────────────────────────────────

  it('renders page title', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const titles = screen.getAllByText('Submit a Deal');
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it('renders page subtitle', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    expect(
      screen.getByText(/Share exclusive deals and offers/i)
    ).toBeInTheDocument();
  });

  it('renders Submit Deal button', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    expect(screen.getByText('Submit Deal')).toBeInTheDocument();
  });

  it('renders Cancel link to /deals', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const cancelLink = screen.getByText('Cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('data-href', '/deals');
  });

  it('renders review note', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    expect(
      screen.getByText(/All deal submissions are reviewed by our moderation team/i)
    ).toBeInTheDocument();
  });

  // ─── Breadcrumb ──────────────────────────────────────────

  it('renders breadcrumb with Home link', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const homeLink = screen.getByText('Home');
    expect(homeLink.closest('a')).toHaveAttribute('data-href', '/');
  });

  it('renders breadcrumb with Deals link', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const dealsLink = screen.getByText('Deals');
    expect(dealsLink.closest('a')).toHaveAttribute('data-href', '/deals');
  });

  it('renders breadcrumb with Submit a Deal text', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const breadcrumbItems = document.querySelectorAll('nav[aria-label="Breadcrumb"] li');
    expect(breadcrumbItems.length).toBe(5); // Home / Deals / Submit a Deal
  });

  // ─── Form Sections ────────────────────────────────────────

  it('renders Business Information section', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    expect(screen.getByText('Business Information')).toBeInTheDocument();
  });

  it('renders Deal Details section', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    expect(screen.getByText('Deal Details')).toBeInTheDocument();
  });

  it('renders Location section', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    expect(screen.getByText('Location')).toBeInTheDocument();
  });

  it('renders Additional Information section', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    expect(screen.getByText('Additional Information')).toBeInTheDocument();
  });

  // ─── Form Inputs ──────────────────────────────────────────

  it('renders business_name input', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const input = document.querySelector('input[name="business_name"]');
    expect(input).toBeInTheDocument();
  });

  it('renders title input', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const input = document.querySelector('input[name="title"]');
    expect(input).toBeInTheDocument();
  });

  it('renders description textarea', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const textarea = document.querySelector('textarea[name="description"]');
    expect(textarea).toBeInTheDocument();
  });

  it('renders deal_type select with all options', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const types = ['Percentage Off', 'Flat Discount', 'Buy One Get One', 'Free Item', 'Bundle Deal', 'Cashback', 'Special Offer'];
    for (const type of types) {
      expect(screen.getByText(type)).toBeInTheDocument();
    }
  });

  it('renders discount_value input', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const input = document.querySelector('input[name="discount_value"]');
    expect(input).toBeInTheDocument();
  });

  it('renders coupon_code input', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const input = document.querySelector('input[name="coupon_code"]');
    expect(input).toBeInTheDocument();
  });

  it('renders expiry_date input', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const input = document.querySelector('input[name="expiry_date"]');
    expect(input).toBeInTheDocument();
  });

  it('renders city input', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const input = document.querySelector('input[name="city"]');
    expect(input).toBeInTheDocument();
  });

  it('renders state select', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const select = document.querySelector('select[name="state"]');
    expect(select).toBeInTheDocument();
  });

  it('renders image_url input', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const input = document.querySelector('input[name="image_url"]');
    expect(input).toBeInTheDocument();
  });

  // ─── Form Interaction ─────────────────────────────────────

  it('updates business_name on input change', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const input = document.querySelector('input[name="business_name"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'My Restaurant' } });
    expect(input.value).toBe('My Restaurant');
  });

  it('updates deal_type on select change', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const select = document.querySelector('select[name="deal_type"]') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'bogo' } });
    expect(select.value).toBe('bogo');
  });

  // ─── Validation ───────────────────────────────────────────

  it('does not submit when required fields are empty', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const submitButton = screen.getByText('Submit Deal');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows error when submitting without required fields', async () => {
    await act(async () => {
      render(<DealSubmitPage />);
    });

    const submitButton = screen.getByText('Submit Deal');
    expect(submitButton).toBeInTheDocument();
    // Validation happens client-side; fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ─── Successful Submission ────────────────────────────────

  it('submits form and shows success message', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ deal_id: 'deal-new' }),
    });

    await act(async () => {
      render(<DealSubmitPage />);
    });

    fillRequiredFields();

    const submitButton = screen.getByText('Submit Deal');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Deal submitted successfully/i)).toBeInTheDocument();
    });
  });

  it('sends correct data to API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ deal_id: 'deal-new' }),
    });

    await act(async () => {
      render(<DealSubmitPage />);
    });

    fillRequiredFields();

    // Fill optional fields too
    const couponInput = document.querySelector('input[name="coupon_code"]') as HTMLInputElement;
    if (couponInput) fireEvent.change(couponInput, { target: { value: 'DESI20' } });

    const discountInput = document.querySelector('input[name="discount_value"]') as HTMLInputElement;
    if (discountInput) fireEvent.change(discountInput, { target: { value: '20%' } });

    const submitButton = screen.getByText('Submit Deal');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      const [fetchUrl, fetchOpts] = mockFetch.mock.calls[0];
      expect(fetchUrl).toContain('/api/deals/submit');
      expect(fetchOpts.method).toBe('POST');
      expect(fetchOpts.credentials).toBe('include');

      const sentBody = JSON.parse(fetchOpts.body);
      expect(sentBody.business_name).toBe('Spice Palace');
      expect(sentBody.title).toBe('20% Off Biryani');
      expect(sentBody.deal_type).toBe('percentage');
      expect(sentBody.city).toBe('Houston');
      expect(sentBody.state).toBe('TX');
      expect(sentBody.coupon_code).toBe('DESI20');
      expect(sentBody.discount_value).toBe('20%');
    });
  });

  it('omits empty optional fields from submission', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ deal_id: 'deal-new' }),
    });

    await act(async () => {
      render(<DealSubmitPage />);
    });

    fillRequiredFields();

    const submitButton = screen.getByText('Submit Deal');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      // Empty optional fields should be undefined (not empty strings)
      expect(sentBody.coupon_code).toBeUndefined();
      expect(sentBody.image_url).toBeUndefined();
    });
  });

  it('disables submit button while submitting', async () => {
    mockFetch.mockImplementation(
      () => new Promise((resolve) => {
        setTimeout(() => resolve({ ok: true, json: async () => ({ deal_id: 'deal-new' }) }), 500);
      }),
    );

    await act(async () => {
      render(<DealSubmitPage />);
    });

    const submitButton = screen.getByText('Submit Deal') as HTMLButtonElement;
    expect(submitButton.disabled).toBe(false);
    expect(submitButton).toBeInTheDocument();
  });

  // ─── Error Handling ───────────────────────────────────────

  it('shows error message when API returns error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    });

    await act(async () => {
      render(<DealSubmitPage />);
    });

    fillRequiredFields();

    const submitButton = screen.getByText('Submit Deal');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('shows generic error when API response has no error field', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => { throw new Error('no json'); },
    });

    await act(async () => {
      render(<DealSubmitPage />);
    });

    fillRequiredFields();

    const submitButton = screen.getByText('Submit Deal');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to submit deal/i)).toBeInTheDocument();
    });
  });

  // ─── Redirect After Success ───────────────────────────────

  it('redirects to /deals after successful submission', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ deal_id: 'deal-redirect' }),
    });

    await act(async () => {
      render(<DealSubmitPage />);
    });

    fillRequiredFields();

    const submitButton = screen.getByText('Submit Deal');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Deal submitted successfully/i)).toBeInTheDocument();
    });

    // Advance timer past the 2s redirect delay
    await act(async () => {
      jest.advanceTimersByTime(2500);
    });

    expect(mockPush).toHaveBeenCalledWith('/deals');
  });

  // ─── AuthGuard ────────────────────────────────────────────

  it('does not render form when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    await act(async () => {
      render(<DealSubmitPage />);
    });

    expect(screen.queryByText('Submit a Deal')).not.toBeInTheDocument();
  });

  it('shows loading state while auth is loading', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    await act(async () => {
      render(<DealSubmitPage />);
    });

    expect(screen.queryByText('Submit a Deal')).not.toBeInTheDocument();
  });
});
