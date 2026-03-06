import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchFilters from '@/components/search/SearchFilters';
import type { SearchContentType, SearchFacets } from '@desi-connect-usa/shared/src/types';

describe('SearchFilters', () => {
  const mockOnTypesChange = jest.fn();
  const mockOnCityChange = jest.fn();
  const mockOnCategoryChange = jest.fn();

  const mockFacets: SearchFacets = {
    content_types: [
      { value: 'business', label: 'Businesses', count: 15 },
      { value: 'job', label: 'Jobs', count: 8 },
      { value: 'news', label: 'News', count: 5 },
    ],
    cities: [
      { value: 'Houston', label: 'Houston', count: 12 },
      { value: 'Dallas', label: 'Dallas', count: 7 },
    ],
    categories: [
      { value: 'Restaurants', label: 'Restaurants', count: 10 },
      { value: 'Technology', label: 'Technology', count: 6 },
    ],
  };

  const defaultProps = {
    selectedTypes: [] as SearchContentType[],
    onTypesChange: mockOnTypesChange,
    facets: mockFacets,
    selectedCity: '',
    onCityChange: mockOnCityChange,
    selectedCategory: '',
    onCategoryChange: mockOnCategoryChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the filters container', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByTestId('search-filters')).toBeInTheDocument();
  });

  it('should render Content Type heading', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByText('Content Type')).toBeInTheDocument();
  });

  it('should render content type filter buttons (excluding forum)', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByTestId('type-filter-business')).toBeInTheDocument();
    expect(screen.getByTestId('type-filter-job')).toBeInTheDocument();
    expect(screen.getByTestId('type-filter-event')).toBeInTheDocument();
    expect(screen.getByTestId('type-filter-deal')).toBeInTheDocument();
    expect(screen.getByTestId('type-filter-news')).toBeInTheDocument();
    expect(screen.getByTestId('type-filter-consultancy')).toBeInTheDocument();
    // forum is excluded
    expect(screen.queryByTestId('type-filter-forum')).not.toBeInTheDocument();
  });

  it('should toggle type selection when clicked', () => {
    render(<SearchFilters {...defaultProps} />);
    fireEvent.click(screen.getByTestId('type-filter-business'));
    expect(mockOnTypesChange).toHaveBeenCalledWith(['business']);
  });

  it('should remove type when already selected', () => {
    render(
      <SearchFilters {...defaultProps} selectedTypes={['business', 'job']} />
    );
    fireEvent.click(screen.getByTestId('type-filter-business'));
    expect(mockOnTypesChange).toHaveBeenCalledWith(['job']);
  });

  it('should show Clear button when types are selected', () => {
    render(
      <SearchFilters {...defaultProps} selectedTypes={['business']} />
    );
    expect(screen.getByTestId('clear-types')).toBeInTheDocument();
  });

  it('should not show Clear button when no types are selected', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.queryByTestId('clear-types')).not.toBeInTheDocument();
  });

  it('should call onTypesChange with empty array when Clear clicked', () => {
    render(
      <SearchFilters {...defaultProps} selectedTypes={['business']} />
    );
    fireEvent.click(screen.getByTestId('clear-types'));
    expect(mockOnTypesChange).toHaveBeenCalledWith([]);
  });

  it('should display facet counts for content types', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByText('15')).toBeInTheDocument(); // business count
    expect(screen.getByText('8')).toBeInTheDocument(); // job count
  });

  it('should render city facets when available', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByText('City')).toBeInTheDocument();
    expect(screen.getByTestId('city-filter-Houston')).toBeInTheDocument();
    expect(screen.getByTestId('city-filter-Dallas')).toBeInTheDocument();
  });

  it('should call onCityChange when city clicked', () => {
    render(<SearchFilters {...defaultProps} />);
    fireEvent.click(screen.getByTestId('city-filter-Houston'));
    expect(mockOnCityChange).toHaveBeenCalledWith('Houston');
  });

  it('should show clear city button when city is selected', () => {
    render(<SearchFilters {...defaultProps} selectedCity="Houston" />);
    expect(screen.getByTestId('clear-city')).toBeInTheDocument();
  });

  it('should clear city when clear city button clicked', () => {
    render(<SearchFilters {...defaultProps} selectedCity="Houston" />);
    fireEvent.click(screen.getByTestId('clear-city'));
    expect(mockOnCityChange).toHaveBeenCalledWith('');
  });

  it('should render category facets when available', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByTestId('category-filter-Restaurants')).toBeInTheDocument();
    expect(screen.getByTestId('category-filter-Technology')).toBeInTheDocument();
  });

  it('should call onCategoryChange when category clicked', () => {
    render(<SearchFilters {...defaultProps} />);
    fireEvent.click(screen.getByTestId('category-filter-Restaurants'));
    expect(mockOnCategoryChange).toHaveBeenCalledWith('Restaurants');
  });

  it('should show clear category button when category is selected', () => {
    render(<SearchFilters {...defaultProps} selectedCategory="Restaurants" />);
    expect(screen.getByTestId('clear-category')).toBeInTheDocument();
  });

  it('should clear category when clear category button clicked', () => {
    render(<SearchFilters {...defaultProps} selectedCategory="Restaurants" />);
    fireEvent.click(screen.getByTestId('clear-category'));
    expect(mockOnCategoryChange).toHaveBeenCalledWith('');
  });

  it('should not render city section when no city facets', () => {
    const noFacets: SearchFacets = {
      content_types: [],
      cities: [],
      categories: [],
    };
    render(<SearchFilters {...defaultProps} facets={noFacets} />);
    expect(screen.queryByText('City')).not.toBeInTheDocument();
  });

  it('should not render category section when no category facets', () => {
    const noFacets: SearchFacets = {
      content_types: [],
      cities: [],
      categories: [],
    };
    render(<SearchFilters {...defaultProps} facets={noFacets} />);
    expect(screen.queryByText('Category')).not.toBeInTheDocument();
  });

  it('should render without facets prop', () => {
    render(
      <SearchFilters
        selectedTypes={[]}
        onTypesChange={mockOnTypesChange}
        onCityChange={mockOnCityChange}
        onCategoryChange={mockOnCategoryChange}
        selectedCity=""
        selectedCategory=""
      />
    );
    expect(screen.getByTestId('search-filters')).toBeInTheDocument();
    expect(screen.getByText('Content Type')).toBeInTheDocument();
    // No city/category sections
    expect(screen.queryByText('City')).not.toBeInTheDocument();
    expect(screen.queryByText('Category')).not.toBeInTheDocument();
  });

  it('should display category facet counts', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByText('10')).toBeInTheDocument(); // Restaurants count
  });

  it('should display city facet counts', () => {
    render(<SearchFilters {...defaultProps} />);
    expect(screen.getByText('12')).toBeInTheDocument(); // Houston count
    expect(screen.getByText('7')).toBeInTheDocument(); // Dallas count
  });
});
