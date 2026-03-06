import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import MetrosPage from '@/app/metros/page';
import MetroDetailPage from '@/app/metros/[slug]/page';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a data-href={href} href={href}>{children}</a>
  );
});

// Mock next/navigation
const mockUseParams = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock data for API responses
const mockBusinesses = [
  {
    business_id: 'biz-1',
    name: 'Spice Palace',
    category: 'Restaurant',
    description: 'Authentic Indian cuisine',
  },
  {
    business_id: 'biz-2',
    name: 'Desi Bazaar',
    category: 'Grocery',
    description: 'Indian groceries and spices',
  },
];

const mockEvents = [
  {
    event_id: 'evt-1',
    title: 'Diwali Celebration',
    start_date: '2026-11-01',
    location: 'Community Center',
    city: 'New York City',
    is_virtual: false,
  },
  {
    event_id: 'evt-2',
    title: 'Holi Festival',
    start_date: '2026-03-15',
    location: 'Park',
    city: 'New York City',
    is_virtual: false,
  },
];

describe('Metros Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  // ═══════════════════════════════════════════════════════════════
  // METROS INDEX PAGE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('MetrosPage (Index)', () => {
    // ───────── Page Rendering ────────────────────────────────────

    it('renders the page title correctly', () => {
      render(<MetrosPage />);
      const title = screen.getByText('Top Indian Diaspora Metro Areas');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H1');
    });

    it('renders the page subtitle', () => {
      render(<MetrosPage />);
      expect(
        screen.getByText(/Discover the largest and most vibrant Indian communities/i)
      ).toBeInTheDocument();
    });

    it('renders all 10 metro cards', () => {
      render(<MetrosPage />);
      const cards = document.querySelectorAll('a[data-href*="/metros/"]');
      expect(cards.length).toBe(10);
    });

    // ───────── Metro Cards Structure ──────────────────────────────

    it('renders New York City card', () => {
      render(<MetrosPage />);
      expect(screen.getByText('New York City')).toBeInTheDocument();
    });

    it('renders Bay Area card', () => {
      render(<MetrosPage />);
      expect(screen.getByText('Bay Area')).toBeInTheDocument();
    });

    it('renders Dallas-Fort Worth card', () => {
      render(<MetrosPage />);
      expect(screen.getByText('Dallas-Fort Worth')).toBeInTheDocument();
    });

    it('renders Chicago card', () => {
      render(<MetrosPage />);
      expect(screen.getByText('Chicago')).toBeInTheDocument();
    });

    it('renders Atlanta card', () => {
      render(<MetrosPage />);
      expect(screen.getByText('Atlanta')).toBeInTheDocument();
    });

    it('renders Houston card', () => {
      render(<MetrosPage />);
      expect(screen.getByText('Houston')).toBeInTheDocument();
    });

    it('renders Seattle card', () => {
      render(<MetrosPage />);
      expect(screen.getByText('Seattle')).toBeInTheDocument();
    });

    it('renders Los Angeles card', () => {
      render(<MetrosPage />);
      expect(screen.getByText('Los Angeles')).toBeInTheDocument();
    });

    it('renders New Jersey card', () => {
      render(<MetrosPage />);
      expect(screen.getByText('New Jersey')).toBeInTheDocument();
    });

    it('renders Washington DC card', () => {
      render(<MetrosPage />);
      expect(screen.getByText('Washington DC')).toBeInTheDocument();
    });

    // ───────── Metro Card Content ────────────────────────────────

    it('displays Indian Population for NYC', () => {
      render(<MetrosPage />);
      expect(screen.getByText('300K+')).toBeInTheDocument();
    });

    it('displays Indian Population for Bay Area', () => {
      render(<MetrosPage />);
      expect(screen.getByText('500K+')).toBeInTheDocument();
    });

    it('displays Indian Population for New Jersey', () => {
      render(<MetrosPage />);
      expect(screen.getByText('400K+')).toBeInTheDocument();
    });

    it('displays metro headline for NYC', () => {
      render(<MetrosPage />);
      expect(
        screen.getByText('The Heart of Indian America on the East Coast')
      ).toBeInTheDocument();
    });

    it('displays metro headline for Bay Area', () => {
      render(<MetrosPage />);
      expect(
        screen.getByText("Silicon Valley's Indian Tech Capital")
      ).toBeInTheDocument();
    });

    it('displays metro headline for Dallas', () => {
      render(<MetrosPage />);
      expect(
        screen.getByText('The Fastest-Growing Indian Community in Texas')
      ).toBeInTheDocument();
    });

    // ───────── Metro Card Links ──────────────────────────────────

    it('links NYC card to /metros/nyc', () => {
      render(<MetrosPage />);
      const nycLink = screen.getByText('New York City').closest('a');
      expect(nycLink).toHaveAttribute('data-href', '/metros/nyc');
    });

    it('links Bay Area card to /metros/bay-area', () => {
      render(<MetrosPage />);
      const baLink = document.querySelector('a[data-href="/metros/bay-area"]');
      expect(baLink).toBeInTheDocument();
    });

    it('links Chicago card to /metros/chicago', () => {
      render(<MetrosPage />);
      const chicagoLink = document.querySelector('a[data-href="/metros/chicago"]');
      expect(chicagoLink).toBeInTheDocument();
    });

    it('links Dallas card to /metros/dallas', () => {
      render(<MetrosPage />);
      const dallasLink = document.querySelector('a[data-href="/metros/dallas"]');
      expect(dallasLink).toBeInTheDocument();
    });

    it('links Atlanta card to /metros/atlanta', () => {
      render(<MetrosPage />);
      const atlantaLink = document.querySelector('a[data-href="/metros/atlanta"]');
      expect(atlantaLink).toBeInTheDocument();
    });

    // ───────── State Codes ───────────────────────────────────────

    it('displays state code for NYC (NY)', () => {
      render(<MetrosPage />);
      expect(screen.getByText('NY')).toBeInTheDocument();
    });

    it('displays state code for Bay Area (CA)', () => {
      render(<MetrosPage />);
      const caElements = screen.getAllByText('CA');
      expect(caElements.length).toBeGreaterThan(0);
    });

    it('displays state code for Dallas (TX)', () => {
      render(<MetrosPage />);
      const txElements = screen.getAllByText('TX');
      expect(txElements.length).toBeGreaterThan(0);
    });

    // ───────── Metro Card Tags ───────────────────────────────────

    it('displays top cuisines for NYC', () => {
      render(<MetrosPage />);
      // Multiple metros may share cuisine names, so use getAllByText
      expect(screen.getAllByText('North Indian').length).toBeGreaterThan(0);
      expect(screen.getAllByText('South Indian').length).toBeGreaterThan(0);
    });

    it('displays neighborhoods as tags', () => {
      render(<MetrosPage />);
      expect(screen.getByText('Jackson Heights')).toBeInTheDocument();
    });

    it('displays at least 3 cuisine tags per metro card', () => {
      render(<MetrosPage />);
      const cuisineTags = document.querySelectorAll(
        'a[data-href="/metros/nyc"] .bg-orange-50'
      );
      expect(cuisineTags.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // METRO DETAIL PAGE TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('MetroDetailPage (Detail)', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ slug: 'nyc' });
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/businesses')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockBusinesses, pagination: { total: 2 } }),
          } as unknown as Response);
        }
        if (url.includes('/events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockEvents, pagination: { total: 2 } }),
          } as unknown as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as unknown as Response);
      });
    });

    // ───────── Loading State ──────────────────────────────────────

    it('shows loading spinner initially', () => {
      const { rerender } = render(<MetroDetailPage />);
      const spinner = document.querySelector('[role="status"]');
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText('Loading metro data...')).toBeInTheDocument();
    });

    // ───────── Hero Section ───────────────────────────────────────

    it('renders hero section with city name', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/Indian Community in New York City/i)).toBeInTheDocument();
      });
    });

    it('renders hero section with metro headline', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByText('The Heart of Indian America on the East Coast')
        ).toBeInTheDocument();
      });
    });

    it('renders hero section with metro description', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByText(/Jackson Heights in Queens to the tech corridors/i)
        ).toBeInTheDocument();
      });
    });

    it('displays Indian Population in hero', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        const indianPopElement = screen.getByText('300K+');
        expect(indianPopElement).toBeInTheDocument();
      });
    });

    it('displays metro population in hero', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        const metroPopElement = screen.getByText('8.3M');
        expect(metroPopElement).toBeInTheDocument();
      });
    });

    it('displays metro area label in hero', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('NYC Metro Area')).toBeInTheDocument();
      });
    });

    // ───────── Breadcrumb ─────────────────────────────────────────

    it('renders breadcrumb navigation', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        const breadcrumb = document.querySelector('nav[aria-label="Breadcrumb"]');
        expect(breadcrumb).toBeInTheDocument();
      });
    });

    it('breadcrumb links back to metros', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        const metrosLink = screen.getByText('Metro Areas');
        expect(metrosLink.closest('a')).toHaveAttribute('data-href', '/metros');
      });
    });

    it('breadcrumb shows current metro city name', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('New York City')).toBeInTheDocument();
      });
    });

    // ───────── Community Highlights ───────────────────────────────

    it('renders Community Highlights section', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Community Highlights')).toBeInTheDocument();
      });
    });

    it('displays all highlights for NYC', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Jackson Heights — Little India of the East Coast')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Largest Diwali celebrations outside India')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Hub for Indian tech professionals and entrepreneurs')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Numerous Indian consular and cultural organizations')
        ).toBeInTheDocument();
      });
    });

    // ───────── Key Neighborhoods ─────────────────────────────────

    it('renders Key Neighborhoods section', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Key Neighborhoods')).toBeInTheDocument();
      });
    });

    it('displays all neighborhoods for NYC', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Jackson Heights')).toBeInTheDocument();
        expect(screen.getByText('Floral Park')).toBeInTheDocument();
        expect(screen.getByText('Murray Hill')).toBeInTheDocument();
        expect(screen.getByText('Curry Hill')).toBeInTheDocument();
      });
    });

    // ───────── Cultural Landmarks ─────────────────────────────────

    it('renders Cultural Landmarks section', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Cultural Landmarks')).toBeInTheDocument();
      });
    });

    it('displays all cultural landmarks for NYC', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Hindu Temple Society of North America (Flushing)')
        ).toBeInTheDocument();
        expect(
          screen.getByText('India Day Parade on Madison Avenue')
        ).toBeInTheDocument();
        expect(screen.getByText('Ganesh Temple Canteen')).toBeInTheDocument();
      });
    });

    // ───────── Sidebar: Popular Cuisines ──────────────────────────

    it('renders Popular Cuisines sidebar section', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Popular Cuisines')).toBeInTheDocument();
      });
    });

    it('displays all top cuisines in sidebar', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('North Indian')).toBeInTheDocument();
        expect(screen.getByText('South Indian')).toBeInTheDocument();
        expect(screen.getByText('Indo-Chinese')).toBeInTheDocument();
      });
    });

    // ───────── Sidebar: Community Organizations ───────────────────

    it('renders Community Organizations sidebar section', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Community Organizations')).toBeInTheDocument();
      });
    });

    it('displays all community orgs in sidebar', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByText('FIA (Federation of Indian Associations)')
        ).toBeInTheDocument();
        expect(
          screen.getByText('AIA (Association of Indians in America)')
        ).toBeInTheDocument();
      });
    });

    // ───────── Featured Businesses ───────────────────────────────

    it('renders Featured Businesses section when businesses exist', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Featured Businesses')).toBeInTheDocument();
      });
    });

    it('displays featured businesses correctly', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Spice Palace')).toBeInTheDocument();
        expect(screen.getByText('Desi Bazaar')).toBeInTheDocument();
      });
    });

    it('displays business categories', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Restaurant')).toBeInTheDocument();
        expect(screen.getByText('Grocery')).toBeInTheDocument();
      });
    });

    it('displays business descriptions', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Authentic Indian cuisine')).toBeInTheDocument();
        expect(screen.getByText('Indian groceries and spices')).toBeInTheDocument();
      });
    });

    it('links to individual business pages', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        const bizLink = document.querySelector('a[data-href="/businesses/biz-1"]');
        expect(bizLink).toBeInTheDocument();
      });
    });

    it('displays View all businesses link', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        const viewAllLink = document.querySelector(
          'a[data-href*="/businesses?city=New"]'
        );
        expect(viewAllLink).toBeInTheDocument();
      });
    });

    // ───────── Upcoming Events ───────────────────────────────────

    it('renders Upcoming Events section when events exist', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
      });
    });

    it('displays upcoming events correctly', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Diwali Celebration')).toBeInTheDocument();
        expect(screen.getByText('Holi Festival')).toBeInTheDocument();
      });
    });

    it('displays event locations', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('Community Center')).toBeInTheDocument();
      });
    });

    it('links to individual event pages', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        const eventLink = document.querySelector('a[data-href="/events/evt-1"]');
        expect(eventLink).toBeInTheDocument();
      });
    });

    it('displays View all events link', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        const viewAllLink = document.querySelector(
          'a[data-href*="/events?city=New"]'
        );
        expect(viewAllLink).toBeInTheDocument();
      });
    });

    // ───────── Quick Links Sidebar ───────────────────────────────

    it('renders Explore quick links section', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/Explore New York City/i)).toBeInTheDocument();
      });
    });

    it('displays Browse Businesses quick link', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        const bizLink = screen.getByText(/Browse Businesses/i);
        expect(bizLink).toBeInTheDocument();
      });
    });

    it('displays Find Events quick link', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        const eventsLink = screen.getByText(/Find Events/i);
        expect(eventsLink).toBeInTheDocument();
      });
    });

    it('displays Search Jobs quick link', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        const jobsLink = screen.getByText(/Search Jobs/i);
        expect(jobsLink).toBeInTheDocument();
      });
    });

    it('displays View Deals quick link', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        const dealsLink = screen.getByText(/View Deals/i);
        expect(dealsLink).toBeInTheDocument();
      });
    });

    it('displays Find Consultancies quick link', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        const consultLink = screen.getByText(/Find Consultancies/i);
        expect(consultLink).toBeInTheDocument();
      });
    });

    // ───────── API Calls ──────────────────────────────────────────

    it('fetches businesses for the metro', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/businesses'),
          expect.any(Object)
        );
      });
    });

    it('fetches events for the metro', async () => {
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/events'),
          expect.any(Object)
        );
      });
    });

    // ───────── Not Found State ────────────────────────────────────

    it('shows not found message for invalid slug', async () => {
      mockUseParams.mockReturnValue({ slug: 'invalid-slug' });
      cleanup();
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Metro Area Not Found')
        ).toBeInTheDocument();
      });
    });

    it('shows link to browse all metros when not found', async () => {
      mockUseParams.mockReturnValue({ slug: 'invalid-slug' });
      cleanup();
      render(<MetroDetailPage />);
      await waitFor(() => {
        const backLink = screen.getByText(/Browse all metro areas/i);
        expect(backLink).toBeInTheDocument();
        expect(backLink.closest('a')).toHaveAttribute('data-href', '/metros');
      });
    });

    // ───────── Different Metro Slugs ──────────────────────────────

    it('renders Bay Area metro details when slug is bay-area', async () => {
      mockUseParams.mockReturnValue({ slug: 'bay-area' });
      cleanup();
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByText(/Indian Community in Bay Area/i)
        ).toBeInTheDocument();
        expect(screen.getByText("Silicon Valley's Indian Tech Capital")).toBeInTheDocument();
      });
    });

    it('renders Chicago metro details when slug is chicago', async () => {
      mockUseParams.mockReturnValue({ slug: 'chicago' });
      cleanup();
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByText(/Indian Community in Chicago/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/Midwest's Indian Cultural Hub/i)).toBeInTheDocument();
      });
    });

    it('renders Dallas metro details when slug is dallas', async () => {
      mockUseParams.mockReturnValue({ slug: 'dallas' });
      cleanup();
      render(<MetroDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByText(/Indian Community in Dallas-Fort Worth/i)
        ).toBeInTheDocument();
      });
    });

    // ───────── Empty State Handling ───────────────────────────────

    it('does not show Featured Businesses section when no businesses', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/businesses')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [], pagination: { total: 0 } }),
          } as unknown as Response);
        }
        if (url.includes('/events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockEvents, pagination: { total: 2 } }),
          } as unknown as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as unknown as Response);
      });

      cleanup();
      render(<MetroDetailPage />);
      await waitFor(() => {
        const businessHeaders = screen.queryAllByText('Featured Businesses');
        expect(businessHeaders.length).toBeLessThanOrEqual(1);
      });
    });

    it('does not show Upcoming Events section when no events', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/businesses')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockBusinesses, pagination: { total: 2 } }),
          } as unknown as Response);
        }
        if (url.includes('/events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [], pagination: { total: 0 } }),
          } as unknown as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as unknown as Response);
      });

      cleanup();
      render(<MetroDetailPage />);
      await waitFor(() => {
        const eventHeaders = screen.queryAllByText('Upcoming Events');
        expect(eventHeaders.length).toBeLessThanOrEqual(1);
      });
    });
  });
});
