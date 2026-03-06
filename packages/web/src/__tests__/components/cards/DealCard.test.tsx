import React from 'react';
import { render, screen } from '@testing-library/react';
import DealCard from '@/components/cards/DealCard';
import { Deal } from '@/lib/api-client';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <div data-href={href}>{children}</div>
  );
});

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('DealCard', () => {
  const mockDeal: Deal = {
    deal_id: '1',
    business_name: 'Spice Palace',
    title: '30% Off on All Appetizers',
    description: 'Get 30% discount on all appetizers during happy hour.',
    deal_type: 'percentage',
    discount_value: '30% OFF',
    coupon_code: 'SPICE30',
    expiry_date: '2026-12-31',
    city: 'New York',
    state: 'NY',
    image_url: '/images/spice-palace-deal.jpg',
    status: 'active',
  };

  it('renders deal title', () => {
    render(<DealCard deal={mockDeal} />);
    expect(screen.getByText('30% Off on All Appetizers')).toBeInTheDocument();
  });

  it('renders business name', () => {
    render(<DealCard deal={mockDeal} />);
    expect(screen.getByText('Spice Palace')).toBeInTheDocument();
  });

  it('shows description', () => {
    render(<DealCard deal={mockDeal} />);
    expect(
      screen.getByText('Get 30% discount on all appetizers during happy hour.')
    ).toBeInTheDocument();
  });

  it('shows discount value', () => {
    render(<DealCard deal={mockDeal} />);
    expect(screen.getByText('30% OFF')).toBeInTheDocument();
  });

  it('shows coupon code', () => {
    render(<DealCard deal={mockDeal} />);
    expect(screen.getByText('SPICE30')).toBeInTheDocument();
  });

  it('shows expiry date', () => {
    render(<DealCard deal={mockDeal} />);
    // The format is "Dec 31" when expiry_date is future
    expect(screen.getByText('Dec 31')).toBeInTheDocument();
  });

  it('shows city and state', () => {
    render(<DealCard deal={mockDeal} />);
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
  });

  it('handles missing coupon_code', () => {
    const dealNoCoupon: Deal = {
      ...mockDeal,
      coupon_code: undefined,
    };
    render(<DealCard deal={dealNoCoupon} />);
    expect(screen.queryByText('SPICE30')).not.toBeInTheDocument();
  });

  it('handles missing image_url', () => {
    const dealNoImage: Deal = {
      ...mockDeal,
      image_url: undefined,
    };
    render(<DealCard deal={dealNoImage} />);
    const image = screen.getByAltText('30% Off on All Appetizers');
    expect(image).toHaveAttribute('src', '/images/placeholder-deal.jpg');
  });

  it('renders image when provided', () => {
    render(<DealCard deal={mockDeal} />);
    const image = screen.getByAltText('30% Off on All Appetizers');
    expect(image).toHaveAttribute('src', '/images/spice-palace-deal.jpg');
  });

  it('links to deal detail page', () => {
    const { container } = render(<DealCard deal={mockDeal} />);
    const link = container.querySelector('[data-href]');
    expect(link).toHaveAttribute('data-href', '/deals/1');
  });

  it('handles missing discount_value', () => {
    const dealNoDiscount: Deal = {
      ...mockDeal,
      discount_value: undefined,
    };
    render(<DealCard deal={dealNoDiscount} />);
    expect(screen.queryByText('30% OFF')).not.toBeInTheDocument();
  });

  it('shows expired status for past dates', () => {
    const expiredDeal: Deal = {
      ...mockDeal,
      expiry_date: '2020-01-01',
    };
    render(<DealCard deal={expiredDeal} />);
    // Multiple elements may have "Expired" text (overlay and status text)
    const expiredElements = screen.getAllByText('Expired');
    expect(expiredElements.length).toBeGreaterThan(0);
  });

  it('applies opacity-75 class when expired', () => {
    const expiredDeal: Deal = {
      ...mockDeal,
      expiry_date: '2020-01-01',
    };
    const { container } = render(<DealCard deal={expiredDeal} />);
    const card = container.querySelector('.card');
    expect(card).toHaveClass('opacity-75');
  });

  it('does not apply opacity-75 class when active', () => {
    const { container } = render(<DealCard deal={mockDeal} />);
    const card = container.querySelector('.card');
    expect(card).not.toHaveClass('opacity-75');
  });

  it('shows different discount values', () => {
    const differentDeal: Deal = {
      ...mockDeal,
      discount_value: 'Buy One Get One Free',
    };
    render(<DealCard deal={differentDeal} />);
    expect(screen.getByText('Buy One Get One Free')).toBeInTheDocument();
  });

  it('shows Code label before coupon code', () => {
    render(<DealCard deal={mockDeal} />);
    expect(screen.getByText('Code:')).toBeInTheDocument();
  });

  it('handles different expiry dates', () => {
    const futureDeal: Deal = {
      ...mockDeal,
      expiry_date: '2026-06-15',
    };
    render(<DealCard deal={futureDeal} />);
    expect(screen.getByText('Jun 15')).toBeInTheDocument();
  });

  it('shows business name in uppercase', () => {
    render(<DealCard deal={mockDeal} />);
    const businessNameElement = screen.getByText('Spice Palace');
    expect(businessNameElement).toHaveClass('uppercase');
  });
});
