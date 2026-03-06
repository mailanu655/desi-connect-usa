import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EventsPage from '@/app/events/page';
import { DesiEvent, ApiResponse } from '@/lib/api-client';

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

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });

const mockEvents: DesiEvent[] = [
  {
    event_id: 'evt-1',
    title: 'Diwali Night Celebration',
    description: 'Grand Diwali celebration with cultural performances',
    category: 'cultural',
    location: 'Community Hall',
    city: 'New York',
    state: 'NY',
    start_date: '2024-11-01T18:00:00',
    end_date: '2024-11-01T23:00:00',
    is_virtual: false,
    is_free: true,
    organizer: 'NYC Desi Association',
    status: 'active',
    rsvp_count: 45,
  },
  {
    event_id: 'evt-2',
    title: 'Virtual Career Workshop',
    description: 'Online workshop for career development',
    category: 'professional',
    location: 'Zoom',
    city: 'Online',
    state: 'NA',
    start_date: '2024-11-15T14:00:00',
    is_virtual: true,
    is_free: false,
    organizer: 'Desi Professionals Network',
    status: 'active',
    rsvp_count: 20,
  },
  {
    event_id: 'evt-3',
    title: 'Holi Color Run',
    description: 'Fun run with colors and music',
    category: 'social',
    location: 'Central Park',
    city: 'New York',
    state: 'NY',
    start_date: '2024-03-25T10:00:00',
    is_virtual: false,
    is_free: true,
    organizer: 'Holi Events NYC',
    status: 'active',
  },
];

const mockApiResponse: ApiResponse<DesiEvent[]> = {
  data: mockEvents,
  pagination: {
    page: 1,
    limit: 12,
    total: 3,
    totalPages: 1,
  },
};

describe('EventsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });
  });

  it('exports EventsPage as a client component', () => {
    expect(EventsPage).toBeDefined();
    expect(typeof EventsPage).toBe('function');
  });

  it('renders page header with title', async () => {
    await act(async () => {
      render(<EventsPage />);
    });
    expect(screen.getByText('Community Events')).toBeInTheDocument();
  });

  it('renders page description', async () => {
    await act(async () => {
      render(<EventsPage />);
    });
    expect(
      screen.getByText('Connect with community members at cultural, professional, and social events')
    ).toBeInTheDocument();
  });

  it('fetches and displays events', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Diwali Night Celebration')).toBeInTheDocument();
      expect(screen.getByText('Virtual Career Workshop')).toBeInTheDocument();
      expect(screen.getByText('Holi Color Run')).toBeInTheDocument();
    });
  });

  it('shows loading skeleton initially', () => {
    // Delay fetch to capture loading state
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<EventsPage />);
    // Loading skeletons have animate-pulse class
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state when fetch fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await act(async () => {
      render(<EventsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Error loading events')).toBeInTheDocument();
    });
  });

  it('shows empty state when no events found', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } }),
    });

    await act(async () => {
      render(<EventsPage />);
    });

    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: /No events found/i });
      expect(heading).toBeInTheDocument();
    });
  });

  it('shows results count when events are loaded', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Found 3 events')).toBeInTheDocument();
    });
  });

  it('shows singular result count for one event', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [mockEvents[0]],
        pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
      }),
    });

    await act(async () => {
      render(<EventsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Found 1 event')).toBeInTheDocument();
    });
  });

  // ─── Filter Tests ────────────────────────────────────────────

  it('renders category filter dropdown', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('includes all event categories in dropdown', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    const categories = ['Cultural', 'Professional', 'Religious', 'Social', 'Educational', 'Sports', 'Fundraiser', 'Other'];
    for (const cat of categories) {
      expect(screen.getByText(cat)).toBeInTheDocument();
    }
  });

  it('filters by category when category is selected', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Diwali Night Celebration')).toBeInTheDocument();
    });

    const categorySelect = screen.getByDisplayValue('All Categories');
    await act(async () => {
      fireEvent.change(categorySelect, { target: { value: 'cultural' } });
    });

    // Verify fetch was called with category param
    await waitFor(() => {
      const fetchCalls = mockFetch.mock.calls;
      const lastCall = fetchCalls[fetchCalls.length - 1];
      expect(lastCall[0]).toContain('category=cultural');
    });
  });

  it('renders virtual events only toggle', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    expect(screen.getByText('Virtual Events Only')).toBeInTheDocument();
  });

  it('filters for virtual events when toggle is checked', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Diwali Night Celebration')).toBeInTheDocument();
    });

    const virtualCheckbox = screen.getByRole('checkbox');
    await act(async () => {
      fireEvent.click(virtualCheckbox);
    });

    // The page filters on client side after receiving data
    await waitFor(() => {
      // After virtual filter, non-virtual events should be gone
      // Only Virtual Career Workshop should remain
      expect(screen.queryByText('Diwali Night Celebration')).not.toBeInTheDocument();
    });
  });

  // ─── View Toggle Tests ───────────────────────────────────────

  it('renders List and Calendar view toggle buttons', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('List')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
    });
  });

  it('defaults to grid/list view', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    await waitFor(() => {
      // Grid view is the default, should show EventCards
      expect(screen.getByText('Diwali Night Celebration')).toBeInTheDocument();
    });

    // List button should have active styling
    const listButton = screen.getByText('List');
    expect(listButton.closest('button')).toHaveClass('bg-saffron-100');
  });

  it('switches to calendar view when Calendar button is clicked', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Diwali Night Celebration')).toBeInTheDocument();
    });

    const calendarButton = screen.getByText('Calendar');
    await act(async () => {
      fireEvent.click(calendarButton);
    });

    // Calendar view should show "Events by Date" heading
    expect(screen.getByText('Events by Date')).toBeInTheDocument();
  });

  // ─── Submit Event Button Tests ───────────────────────────────

  it('does not show Submit Event button when not authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    await act(async () => {
      render(<EventsPage />);
    });

    expect(screen.queryByText('Submit Event')).not.toBeInTheDocument();
  });

  it('shows Submit Event button when authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });

    await act(async () => {
      render(<EventsPage />);
    });

    expect(screen.getByText('Submit Event')).toBeInTheDocument();
  });

  it('Submit Event button links to /events/submit', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });

    await act(async () => {
      render(<EventsPage />);
    });

    const submitLink = screen.getByText('Submit Event');
    expect(submitLink.closest('a')).toHaveAttribute('data-href', '/events/submit');
  });

  // ─── Fetch Parameter Tests ───────────────────────────────────

  it('sends pagination params in fetch request', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    await waitFor(() => {
      const fetchCalls = mockFetch.mock.calls;
      expect(fetchCalls.length).toBeGreaterThan(0);
      const firstCall = fetchCalls[0][0];
      expect(firstCall).toContain('page=1');
      expect(firstCall).toContain('limit=');
    });
  });

  it('resets page to 1 when category changes', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Diwali Night Celebration')).toBeInTheDocument();
    });

    const categorySelect = screen.getByDisplayValue('All Categories');
    await act(async () => {
      fireEvent.change(categorySelect, { target: { value: 'professional' } });
    });

    await waitFor(() => {
      const fetchCalls = mockFetch.mock.calls;
      const lastCall = fetchCalls[fetchCalls.length - 1][0];
      expect(lastCall).toContain('page=1');
    });
  });
});
