import React from 'react';
import { render, screen } from '@testing-library/react';
import StatsCard from '@/components/admin/StatsCard';

describe('StatsCard', () => {
  it('renders label and value', () => {
    render(<StatsCard label="Total Users" value={1250} />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1250')).toBeInTheDocument();
  });

  it('renders with data-testid', () => {
    render(<StatsCard label="Test" value={0} />);
    expect(screen.getByTestId('stats-card')).toBeInTheDocument();
  });

  it('renders string values', () => {
    render(<StatsCard label="Avg Time" value="2.5h" />);
    expect(screen.getByText('2.5h')).toBeInTheDocument();
  });

  it('renders up trend indicator', () => {
    render(
      <StatsCard label="Users" value={100} trend={{ value: 12, direction: 'up' }} />
    );
    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/12% from last period/)).toBeInTheDocument();
  });

  it('renders down trend indicator', () => {
    render(
      <StatsCard label="Users" value={100} trend={{ value: 5, direction: 'down' }} />
    );
    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/5% from last period/)).toBeInTheDocument();
  });

  it('renders flat trend indicator', () => {
    render(
      <StatsCard label="Users" value={100} trend={{ value: 0, direction: 'flat' }} />
    );
    expect(screen.getByText(/→/)).toBeInTheDocument();
  });

  it('does not render trend when not provided', () => {
    render(<StatsCard label="Users" value={100} />);
    expect(screen.queryByText(/from last period/)).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <StatsCard label="Users" value={100} icon={<span data-testid="test-icon">📊</span>} />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('does not render icon container when icon not provided', () => {
    const { container } = render(<StatsCard label="Users" value={100} />);
    const iconContainer = container.querySelector('.rounded-full');
    expect(iconContainer).toBeNull();
  });

  it('applies default variant styling', () => {
    render(<StatsCard label="Users" value={100} />);
    const card = screen.getByTestId('stats-card');
    expect(card.className).toMatch(/bg-white/);
  });

  it('applies warning variant styling', () => {
    render(<StatsCard label="Users" value={100} variant="warning" />);
    const card = screen.getByTestId('stats-card');
    expect(card.className).toMatch(/bg-yellow/);
  });

  it('applies danger variant styling', () => {
    render(<StatsCard label="Users" value={100} variant="danger" />);
    const card = screen.getByTestId('stats-card');
    expect(card.className).toMatch(/bg-red/);
  });

  it('applies success variant styling', () => {
    render(<StatsCard label="Users" value={100} variant="success" />);
    const card = screen.getByTestId('stats-card');
    expect(card.className).toMatch(/bg-green/);
  });
});
