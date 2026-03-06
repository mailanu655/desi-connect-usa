import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SavedItemsPage from '@/app/dashboard/saved/page';

const mockGetSavedItems = jest.fn();
const mockRemoveSavedItem = jest.fn();

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getSavedItems: (...args: unknown[]) => mockGetSavedItems(...args),
    removeSavedItem: (...args: unknown[]) => mockRemoveSavedItem(...args),
  },
}));

jest.mock('@/lib/user-profile', () => ({
  groupSavedItemsByType: (items: any[]) => {
    const grouped: any = {
      business: [],
      event: [],
      deal: [],
      job: [],
      news: [],
      review: [],
    };
    items.forEach((item) => {
      if (grouped[item.item_type]) {
        grouped[item.item_type].push(item);
      }
    });
    return grouped;
  },
  formatSavedDate: (date: string) => new Date(date).toLocaleDateString(),
}));

describe('Saved Items Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    mockGetSavedItems.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 100))
    );

    render(<SavedItemsPage />);

    expect(screen.getByText('Loading saved items...')).toBeInTheDocument();
  });

  it('should fetch saved items on mount', async () => {
    mockGetSavedItems.mockResolvedValue({ data: [] });

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(mockGetSavedItems).toHaveBeenCalledWith({ limit: 100 });
    });
  });

  it('should display page title and description', async () => {
    mockGetSavedItems.mockResolvedValue({ data: [] });

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Saved Items')).toBeInTheDocument();
      expect(screen.getByText('Your favorite businesses, deals, and more')).toBeInTheDocument();
    });
  });

  it('should display filter tabs for all types', async () => {
    mockGetSavedItems.mockResolvedValue({ data: [] });

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(screen.getByText(/All \(0\)/)).toBeInTheDocument();
      expect(screen.getByText(/Business \(0\)/)).toBeInTheDocument();
      expect(screen.getByText(/Event \(0\)/)).toBeInTheDocument();
      expect(screen.getByText(/Deal \(0\)/)).toBeInTheDocument();
      expect(screen.getByText(/Job \(0\)/)).toBeInTheDocument();
      expect(screen.getByText(/News \(0\)/)).toBeInTheDocument();
      expect(screen.getByText(/Review \(0\)/)).toBeInTheDocument();
    });
  });

  it('should display no items message when empty', async () => {
    mockGetSavedItems.mockResolvedValue({ data: [] });

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('No saved items yet.')).toBeInTheDocument();
      expect(screen.getByText('Save your favorite items to access them later')).toBeInTheDocument();
    });
  });

  it('should display saved items in grid', async () => {
    const savedItems = [
      {
        saved_id: '1',
        item_id: 'item1',
        item_type: 'business' as const,
        item_title: 'Tech Startup',
        item_subtitle: 'San Francisco',
        item_image_url: 'https://example.com/image.jpg',
        saved_at: '2024-01-15T00:00:00Z',
      },
      {
        saved_id: '2',
        item_id: 'item2',
        item_type: 'event' as const,
        item_title: 'Community Meetup',
        item_subtitle: 'Monthly gathering',
        item_image_url: 'https://example.com/event.jpg',
        saved_at: '2024-01-10T00:00:00Z',
      },
    ];

    mockGetSavedItems.mockResolvedValue({ data: savedItems });

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Tech Startup')).toBeInTheDocument();
      expect(screen.getByText('Community Meetup')).toBeInTheDocument();
    });
  });

  it('should display item subtitle when present', async () => {
    const savedItems = [
      {
        saved_id: '1',
        item_id: 'item1',
        item_type: 'business' as const,
        item_title: 'Tech Company',
        item_subtitle: 'Software Development',
        item_image_url: 'https://example.com/image.jpg',
        saved_at: '2024-01-15T00:00:00Z',
      },
    ];

    mockGetSavedItems.mockResolvedValue({ data: savedItems });

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Software Development')).toBeInTheDocument();
    });
  });

  it('should filter items by type', async () => {
    const savedItems = [
      {
        saved_id: '1',
        item_id: 'item1',
        item_type: 'business' as const,
        item_title: 'Business Item',
        item_image_url: 'https://example.com/image.jpg',
        saved_at: '2024-01-15T00:00:00Z',
      },
      {
        saved_id: '2',
        item_id: 'item2',
        item_type: 'event' as const,
        item_title: 'Event Item',
        item_image_url: 'https://example.com/event.jpg',
        saved_at: '2024-01-10T00:00:00Z',
      },
    ];

    mockGetSavedItems.mockResolvedValue({ data: savedItems });

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Business Item')).toBeInTheDocument();
      expect(screen.getByText('Event Item')).toBeInTheDocument();
    });

    const businessTab = screen.getByText(/Business \(1\)/);
    fireEvent.click(businessTab);

    await waitFor(() => {
      expect(screen.getByText('Business Item')).toBeInTheDocument();
      expect(screen.queryByText('Event Item')).not.toBeInTheDocument();
    });
  });

  it('should display remove button for each item', async () => {
    const savedItems = [
      {
        saved_id: '1',
        item_id: 'item1',
        item_type: 'business' as const,
        item_title: 'Business Item',
        item_image_url: 'https://example.com/image.jpg',
        saved_at: '2024-01-15T00:00:00Z',
      },
    ];

    mockGetSavedItems.mockResolvedValue({ data: savedItems });

    render(<SavedItemsPage />);

    await waitFor(() => {
      const removeButtons = screen.getAllByText('Remove');
      expect(removeButtons.length).toBeGreaterThan(0);
    });
  });

  it('should remove item when remove button is clicked', async () => {
    const savedItems = [
      {
        saved_id: '1',
        item_id: 'item1',
        item_type: 'business' as const,
        item_title: 'Business Item',
        item_image_url: 'https://example.com/image.jpg',
        saved_at: '2024-01-15T00:00:00Z',
      },
    ];

    mockGetSavedItems.mockResolvedValue({ data: savedItems });
    mockRemoveSavedItem.mockResolvedValue({});

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Business Item')).toBeInTheDocument();
    });

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockRemoveSavedItem).toHaveBeenCalledWith('1');
    });
  });

  it('should show removing state on button during removal', async () => {
    const savedItems = [
      {
        saved_id: '1',
        item_id: 'item1',
        item_type: 'business' as const,
        item_title: 'Business Item',
        item_image_url: 'https://example.com/image.jpg',
        saved_at: '2024-01-15T00:00:00Z',
      },
    ];

    mockGetSavedItems.mockResolvedValue({ data: savedItems });
    mockRemoveSavedItem.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
    );

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Business Item')).toBeInTheDocument();
    });

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText('Removing...')).toBeInTheDocument();
    });
  });

  it('should display error message on removal failure', async () => {
    const savedItems = [
      {
        saved_id: '1',
        item_id: 'item1',
        item_type: 'business' as const,
        item_title: 'Business Item',
        item_image_url: 'https://example.com/image.jpg',
        saved_at: '2024-01-15T00:00:00Z',
      },
    ];

    mockGetSavedItems.mockResolvedValue({ data: savedItems });
    mockRemoveSavedItem.mockRejectedValue(new Error('Failed to remove'));

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Business Item')).toBeInTheDocument();
    });

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to remove item')).toBeInTheDocument();
    });
  });

  it('should display error message on fetch failure', async () => {
    mockGetSavedItems.mockRejectedValue(new Error('Fetch failed'));

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load saved items')).toBeInTheDocument();
    });
  });

  it('should update item counts in tabs', async () => {
    const savedItems = [
      {
        saved_id: '1',
        item_id: 'item1',
        item_type: 'business' as const,
        item_title: 'Business Item',
        item_image_url: 'https://example.com/image.jpg',
        saved_at: '2024-01-15T00:00:00Z',
      },
      {
        saved_id: '2',
        item_id: 'item2',
        item_type: 'business' as const,
        item_title: 'Another Business',
        item_image_url: 'https://example.com/image2.jpg',
        saved_at: '2024-01-10T00:00:00Z',
      },
      {
        saved_id: '3',
        item_id: 'item3',
        item_type: 'event' as const,
        item_title: 'Event Item',
        item_image_url: 'https://example.com/event.jpg',
        saved_at: '2024-01-05T00:00:00Z',
      },
    ];

    mockGetSavedItems.mockResolvedValue({ data: savedItems });

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(screen.getByText(/All \(3\)/)).toBeInTheDocument();
      expect(screen.getByText(/Business \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Event \(1\)/)).toBeInTheDocument();
    });
  });

  it('should display saved date for each item', async () => {
    const savedItems = [
      {
        saved_id: '1',
        item_id: 'item1',
        item_type: 'business' as const,
        item_title: 'Business Item',
        item_image_url: 'https://example.com/image.jpg',
        saved_at: '2024-01-15T00:00:00Z',
      },
    ];

    mockGetSavedItems.mockResolvedValue({ data: savedItems });

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
    });
  });

  it('should display item type badge', async () => {
    const savedItems = [
      {
        saved_id: '1',
        item_id: 'item1',
        item_type: 'business' as const,
        item_title: 'Business Item',
        item_image_url: 'https://example.com/image.jpg',
        saved_at: '2024-01-15T00:00:00Z',
      },
    ];

    mockGetSavedItems.mockResolvedValue({ data: savedItems });

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('business')).toBeInTheDocument();
    });
  });

  it('should handle null saved items data', async () => {
    mockGetSavedItems.mockResolvedValue({ data: null });

    render(<SavedItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('No saved items yet.')).toBeInTheDocument();
    });
  });

  it('should show all tab selected by default', async () => {
    const savedItems = [
      {
        saved_id: '1',
        item_id: 'item1',
        item_type: 'business' as const,
        item_title: 'Business Item',
        item_image_url: 'https://example.com/image.jpg',
        saved_at: '2024-01-15T00:00:00Z',
      },
    ];

    mockGetSavedItems.mockResolvedValue({ data: savedItems });

    const { container } = render(<SavedItemsPage />);

    await waitFor(() => {
      const allTab = screen.getByText(/All \(1\)/).closest('button');
      expect(allTab).toHaveClass('border-orange-600', 'text-orange-600');
    });
  });
});
