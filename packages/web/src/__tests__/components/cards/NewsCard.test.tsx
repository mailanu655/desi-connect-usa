import React from 'react';
import { render, screen } from '@testing-library/react';
import NewsCard from '@/components/cards/NewsCard';
import { NewsArticle } from '@/lib/api-client';

// Mock Next.js Link and Image components
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <div data-href={href}>{children}</div>
  );
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock constants
jest.mock('@/lib/constants', () => ({
  NEWS_CATEGORIES: [
    { value: 'immigration', color: 'blue', label: 'Immigration' },
    { value: 'business', color: 'green', label: 'Business' },
    { value: 'culture', color: 'purple', label: 'Culture' },
    { value: 'technology', color: 'orange', label: 'Technology' },
  ],
}));

describe('NewsCard', () => {
  const mockArticle: NewsArticle = {
    news_id: '1',
    title: 'New Immigration Policy Changes',
    summary: 'The government announced major changes to immigration policies affecting work visas.',
    content: 'Full content here...',
    category: 'immigration',
    source_name: 'Immigration News Daily',
    source_url: 'https://immigrationnewsdaily.com',
    image_url: '/images/immigration-news.jpg',
    city: 'New York',
    state: 'NY',
    tags: ['immigration', 'policy', 'visas'],
    view_count: 1250,
    published_date: '2024-02-15',
    status: 'published',
  };

  it('renders article title', () => {
    render(<NewsCard article={mockArticle} />);
    expect(screen.getByText('New Immigration Policy Changes')).toBeInTheDocument();
  });

  it('renders summary text', () => {
    render(<NewsCard article={mockArticle} />);
    expect(
      screen.getByText(
        'The government announced major changes to immigration policies affecting work visas.'
      )
    ).toBeInTheDocument();
  });

  it('shows category badge with correct styling', () => {
    render(<NewsCard article={mockArticle} />);
    const categoryBadge = screen.getByText('Immigration');
    expect(categoryBadge).toBeInTheDocument();
    expect(categoryBadge).toHaveClass('badge');
  });

  it('shows source name', () => {
    render(<NewsCard article={mockArticle} />);
    expect(screen.getByText('Immigration News Daily')).toBeInTheDocument();
  });

  it('shows formatted published date', () => {
    render(<NewsCard article={mockArticle} />);
    expect(screen.getByText('Feb 15, 2024')).toBeInTheDocument();
  });

  it('links to news detail page', () => {
    const { container } = render(<NewsCard article={mockArticle} />);
    const link = container.querySelector('[data-href]');
    expect(link).toHaveAttribute('data-href', '/news/1');
  });

  it('handles missing image_url', () => {
    const articleNoImage: NewsArticle = {
      ...mockArticle,
      image_url: undefined,
    };
    render(<NewsCard article={articleNoImage} />);
    const image = screen.getByAltText('New Immigration Policy Changes');
    expect(image).toHaveAttribute('src', '/images/placeholder-news.jpg');
  });

  it('renders image when provided', () => {
    render(<NewsCard article={mockArticle} />);
    const image = screen.getByAltText('New Immigration Policy Changes');
    expect(image).toHaveAttribute('src', '/images/immigration-news.jpg');
  });

  it('shows view count when greater than 0', () => {
    render(<NewsCard article={mockArticle} />);
    expect(screen.getByText('1,250 views')).toBeInTheDocument();
  });

  it('hides view count when 0', () => {
    const articleNoViews: NewsArticle = {
      ...mockArticle,
      view_count: 0,
    };
    render(<NewsCard article={articleNoViews} />);
    expect(screen.queryByText(/views/)).not.toBeInTheDocument();
  });

  it('capitalizes category display', () => {
    render(<NewsCard article={mockArticle} />);
    expect(screen.getByText('Immigration')).toBeInTheDocument();
  });

  it('handles different category types', () => {
    const businessArticle: NewsArticle = {
      ...mockArticle,
      category: 'business',
    };
    render(<NewsCard article={businessArticle} />);
    expect(screen.getByText('Business')).toBeInTheDocument();
  });

  it('formats different dates correctly', () => {
    const oldArticle: NewsArticle = {
      ...mockArticle,
      published_date: '2023-01-05',
    };
    render(<NewsCard article={oldArticle} />);
    expect(screen.getByText('Jan 5, 2023')).toBeInTheDocument();
  });

  it('renders published_date in datetime attribute', () => {
    const { container } = render(<NewsCard article={mockArticle} />);
    const timeElement = container.querySelector('time');
    expect(timeElement).toHaveAttribute('dateTime', '2024-02-15');
  });

  it('handles large view counts with proper formatting', () => {
    const popularArticle: NewsArticle = {
      ...mockArticle,
      view_count: 1250000,
    };
    render(<NewsCard article={popularArticle} />);
    expect(screen.getByText('1,250,000 views')).toBeInTheDocument();
  });
});
