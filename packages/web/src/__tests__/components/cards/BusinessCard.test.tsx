import React from 'react';
import { render, screen } from '@testing-library/react';
import BusinessCard from '@/components/cards/BusinessCard';
import { Business } from '@/lib/api-client';

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

describe('BusinessCard', () => {
  const mockBusiness: Business = {
    business_id: '1',
    name: 'Taj Indian Cuisine',
    category: 'Restaurants',
    description: 'Authentic Indian restaurant',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip_code: '10001',
    phone: '(212) 555-1234',
    email: 'info@tajny.com',
    website: 'https://tajny.com',
    hours: '11AM - 10PM',
    image_url: '/images/taj.jpg',
    rating: 4.5,
    review_count: 128,
    status: 'active',
    created_at: '2023-01-01',
  };

  it('renders business name', () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText('Taj Indian Cuisine')).toBeInTheDocument();
  });

  it('renders business category badge', () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText('Restaurants')).toBeInTheDocument();
  });

  it('renders address (city, state, zip)', () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText('New York, NY 10001')).toBeInTheDocument();
  });

  it('shows phone number when available', () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText('(212) 555-1234')).toBeInTheDocument();
  });

  it('shows rating stars when available', () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText('4.5 (128)')).toBeInTheDocument();
  });

  it('shows review count', () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText(/128/)).toBeInTheDocument();
  });

  it('links to business detail page', () => {
    const { container } = render(<BusinessCard business={mockBusiness} />);
    const link = container.querySelector('[data-href]');
    expect(link).toHaveAttribute('data-href', '/businesses/1');
  });

  it('renders business image when image_url provided', () => {
    render(<BusinessCard business={mockBusiness} />);
    const image = screen.getByAltText('Taj Indian Cuisine');
    expect(image).toHaveAttribute('src', '/images/taj.jpg');
  });

  it('uses placeholder image when image_url not provided', () => {
    const businessNoImage: Business = {
      ...mockBusiness,
      image_url: undefined,
    };
    render(<BusinessCard business={businessNoImage} />);
    const image = screen.getByAltText('Taj Indian Cuisine');
    expect(image).toHaveAttribute('src', '/images/placeholder-business.jpg');
  });

  it('handles missing phone number', () => {
    const businessNoPhone: Business = {
      ...mockBusiness,
      phone: undefined,
    };
    render(<BusinessCard business={businessNoPhone} />);
    expect(screen.queryByText('(212) 555-1234')).not.toBeInTheDocument();
  });

  it('handles missing rating', () => {
    const businessNoRating: Business = {
      ...mockBusiness,
      rating: undefined,
    };
    render(<BusinessCard business={businessNoRating} />);
    expect(screen.queryByText(/4.5 \(\d+\)/)).not.toBeInTheDocument();
  });

  it('handles missing review count', () => {
    const businessNoReviewCount: Business = {
      ...mockBusiness,
      review_count: undefined,
    };
    render(<BusinessCard business={businessNoReviewCount} />);
    // Should show rating but with 0 reviews
    expect(screen.getByText('4.5 (0)')).toBeInTheDocument();
  });

  it('renders full address string', () => {
    render(<BusinessCard business={mockBusiness} />);
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  it('renders 5-star rating correctly', () => {
    const businessFiveStars: Business = {
      ...mockBusiness,
      rating: 5,
    };
    render(<BusinessCard business={businessFiveStars} />);
    expect(screen.getByText('5.0 (128)')).toBeInTheDocument();
  });

  it('renders 3-star rating correctly', () => {
    const businessThreeStars: Business = {
      ...mockBusiness,
      rating: 3,
    };
    render(<BusinessCard business={businessThreeStars} />);
    expect(screen.getByText('3.0 (128)')).toBeInTheDocument();
  });

  it('renders half-star rating correctly', () => {
    const businessHalfStar: Business = {
      ...mockBusiness,
      rating: 3.5,
    };
    render(<BusinessCard business={businessHalfStar} />);
    expect(screen.getByText('3.5 (128)')).toBeInTheDocument();
  });
});
