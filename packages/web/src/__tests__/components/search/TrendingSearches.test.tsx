import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrendingSearches from '@/components/search/TrendingSearches';
import type { TrendingSearch } from '@desi-connect/shared/src/types';

describe('TrendingSearches', () => {
  const mockTrending: TrendingSearch[] = [
    { query: 'Indian restaurants', search_count: 500, trend: 'up' },
    { query: 'IT jobs', search_count: 350, trend: 'stable' },
    { query: 'Diwali events', search_count: 200, trend: 'down' },
  ];

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render trending searches', () => {
    render(<TrendingSearches trending={mockTrending} onSelect={mockOnSelect} />);
    expect(screen.getByTestId('trending-searches')).toBeInTheDocument();
    expect(screen.getByText('Trending Searches')).toBeInTheDocument();
  });

  it('should render all trending items', () => {
    render(<TrendingSearches trending={mockTrending} onSelect={mockOnSelect} />);
    expect(screen.getByText('Indian restaurants')).toBeInTheDocument();
    expect(screen.getByText('IT jobs')).toBeInTheDocument();
    expect(screen.getByText('Diwali events')).toBeInTheDocument();
  });

  it('should return null for empty trending array', () => {
    const { container } = render(
      <TrendingSearches trending={[]} onSelect={mockOnSelect} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should call onSelect with correct query when clicked', () => {
    render(<TrendingSearches trending={mockTrending} onSelect={mockOnSelect} />);
    fireEvent.click(screen.getByTestId('trending-Indian restaurants'));
    expect(mockOnSelect).toHaveBeenCalledWith('Indian restaurants');
  });

  it('should call onSelect for each different item', () => {
    render(<TrendingSearches trending={mockTrending} onSelect={mockOnSelect} />);
    fireEvent.click(screen.getByTestId('trending-IT jobs'));
    expect(mockOnSelect).toHaveBeenCalledWith('IT jobs');
    fireEvent.click(screen.getByTestId('trending-Diwali events'));
    expect(mockOnSelect).toHaveBeenCalledWith('Diwali events');
  });

  it('should display trend icons based on trend direction', () => {
    render(<TrendingSearches trending={mockTrending} onSelect={mockOnSelect} />);
    // up → 🔥, stable → ➡️, down → 📉
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('➡️')).toBeInTheDocument();
    expect(screen.getByText('📉')).toBeInTheDocument();
  });

  it('should render buttons with correct test IDs', () => {
    render(<TrendingSearches trending={mockTrending} onSelect={mockOnSelect} />);
    expect(screen.getByTestId('trending-Indian restaurants')).toBeInTheDocument();
    expect(screen.getByTestId('trending-IT jobs')).toBeInTheDocument();
    expect(screen.getByTestId('trending-Diwali events')).toBeInTheDocument();
  });

  it('should render a single trending item', () => {
    render(
      <TrendingSearches
        trending={[{ query: 'Solo item', search_count: 10, trend: 'up' }]}
        onSelect={mockOnSelect}
      />
    );
    expect(screen.getByText('Solo item')).toBeInTheDocument();
  });
});
