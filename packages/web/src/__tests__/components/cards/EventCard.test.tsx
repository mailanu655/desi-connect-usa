import React from 'react';
import { render, screen } from '@testing-library/react';
import EventCard from '@/components/cards/EventCard';
import { DesiEvent } from '@/lib/api-client';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <div data-href={href}>{children}</div>
  );
});

describe('EventCard', () => {
  const mockEvent: DesiEvent = {
    event_id: '1',
    title: 'Indian Community Networking Event',
    description: 'Join us for a networking event with the Indian business community.',
    category: 'networking',
    location: 'Manhattan Convention Center',
    city: 'New York',
    state: 'NY',
    start_date: '2024-03-15',
    end_date: '2024-03-15',
    is_virtual: false,
    is_free: true,
    registration_url: 'https://events.example.com/register/1',
    image_url: '/images/networking-event.jpg',
    organizer: 'Indian Business Association',
    status: 'active',
  };

  it('renders event title', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Indian Community Networking Event')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<EventCard event={mockEvent} />);
    expect(
      screen.getByText(
        'Join us for a networking event with the Indian business community.'
      )
    ).toBeInTheDocument();
  });

  it('shows formatted start date', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('MAR')).toBeInTheDocument();
  });

  it('shows location', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Manhattan Convention Center')).toBeInTheDocument();
  });

  it('shows city and state', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
  });

  it('shows Virtual badge when is_virtual is true', () => {
    const virtualEvent: DesiEvent = { ...mockEvent, is_virtual: true };
    render(<EventCard event={virtualEvent} />);
    expect(screen.getByText('Virtual')).toBeInTheDocument();
  });

  it('shows In-Person badge when is_virtual is false', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('In-Person')).toBeInTheDocument();
  });

  it('shows Free badge when is_free is true', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('shows Paid badge when is_free is false', () => {
    const paidEvent: DesiEvent = { ...mockEvent, is_free: false };
    render(<EventCard event={paidEvent} />);
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('handles missing end_date', () => {
    const eventNoEndDate: DesiEvent = { ...mockEvent, end_date: undefined };
    render(<EventCard event={eventNoEndDate} />);
    expect(screen.getByText('Indian Community Networking Event')).toBeInTheDocument();
  });

  it('handles missing image_url', () => {
    const eventNoImage: DesiEvent = { ...mockEvent, image_url: undefined };
    render(<EventCard event={eventNoImage} />);
    expect(screen.getByText('Indian Community Networking Event')).toBeInTheDocument();
  });

  it('shows both Virtual and Free badges when applicable', () => {
    const virtualFreeEvent: DesiEvent = { ...mockEvent, is_virtual: true, is_free: true };
    render(<EventCard event={virtualFreeEvent} />);
    expect(screen.getByText('Virtual')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('shows both In-Person and Paid badges when applicable', () => {
    const inPersonPaidEvent: DesiEvent = { ...mockEvent, is_virtual: false, is_free: false };
    render(<EventCard event={inPersonPaidEvent} />);
    expect(screen.getByText('In-Person')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('displays date in calendar format', () => {
    render(<EventCard event={mockEvent} />);
    const dateElement = screen.getByText('15');
    expect(dateElement).toBeInTheDocument();
  });

  it('handles different dates correctly', () => {
    const differentDateEvent: DesiEvent = { ...mockEvent, start_date: '2024-12-25' };
    render(<EventCard event={differentDateEvent} />);
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('DEC')).toBeInTheDocument();
  });

  // ─── RSVP Count Badge Tests (Phase 2) ───────────────────────

  it('shows RSVP count badge with plural text when rsvp_count > 1', () => {
    const eventWithRsvps: DesiEvent = { ...mockEvent, rsvp_count: 5 };
    render(<EventCard event={eventWithRsvps} />);
    expect(screen.getByText('5 RSVPs')).toBeInTheDocument();
  });

  it('shows RSVP count badge with singular text when rsvp_count is 1', () => {
    const eventWithOneRsvp: DesiEvent = { ...mockEvent, rsvp_count: 1 };
    render(<EventCard event={eventWithOneRsvp} />);
    expect(screen.getByText('1 RSVP')).toBeInTheDocument();
  });

  it('does not show RSVP badge when rsvp_count is 0', () => {
    const eventZeroRsvps: DesiEvent = { ...mockEvent, rsvp_count: 0 };
    render(<EventCard event={eventZeroRsvps} />);
    // In-Person badge contains no digits so won't match \d+ RSVPs?
    expect(screen.queryByText(/^\d+ RSVPs?$/)).not.toBeInTheDocument();
  });

  it('does not show RSVP badge when rsvp_count is undefined', () => {
    const eventNoRsvp: DesiEvent = { ...mockEvent, rsvp_count: undefined };
    render(<EventCard event={eventNoRsvp} />);
    expect(screen.queryByText(/^\d+ RSVPs?$/)).not.toBeInTheDocument();
  });

  it('does not show RSVP badge when rsvp_count is null', () => {
    const eventNullRsvp: DesiEvent = { ...mockEvent, rsvp_count: null as unknown as undefined };
    render(<EventCard event={eventNullRsvp} />);
    expect(screen.queryByText(/^\d+ RSVPs?$/)).not.toBeInTheDocument();
  });

  it('shows large RSVP count correctly', () => {
    const eventManyRsvps: DesiEvent = { ...mockEvent, rsvp_count: 250 };
    render(<EventCard event={eventManyRsvps} />);
    expect(screen.getByText('250 RSVPs')).toBeInTheDocument();
  });

  it('renders all three badges together (Virtual + Free + RSVP)', () => {
    const fullBadgeEvent: DesiEvent = {
      ...mockEvent,
      is_virtual: true,
      is_free: true,
      rsvp_count: 10,
    };
    render(<EventCard event={fullBadgeEvent} />);
    expect(screen.getByText('Virtual')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('10 RSVPs')).toBeInTheDocument();
  });

  it('links to event detail page using event_id', () => {
    render(<EventCard event={mockEvent} />);
    const link = screen.getByText('Indian Community Networking Event').closest('[data-href]');
    expect(link).toHaveAttribute('data-href', '/events/1');
  });

  it('shows year when event is in a different year from current', () => {
    const futureEvent: DesiEvent = { ...mockEvent, start_date: '2030-06-20' };
    render(<EventCard event={futureEvent} />);
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('JUN')).toBeInTheDocument();
    expect(screen.getByText('2030')).toBeInTheDocument();
  });

  it('does not show year when event is in the current year', () => {
    const currentYear = new Date().getFullYear();
    const thisYearEvent: DesiEvent = { ...mockEvent, start_date: `${currentYear}-08-10` };
    render(<EventCard event={thisYearEvent} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('AUG')).toBeInTheDocument();
    expect(screen.queryByText(String(currentYear))).not.toBeInTheDocument();
  });
});
