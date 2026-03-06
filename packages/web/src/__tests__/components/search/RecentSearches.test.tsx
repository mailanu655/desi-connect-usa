import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RecentSearches from '@/components/search/RecentSearches';
import type { RecentSearch } from '@desi-connect/shared/src/types';

describe('RecentSearches', () => {
  const mockSearches: RecentSearch[] = [
    { query: 'restaurants', timestamp: '2024-06-01T10:00:00Z', result_count: 42 },
    { query: 'IT jobs', timestamp: '2024-06-01T09:00:00Z', result_count: 15 },
    { query: 'Diwali events', timestamp: '2024-05-31T18:00:00Z', result_count: 8 },
  ];

  const mockOnSelect = jest.fn();
  const mockOnRemove = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render recent searches', () => {
    render(
      <RecentSearches
        searches={mockSearches}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );
    expect(screen.getByTestId('recent-searches')).toBeInTheDocument();
    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
  });

  it('should display all search items', () => {
    render(
      <RecentSearches
        searches={mockSearches}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );
    expect(screen.getByText('restaurants')).toBeInTheDocument();
    expect(screen.getByText('IT jobs')).toBeInTheDocument();
    expect(screen.getByText('Diwali events')).toBeInTheDocument();
  });

  it('should return null for empty searches array', () => {
    const { container } = render(
      <RecentSearches
        searches={[]}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should call onSelect when a search item is clicked', () => {
    render(
      <RecentSearches
        searches={mockSearches}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );
    fireEvent.click(screen.getByTestId('recent-restaurants'));
    expect(mockOnSelect).toHaveBeenCalledWith('restaurants');
  });

  it('should call onRemove when remove button is clicked', () => {
    render(
      <RecentSearches
        searches={mockSearches}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );
    fireEvent.click(screen.getByTestId('remove-recent-restaurants'));
    expect(mockOnRemove).toHaveBeenCalledWith('restaurants');
  });

  it('should call onClear when Clear all is clicked', () => {
    render(
      <RecentSearches
        searches={mockSearches}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );
    fireEvent.click(screen.getByTestId('clear-recent'));
    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it('should render remove buttons for each item', () => {
    render(
      <RecentSearches
        searches={mockSearches}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );
    expect(screen.getByTestId('remove-recent-restaurants')).toBeInTheDocument();
    expect(screen.getByTestId('remove-recent-IT jobs')).toBeInTheDocument();
    expect(screen.getByTestId('remove-recent-Diwali events')).toBeInTheDocument();
  });

  it('should have aria-label on remove buttons for accessibility', () => {
    render(
      <RecentSearches
        searches={mockSearches}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );
    expect(screen.getByTestId('remove-recent-restaurants')).toHaveAttribute(
      'aria-label',
      'Remove restaurants'
    );
  });

  it('should render Clear all button', () => {
    render(
      <RecentSearches
        searches={mockSearches}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );
    expect(screen.getByText('Clear all')).toBeInTheDocument();
  });

  it('should render a single recent search', () => {
    render(
      <RecentSearches
        searches={[{ query: 'single', timestamp: '2024-01-01T00:00:00Z', result_count: 1 }]}
        onSelect={mockOnSelect}
        onRemove={mockOnRemove}
        onClear={mockOnClear}
      />
    );
    expect(screen.getByText('single')).toBeInTheDocument();
  });
});
