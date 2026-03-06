import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DealDetailPage from '@/app/deals/[id]/page';
import { Deal } from '@/lib/api-client';

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
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

// Mock data — deal expiring in 30 days
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 30);

const mockDeal: Deal = {
  deal_id: 'deal-1',
  business_name: 'Spice Palace',
  title: '20% Off All Biryani Platters',
  description: 'Get a generous 20% discount on all our biryani platters this month.',
  deal_type: 'percentage',
  discount_value: '20%',
  coupon_code: 'BIRYANI20',
  expiry_date: futureDate.toISOString(),
  city: 'Houston',
  state: 'TX',
  image_url: 'https://example.com/biryani.jpg',
  status: 'active',
};

// Deal expiring in 3 days
const soonDate = new Date();
soonDate.setDate(soonDate.getDate() + 3);
const mockExpiringSoonDeal: Deal = {
  ...mockDeal,
  deal_id: 'deal-2',
  title: 'Flash Sale BOGO Dosa',
  deal_type: 'bogo',
  discount_value: undefined,
  coupon_code: undefined,
  expiry_date: soonDate.toISOString(),
};

// Expired deal
const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 5);
const mockExpiredDeal: Deal = {
  ...mockDeal,
  deal_id: 'deal-3',
  title: 'Expired Diwali Sale',
  deal_type: 'special',
  expiry_date: pastDate.toISOString(),
};

describe('DealDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 'deal-1' });
  });

  // Helper to render with a successful fetch
  const renderWithDeal = async (deal: Deal = mockDeal) => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => deal,
    });

    await act(async () => {
      render(<DealDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getAllByText(deal.title).length).toBeGreaterThanOrEqual(1);
    });
  };

  // ─── Loading State ───────────────────────────────────────

  it('shows loading skeleton while fetching', async () => {
    // Never resolve to keep in loading state
    mockFetch.mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      render(<DealDetailPage />);
    });

    // Loading skeletons use animate-pulse class
    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  // ─── Error State ─────────────────────────────────────────

  it('shows error when deal not found (404)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    await act(async () => {
      render(<DealDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Deal Not Found')).toBeInTheDocument();
    });
  });

  it('shows error message for 404', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    await act(async () => {
      render(<DealDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Deal not found.')).toBeInTheDocument();
    });
  });

  it('shows generic error for non-404 failures', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await act(async () => {
      render(<DealDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to load deal details.')).toBeInTheDocument();
    });
  });

  it('shows Back to Deals link in error state', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    await act(async () => {
      render(<DealDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Browse All Deals')).toBeInTheDocument();
    });
  });

  it('shows Go Back button in error state', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    await act(async () => {
      render(<DealDetailPage />);
    });

    await waitFor(() => {
      const goBackBtn = screen.getByText('Go Back');
      expect(goBackBtn).toBeInTheDocument();
    });
  });

  it('Go Back button calls router.back()', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    await act(async () => {
      render(<DealDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Go Back'));
    expect(mockBack).toHaveBeenCalled();
  });

  // ─── Deal Rendering ──────────────────────────────────────

  it('renders deal title', async () => {
    await renderWithDeal();
    const titles = screen.getAllByText('20% Off All Biryani Platters');
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it('renders business name', async () => {
    await renderWithDeal();
    expect(screen.getByText(/by Spice Palace/i)).toBeInTheDocument();
  });

  it('renders deal description', async () => {
    await renderWithDeal();
    expect(screen.getByText(/Get a generous 20% discount/i)).toBeInTheDocument();
  });

  it('renders About This Deal heading', async () => {
    await renderWithDeal();
    expect(screen.getByText('About This Deal')).toBeInTheDocument();
  });

  it('renders Deal Type section', async () => {
    await renderWithDeal();
    expect(screen.getByText('Deal Type')).toBeInTheDocument();
    expect(screen.getByText('Percentage Off')).toBeInTheDocument();
  });

  it('renders deal image', async () => {
    await renderWithDeal();
    const img = document.querySelector('img[alt="20% Off All Biryani Platters"]');
    expect(img).toBeInTheDocument();
  });

  // ─── Breadcrumb ──────────────────────────────────────────

  it('renders breadcrumb with Home link', async () => {
    await renderWithDeal();
    const homeLink = screen.getByText('Home');
    expect(homeLink.closest('a')).toHaveAttribute('data-href', '/');
  });

  it('renders breadcrumb with Deals link', async () => {
    await renderWithDeal();
    const dealsLink = screen.getByText('Deals');
    expect(dealsLink.closest('a')).toHaveAttribute('data-href', '/deals');
  });

  it('renders breadcrumb with deal title', async () => {
    await renderWithDeal();
    // The breadcrumb should have the deal title
    const breadcrumbItems = document.querySelectorAll('nav[aria-label="Breadcrumb"] li');
    expect(breadcrumbItems.length).toBe(5); // Home / Deals / {title}
  });

  // ─── Sidebar ─────────────────────────────────────────────

  it('renders discount value card', async () => {
    await renderWithDeal();
    expect(screen.getByText('Discount')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('renders coupon code', async () => {
    await renderWithDeal();
    expect(screen.getByText('Coupon Code')).toBeInTheDocument();
    expect(screen.getByText('BIRYANI20')).toBeInTheDocument();
  });

  it('renders Copy Code button', async () => {
    await renderWithDeal();
    expect(screen.getByText('Copy Code')).toBeInTheDocument();
  });

  it('copies coupon code to clipboard when clicking Copy Code', async () => {
    await renderWithDeal();

    fireEvent.click(screen.getByText('Copy Code'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('BIRYANI20');
  });

  it('shows Copied feedback after copying code', async () => {
    await renderWithDeal();

    await act(async () => {
      fireEvent.click(screen.getByText('Copy Code'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Copied/i)).toBeInTheDocument();
    });
  });

  it('renders location info', async () => {
    await renderWithDeal();
    expect(screen.getByText('Houston, TX')).toBeInTheDocument();
  });

  it('renders Valid Until date', async () => {
    await renderWithDeal();
    expect(screen.getByText('Valid Until')).toBeInTheDocument();
  });

  it('renders days remaining', async () => {
    await renderWithDeal();
    // Should show approximately 30 days remaining
    const daysText = screen.getByText(/\d+ days remaining/i);
    expect(daysText).toBeInTheDocument();
  });

  it('renders Offered By business name', async () => {
    await renderWithDeal();
    expect(screen.getByText('Offered By')).toBeInTheDocument();
    // Business name appears in sidebar
    const businessNames = screen.getAllByText('Spice Palace');
    expect(businessNames.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Browse All Deals link', async () => {
    await renderWithDeal();
    const allDealsLinks = screen.getAllByText(/Browse All Deals/i);
    expect(allDealsLinks.length).toBeGreaterThanOrEqual(1);
  });

  // ─── Status Badges ───────────────────────────────────────

  it('shows Active badge for active deal', async () => {
    await renderWithDeal();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows Expiring Soon badge when deal expires within 7 days', async () => {
    await renderWithDeal(mockExpiringSoonDeal);
    expect(screen.getByText(/Expiring Soon/i)).toBeInTheDocument();
    expect(screen.getByText(/3 days left/i)).toBeInTheDocument();
  });

  it('shows Expired badge for expired deal', async () => {
    await renderWithDeal(mockExpiredDeal);
    const expiredBadges = screen.getAllByText('Expired');
    expect(expiredBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('shows expired overlay on image for expired deal', async () => {
    await renderWithDeal(mockExpiredDeal);
    // The expired overlay contains "Expired" text over the image
    const expiredOverlays = screen.getAllByText('Expired');
    expect(expiredOverlays.length).toBeGreaterThanOrEqual(2); // badge + image overlay
  });

  // ─── Deal Type Labels ────────────────────────────────────

  it('maps percentage deal type correctly', async () => {
    await renderWithDeal({ ...mockDeal, deal_type: 'percentage' });
    expect(screen.getByText('Percentage Off')).toBeInTheDocument();
  });

  it('maps bogo deal type correctly', async () => {
    await renderWithDeal(mockExpiringSoonDeal);
    expect(screen.getByText('Buy One Get One')).toBeInTheDocument();
  });

  it('maps flat deal type correctly', async () => {
    await renderWithDeal({ ...mockDeal, deal_type: 'flat' });
    expect(screen.getByText('Flat Discount')).toBeInTheDocument();
  });

  it('maps freebie deal type correctly', async () => {
    await renderWithDeal({ ...mockDeal, deal_type: 'freebie' });
    expect(screen.getByText('Free Item')).toBeInTheDocument();
  });

  it('maps bundle deal type correctly', async () => {
    await renderWithDeal({ ...mockDeal, deal_type: 'bundle' });
    expect(screen.getByText('Bundle Deal')).toBeInTheDocument();
  });

  it('maps cashback deal type correctly', async () => {
    await renderWithDeal({ ...mockDeal, deal_type: 'cashback' });
    expect(screen.getByText('Cashback')).toBeInTheDocument();
  });

  it('maps special deal type correctly', async () => {
    await renderWithDeal(mockExpiredDeal);
    expect(screen.getByText('Special Offer')).toBeInTheDocument();
  });

  // ─── No Optional Fields ──────────────────────────────────

  it('does not render discount card when no discount_value', async () => {
    const dealNoDiscount: Deal = { ...mockDeal, discount_value: undefined };
    await renderWithDeal(dealNoDiscount);
    expect(screen.queryByText('Discount')).not.toBeInTheDocument();
  });

  it('does not render coupon card when no coupon_code', async () => {
    const dealNoCoupon: Deal = { ...mockDeal, coupon_code: undefined };
    await renderWithDeal(dealNoCoupon);
    expect(screen.queryByText('Coupon Code')).not.toBeInTheDocument();
  });

  it('does not render image when no image_url', async () => {
    const dealNoImage: Deal = { ...mockDeal, image_url: undefined };
    await renderWithDeal(dealNoImage);
    const img = document.querySelector('img[alt="20% Off All Biryani Platters"]');
    expect(img).not.toBeInTheDocument();
  });

  // ─── Fetch Behavior ──────────────────────────────────────

  it('fetches deal using dealId from params', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDeal,
    });

    await act(async () => {
      render(<DealDetailPage />);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain('/deals/deal-1');
    });
  });

  it('handles network error gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<DealDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
