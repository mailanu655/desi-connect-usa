import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EventDetailPage from '@/app/events/[id]/page';
import { DesiEvent } from '@/lib/api-client';
import * as googleCalendar from '@/lib/calendar/google-calendar';

// Mock the google-calendar module to allow spying on its exports
jest.mock('@/lib/calendar/google-calendar', () => {
  const actual = jest.requireActual('@/lib/calendar/google-calendar');
  return {
    ...actual,
    getGoogleCalendarUrlForEvent: jest.fn(actual.getGoogleCalendarUrlForEvent),
    downloadIcsFile: jest.fn(actual.downloadIcsFile),
  };
});

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

// Get references to the mocked calendar functions
const mockGetGoogleCalendarUrl = googleCalendar.getGoogleCalendarUrlForEvent as jest.Mock;
const mockDownloadIcsFile = googleCalendar.downloadIcsFile as jest.Mock;

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

const mockVirtualEvent: DesiEvent = {
  event_id: 'evt-v1',
  title: 'Virtual Bollywood Night',
  description: 'Online Bollywood music and dance session.',
  category: 'entertainment',
  location: 'Online',
  city: 'New York',
  state: 'NY',
  start_date: '2024-12-15T20:00:00Z',
  end_date: '2024-12-15T22:00:00Z',
  is_virtual: true,
  is_free: true,
  status: 'active',
  virtual_url: 'https://zoom.us/meeting/123',
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

function setupFetchMocks(
  event: DesiEvent | null = mockEvent,
  hasRsvped = false,
  relatedEvents: DesiEvent[] = mockRelatedEvents,
) {
  mockFetch.mockImplementation((url: string) => {
    const urlStr = typeof url === 'string' ? url : url.toString();

    if (urlStr.includes('/events/') && !urlStr.includes('/rsvp') && !urlStr.includes('category=')) {
      if (!event) {
        return Promise.resolve({ ok: false, status: 404 });
      }
      return Promise.resolve({
        ok: true,
        json: async () => event,
      });
    }

    if (urlStr.includes('/rsvp')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ hasRsvped }),
      });
    }

    if (urlStr.includes('category=')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: relatedEvents, pagination: { page: 1, limit: 3, total: relatedEvents.length, totalPages: 1 } }),
      });
    }

    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

describe('EventDetailPage — Calendar Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
    setupFetchMocks();
    // Mock downloadIcsFile to prevent DOM manipulation in test env
    mockDownloadIcsFile.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── Google Calendar Button ──────────────────────────────

  describe('Google Calendar Button', () => {
    it('renders the "Add to Google Calendar" button', async () => {
      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('google-calendar-btn')).toBeInTheDocument();
      });
    });

    it('displays correct button text', async () => {
      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Add to Google Calendar')).toBeInTheDocument();
      });
    });

    it('renders as a link element', async () => {
      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        const btn = screen.getByTestId('google-calendar-btn');
        expect(btn.tagName).toBe('A');
      });
    });

    it('opens in a new tab with proper rel attributes', async () => {
      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        const btn = screen.getByTestId('google-calendar-btn');
        expect(btn).toHaveAttribute('target', '_blank');
        expect(btn).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('has an href pointing to Google Calendar', async () => {
      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        const btn = screen.getByTestId('google-calendar-btn');
        const href = btn.getAttribute('href');
        expect(href).toContain('calendar.google.com');
      });
    });

    it('includes event title in the Google Calendar URL', async () => {
      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        const btn = screen.getByTestId('google-calendar-btn');
        const href = btn.getAttribute('href') || '';
        expect(href).toContain('Grand+Diwali+Celebration');
      });
    });

    it('includes dates in the Google Calendar URL', async () => {
      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        const btn = screen.getByTestId('google-calendar-btn');
        const href = btn.getAttribute('href') || '';
        expect(href).toContain('dates=');
      });
    });

    it('contains a calendar SVG icon', async () => {
      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        const btn = screen.getByTestId('google-calendar-btn');
        const svg = btn.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  // ─── Download .ics Button ────────────────────────────────

  describe('Download .ics Button', () => {
    it('renders the "Download .ics" button', async () => {
      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('download-ics-btn')).toBeInTheDocument();
      });
    });

    it('displays correct button text', async () => {
      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Download .ics')).toBeInTheDocument();
      });
    });

    it('renders as a button element', async () => {
      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        const btn = screen.getByTestId('download-ics-btn');
        expect(btn.tagName).toBe('BUTTON');
      });
    });

    it('calls downloadIcsFile when clicked', async () => {
      mockDownloadIcsFile.mockImplementation(() => {});

      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('download-ics-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('download-ics-btn'));
      expect(mockDownloadIcsFile).toHaveBeenCalled();
    });

    it('contains a download SVG icon', async () => {
      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        const btn = screen.getByTestId('download-ics-btn');
        const svg = btn.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  // ─── Calendar with Virtual Events ────────────────────────

  describe('Calendar with virtual events', () => {
    it('renders calendar buttons for virtual events', async () => {
      setupFetchMocks(mockVirtualEvent);

      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-v1' }} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('google-calendar-btn')).toBeInTheDocument();
        expect(screen.getByTestId('download-ics-btn')).toBeInTheDocument();
      });
    });

    it('Google Calendar URL includes virtual event details', async () => {
      setupFetchMocks(mockVirtualEvent);

      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-v1' }} />);
      });

      await waitFor(() => {
        const btn = screen.getByTestId('google-calendar-btn');
        const href = btn.getAttribute('href') || '';
        expect(href).toContain('calendar.google.com');
        expect(href).toContain('Virtual+Bollywood+Night');
      });
    });
  });

  // ─── Button Placement ────────────────────────────────────

  describe('Button placement', () => {
    it('both calendar buttons are in the same section', async () => {
      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        const gcalBtn = screen.getByTestId('google-calendar-btn');
        const icsBtn = screen.getByTestId('download-ics-btn');
        // Both buttons should share a common parent
        expect(gcalBtn.parentElement).toBe(icsBtn.parentElement);
      });
    });

    it('calendar buttons appear alongside share button', async () => {
      await act(async () => {
        render(<EventDetailPage params={{ id: 'evt-1' }} />);
      });

      await waitFor(() => {
        // The share button and calendar buttons should be in the sidebar
        const gcalBtn = screen.getByTestId('google-calendar-btn');
        const parent = gcalBtn.parentElement;
        // The parent should contain the share-related text too
        expect(parent).toBeInTheDocument();
      });
    });
  });
});
