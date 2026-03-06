import React from 'react';
import { render, screen } from '@testing-library/react';
import type { SearchResult } from '@desi-connect-usa/shared/src/types';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: any }) => (
    <div data-href={href} {...rest}>
      {children}
    </div>
  );
});

import SearchResultCard from '@/components/search/SearchResultCard';

describe('SearchResultCard', () => {
  const baseResult: SearchResult = {
    id: 'b1',
    type: 'business',
    title: 'Taj Indian Cuisine',
    description: 'Authentic Indian food in Houston. Best biryani in town.',
    url: '/businesses/b1',
    city: 'Houston',
    state: 'TX',
    category: 'Restaurants',
    rating: 4.5,
    date: '2024-06-01',
  };

  it('should render the result card', () => {
    render(<SearchResultCard result={baseResult} />);
    expect(screen.getByTestId('search-result-b1')).toBeInTheDocument();
  });

  it('should display the title', () => {
    render(<SearchResultCard result={baseResult} />);
    expect(screen.getByText('Taj Indian Cuisine')).toBeInTheDocument();
  });

  it('should display the description', () => {
    render(<SearchResultCard result={baseResult} />);
    expect(
      screen.getByText('Authentic Indian food in Houston. Best biryani in town.')
    ).toBeInTheDocument();
  });

  it('should truncate long descriptions', () => {
    const longDesc = 'A'.repeat(250);
    const result: SearchResult = {
      ...baseResult,
      description: longDesc,
    };
    render(<SearchResultCard result={result} />);
    // Should show truncated text ending with ...
    expect(screen.getByText(`${'A'.repeat(200)}...`)).toBeInTheDocument();
  });

  it('should display location when city and state present', () => {
    render(<SearchResultCard result={baseResult} />);
    expect(screen.getByText('Houston, TX')).toBeInTheDocument();
  });

  it('should display rating', () => {
    render(<SearchResultCard result={baseResult} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('should display date', () => {
    render(<SearchResultCard result={baseResult} />);
    // Date formatted as "Jun 1, 2024"
    expect(screen.getByText('Jun 1, 2024')).toBeInTheDocument();
  });

  it('should display type badge', () => {
    render(<SearchResultCard result={baseResult} />);
    expect(screen.getByTestId('result-type-badge')).toBeInTheDocument();
  });

  it('should display category when present', () => {
    render(<SearchResultCard result={baseResult} />);
    expect(screen.getByText('Restaurants')).toBeInTheDocument();
  });

  it('should link to the correct URL', () => {
    render(<SearchResultCard result={baseResult} />);
    const link = screen.getByTestId('search-result-b1');
    expect(link).toHaveAttribute('data-href', '/businesses/b1');
  });

  it('should highlight matching query terms in title', () => {
    render(<SearchResultCard result={baseResult} query="taj" />);
    const marks = screen.getAllByText('Taj');
    const highlighted = marks.find(
      (el) => el.tagName.toLowerCase() === 'mark'
    );
    expect(highlighted).toBeDefined();
  });

  it('should render without query (no highlighting)', () => {
    render(<SearchResultCard result={baseResult} />);
    expect(screen.getByText('Taj Indian Cuisine')).toBeInTheDocument();
  });

  it('should render without optional fields', () => {
    const minimalResult: SearchResult = {
      id: 'j1',
      type: 'job',
      title: 'Software Engineer',
      description: 'Build great software',
      url: '/jobs/j1',
    };
    render(<SearchResultCard result={minimalResult} />);
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Build great software')).toBeInTheDocument();
  });

  it('should not display location when city/state missing', () => {
    const noLocationResult: SearchResult = {
      ...baseResult,
      city: undefined,
      state: undefined,
    };
    render(<SearchResultCard result={noLocationResult} />);
    expect(screen.queryByText('Houston, TX')).not.toBeInTheDocument();
  });

  it('should not display rating when zero or undefined', () => {
    const noRatingResult: SearchResult = {
      ...baseResult,
      rating: 0,
    };
    render(<SearchResultCard result={noRatingResult} />);
    expect(screen.queryByText('0.0')).not.toBeInTheDocument();
  });

  it('should render image when image_url is provided', () => {
    const withImage: SearchResult = {
      ...baseResult,
      image_url: '/img/taj.jpg',
    };
    render(<SearchResultCard result={withImage} />);
    const img = screen.getByAltText('Taj Indian Cuisine');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/img/taj.jpg');
  });

  it('should show icon placeholder when no image_url', () => {
    const result: SearchResult = { ...baseResult, image_url: undefined };
    render(<SearchResultCard result={result} />);
    // Icon placeholder exists — the 🏪 emoji for business
    expect(screen.getByTestId('search-result-b1')).toBeInTheDocument();
  });

  it('should display different type labels for different content types', () => {
    const jobResult: SearchResult = {
      id: 'j1',
      type: 'job',
      title: 'Developer',
      description: 'Full stack dev',
      url: '/jobs/j1',
    };
    render(<SearchResultCard result={jobResult} />);
    const badge = screen.getByTestId('result-type-badge');
    expect(badge).toHaveTextContent('Job');
  });
});
