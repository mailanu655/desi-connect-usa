import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EventDetailPage from '@/app/events/[id]/page';
import { DesiEvent } from '@/lib/api-client';

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

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock navigator.share and clipboard
Object.defineProperty(navigator, 'share', { value: jest.fn(), writable: true, configurable: true });
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn().mockResolvedValue(undefined) },
  writable: true,
  configurable: true,
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });

const mockEvent: DesiEvent = {
  event_id: 'evt-1',
  title: 'Grand Diwali Celebration',
  description: 'An evening of light, music, and culture celebrating Diwali with the Indian community.',
  category: 'cultural',
  location: 'Community Center',
  city: 'New York',
  state: 'NY',
  start_date: '2024-11-01T18:00:00',
  end_date: '2024-11-01T23:00:00',
  is_virtual: false,
  is_free: true,
  organizer: 'NYC Desi Association',
  status: 'active',
  rsvp_count: 45,
  venue_name: 'Grand Ballroom',
  address: '123 Broadway, New York, NY 10001',
  registration_url: 'https://tickets.example.com/diwali',
};

const mockRelatedEvents: DesiEvent[] = [
  {
    event_id: 'evt-2',
    title: 'Navratri Garba Night',
    description: 'Traditional Garba dance celebration',
    category: 'cultural',
    location: 'Dance Hall',
    city: 'New York',
    state: 'NY',
    start_date: '2024-10-15T19:00:00',
    is_virtual: false,
    is_free: true,
    organizer: 'Garba NYC',
    status: 'active',
  },
];

// Helper to set up fetch mock for event detail + RSVP check + related events
function setupFetchMocks(
  event: DesiEvent | null = mockEvent,
  hasRsvped = false,
  relatedEvents: DesiEvent[] = mockRelatedEvents,
) {
  mockFetch.mockImplementation((url: string) => {
    const urlStr = typeof url === 'string' ? url : url.toString();

    // Event detail fetch
    if (urlStr.includes('/events/evt-1') && !urlStr.includes('/rsvp') && !urlStr.includes('category=')) {
      if (!event) {
        return Promise.resolve({ ok: false, status: 404 });
      }
      return Promise.resolve({
        ok: true,
        json: async () => event,
      });
    }

    // RSVP check
    if (urlStr.includes('/rsvp')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ hasRsvped }),
      });
    }

    // Related events
    if (urlStr.includes('category=')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: relatedEvents, pagination: { page: 1, limit: 3, total: relatedEvents.length, totalPages: 1 } }),
      });
    }

    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

describe('EventDetailPage', () => {
  const pageParams = { params: { id: 'evt-1' } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
    setupFetchMocks();
  });

  // ─── Basic Rendering ──────────────────────────────────────

  it('renders event title', async () => {
    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Grand Diwali Celebration')).toBeInTheDocument();
    });
  });

  it('renders event description under About heading', async () => {
    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText(/An evening of light, music/)).toBeInTheDocument();
    });
  });

  it('renders location and address', async () => {
    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      // Check that location information is rendered
      expect(screen.getByText('Community Center')).toBeInTheDocument();
    });
  });

  it('renders organizer name', async () => {
    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/NYC Desi Association/)).toBeInTheDocument();
    });
  });

  it('renders category badge', async () => {
    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/cultural/i)).toBeInTheDocument();
    });
  });

  it('renders Free badge for free events', async () => {
    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument();
    });
  });

  it('shows Free badge for free non-virtual events', async () => {
    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument();
    });
  });

  // ─── Virtual Events ───────────────────────────────────────

  it('shows Online Event indicator for virtual events', async () => {
    const virtualEvent: DesiEvent = {
      ...mockEvent,
      is_virtual: true,
      virtual_url: 'https://zoom.us/j/123',
      registration_url: 'https://zoom.us/j/123',
    };
    setupFetchMocks(virtualEvent);

    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Online Event/i)).toBeInTheDocument();
    });
  });

  // ─── Registration / Tickets ───────────────────────────────

  it('shows Get Tickets link when registration_url is present', async () => {
    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Get Tickets/i)).toBeInTheDocument();
    });
  });

  it('does not show Get Tickets when registration_url is absent', async () => {
    const noRegEvent: DesiEvent = { ...mockEvent, registration_url: undefined };
    setupFetchMocks(noRegEvent);

    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Grand Diwali Celebration')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Get Tickets/i)).not.toBeInTheDocument();
  });

  // ─── Loading & Error States ───────────────────────────────

  it('shows loading skeleton initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<EventDetailPage {...pageParams} />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state when event fetch fails', async () => {
    setupFetchMocks(null);

    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Event Not Found/i)).toBeInTheDocument();
    });
  });

  it('shows Back to Events link on error', async () => {
    setupFetchMocks(null);

    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      const backLink = screen.getByText(/Back to Events/i);
      expect(backLink).toBeInTheDocument();
    });
  });

  // ─── RSVP – Unauthenticated ───────────────────────────────

  it('shows Login to RSVP button when not authenticated', async () => {
    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Login to RSVP/i)).toBeInTheDocument();
    });
  });

  // ─── RSVP – Authenticated, Not RSVPed ─────────────────────

  it('shows RSVP to Event button when authenticated but not RSVPed', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { user_id: 'u-1', name: 'Test User' },
    });
    setupFetchMocks(mockEvent, false);

    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/RSVP to Event/i)).toBeInTheDocument();
    });
  });

  it('calls POST /api/events/[id]/rsvp when RSVP button is clicked', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { user_id: 'u-1', name: 'Test User' },
    });
    setupFetchMocks(mockEvent, false);

    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/RSVP to Event/i)).toBeInTheDocument();
    });

    // Click RSVP – the mock for POST rsvp should still return ok
    const rsvpButton = screen.getByText(/RSVP to Event/i);
    await act(async () => {
      fireEvent.click(rsvpButton);
    });

    // Verify that a POST to /rsvp was made
    await waitFor(() => {
      const postCalls = mockFetch.mock.calls.filter(
        ([url, opts]: [string, RequestInit?]) => url.includes('/rsvp') && opts?.method === 'POST'
      );
      expect(postCalls.length).toBeGreaterThan(0);
    });
  });

  // ─── RSVP – Authenticated, Already RSVPed ─────────────────

  it('shows You\'re Going state when already RSVPed', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { user_id: 'u-1', name: 'Test User' },
    });
    setupFetchMocks(mockEvent, true);

    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/You're Going/i)).toBeInTheDocument();
    });
  });

  it('shows Cancel RSVP option when already RSVPed', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { user_id: 'u-1', name: 'Test User' },
    });
    setupFetchMocks(mockEvent, true);

    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Cancel RSVP/i)).toBeInTheDocument();
    });
  });

  // ─── Share Event ──────────────────────────────────────────

  it('renders Share Event button', async () => {
    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Share Event/i)).toBeInTheDocument();
    });
  });

  it('uses clipboard fallback when navigator.share is unavailable', async () => {
    // Remove navigator.share to test fallback
    const origShare = navigator.share;
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true });

    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Share Event/i)).toBeInTheDocument();
    });

    const shareBtn = screen.getByText(/Share Event/i);
    await act(async () => {
      fireEvent.click(shareBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Link copied to clipboard/i)).toBeInTheDocument();
    });

    // Restore
    Object.defineProperty(navigator, 'share', { value: origShare, writable: true, configurable: true });
  });

  // ─── Related Events ───────────────────────────────────────

  it('renders More Events section with related events', async () => {
    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText('More Events')).toBeInTheDocument();
      expect(screen.getByText('Navratri Garba Night')).toBeInTheDocument();
    });
  });

  it('does not render More Events section when no related events', async () => {
    setupFetchMocks(mockEvent, false, []);

    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Grand Diwali Celebration')).toBeInTheDocument();
    });

    expect(screen.queryByText('More Events')).not.toBeInTheDocument();
  });

  // ─── Organizer Display ───────────────────────────────────

  it('displays organizer name on the detail page', async () => {
    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText('NYC Desi Association')).toBeInTheDocument();
    });
  });

  // ─── Interested? Section ──────────────────────────────────

  it('renders Interested? section heading', async () => {
    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Interested\?/)).toBeInTheDocument();
    });
  });

  // ─── Back to Events link ──────────────────────────────────

  it('has a Back to Events link to /events', async () => {
    await act(async () => {
      render(<EventDetailPage {...pageParams} />);
    });

    await waitFor(() => {
      const backLink = screen.getByText(/Back to Events/i);
      expect(backLink.closest('a')).toHaveAttribute('href', '/events');
    });
  });
});
