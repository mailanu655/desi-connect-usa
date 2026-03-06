/**
 * Social Content Calendar Page Tests
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ContentCalendarPage from '@/app/social/calendar/page';

// Mock child components
jest.mock('@/components/cards/SocialPostCard', () => {
  return ({ post }: any) => (
    <div data-testid={`social-post-card-${post.post_id}`}>{post.title}</div>
  );
});

// Mock content-calendar utils
jest.mock('@/lib/social-media/content-calendar', () => ({
  getContentTemplates: jest.fn(() => [
    {
      template_id: 't1',
      name: 'Community Spotlight',
      category: 'community_spotlight',
      caption_template: 'Meet {name} from our community!',
      platforms: ['instagram', 'facebook'],
    },
    {
      template_id: 't2',
      name: 'Food Feature',
      category: 'food_feature',
      caption_template: 'Craving {dish}? Check out {restaurant}!',
      platforms: ['instagram', 'twitter'],
    },
  ]),
  getDayTheme: jest.fn(() => ({
    theme: 'Motivation Monday',
    emoji: '💪',
  })),
  getContentSuggestions: jest.fn(() => [
    { template_id: 's1', name: 'Morning Motivation Post' },
    { template_id: 's2', name: 'Community Poll' },
  ]),
}));

const mockPosts = [
  {
    post_id: 'p1',
    title: 'Test Post 1',
    caption: 'Caption 1',
    platforms: ['instagram'],
    status: 'scheduled',
    category: 'food_feature',
  },
  {
    post_id: 'p2',
    title: 'Test Post 2',
    caption: 'Caption 2',
    platforms: ['facebook'],
    status: 'published',
    category: 'community_spotlight',
  },
];

describe('ContentCalendarPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page heading', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    }) as any;

    render(<ContentCalendarPage />);
    expect(screen.getByText('Content Calendar')).toBeDefined();
  });

  it('renders loading skeletons initially', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as any;
    render(<ContentCalendarPage />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(6);
  });

  it('renders post cards after loading', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockPosts }),
    }) as any;

    render(<ContentCalendarPage />);

    await waitFor(() => {
      expect(screen.getByTestId('social-post-card-p1')).toBeDefined();
      expect(screen.getByTestId('social-post-card-p2')).toBeDefined();
    });
  });

  it('shows results count after loading', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockPosts }),
    }) as any;

    render(<ContentCalendarPage />);

    await waitFor(() => {
      expect(screen.getByText('2 posts')).toBeDefined();
    });
  });

  it('shows empty state when no posts found', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    }) as any;

    render(<ContentCalendarPage />);

    await waitFor(() => {
      expect(screen.getByText('No posts found')).toBeDefined();
    });
  });

  it('shows error state on fetch failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as any;

    render(<ContentCalendarPage />);

    await waitFor(() => {
      expect(screen.getByText('Error loading posts')).toBeDefined();
    });
  });

  it('renders status filter', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as any;
    render(<ContentCalendarPage />);
    expect(screen.getByTestId('status-filter')).toBeDefined();
  });

  it('renders platform filter', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as any;
    render(<ContentCalendarPage />);
    expect(screen.getByTestId('platform-filter')).toBeDefined();
  });

  it('renders category filter', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as any;
    render(<ContentCalendarPage />);
    expect(screen.getByTestId('category-filter')).toBeDefined();
  });

  it('renders view toggle button', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as any;
    render(<ContentCalendarPage />);
    expect(screen.getByTestId('view-toggle')).toBeDefined();
  });

  it('renders reset filters button', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as any;
    render(<ContentCalendarPage />);
    expect(screen.getByTestId('reset-filters')).toBeDefined();
  });

  it('toggles view mode text when view toggle is clicked', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as any;
    render(<ContentCalendarPage />);

    const toggle = screen.getByTestId('view-toggle');
    expect(toggle.textContent).toBe('Calendar View');

    fireEvent.click(toggle);
    expect(toggle.textContent).toBe('Grid View');

    fireEvent.click(toggle);
    expect(toggle.textContent).toBe('Calendar View');
  });

  it('re-fetches when status filter changes', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
    global.fetch = fetchMock as any;

    render(<ContentCalendarPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByTestId('status-filter'), {
      target: { value: 'scheduled' },
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const lastUrl = fetchMock.mock.calls[1][0];
      expect(lastUrl).toContain('status=scheduled');
    });
  });

  it('re-fetches when platform filter changes', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
    global.fetch = fetchMock as any;

    render(<ContentCalendarPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByTestId('platform-filter'), {
      target: { value: 'instagram' },
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const lastUrl = fetchMock.mock.calls[1][0];
      expect(lastUrl).toContain('platform=instagram');
    });
  });

  it('resets all filters when reset button is clicked', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
    global.fetch = fetchMock as any;

    render(<ContentCalendarPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // Set a filter first
    fireEvent.change(screen.getByTestId('status-filter'), {
      target: { value: 'draft' },
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    // Click reset
    fireEvent.click(screen.getByTestId('reset-filters'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    // All filters should be empty
    expect((screen.getByTestId('status-filter') as HTMLSelectElement).value).toBe('');
    expect((screen.getByTestId('platform-filter') as HTMLSelectElement).value).toBe('');
    expect((screen.getByTestId('category-filter') as HTMLSelectElement).value).toBe('');
  });

  it('renders today\'s theme', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as any;
    render(<ContentCalendarPage />);
    expect(screen.getByText(/Motivation Monday/)).toBeDefined();
  });

  it('renders content suggestions', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as any;
    render(<ContentCalendarPage />);
    expect(screen.getByText('Content Ideas for Today')).toBeDefined();
    expect(screen.getByText('Morning Motivation Post')).toBeDefined();
    expect(screen.getByText('Community Poll')).toBeDefined();
  });

  it('renders templates grid', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    }) as any;

    render(<ContentCalendarPage />);

    await waitFor(() => {
      expect(screen.getByTestId('templates-grid')).toBeDefined();
    });

    expect(screen.getByText('Community Spotlight')).toBeDefined();
    expect(screen.getByText('Food Feature')).toBeDefined();
  });

  it('is exported as default', () => {
    expect(ContentCalendarPage).toBeDefined();
    expect(typeof ContentCalendarPage).toBe('function');
  });
});
