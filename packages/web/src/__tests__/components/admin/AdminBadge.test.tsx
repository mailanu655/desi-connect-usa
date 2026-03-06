import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminBadge from '@/components/admin/AdminBadge';

describe('AdminBadge', () => {
  it('renders the label text', () => {
    render(<AdminBadge label="Active" variant="green" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with data-testid', () => {
    render(<AdminBadge label="Test" variant="blue" />);
    expect(screen.getByTestId('admin-badge')).toBeInTheDocument();
  });

  it('applies green variant styling', () => {
    render(<AdminBadge label="Approved" variant="green" />);
    const badge = screen.getByTestId('admin-badge');
    expect(badge.className).toMatch(/green/);
  });

  it('applies red variant styling', () => {
    render(<AdminBadge label="Rejected" variant="red" />);
    const badge = screen.getByTestId('admin-badge');
    expect(badge.className).toMatch(/red/);
  });

  it('applies yellow variant styling', () => {
    render(<AdminBadge label="Pending" variant="yellow" />);
    const badge = screen.getByTestId('admin-badge');
    expect(badge.className).toMatch(/yellow/);
  });

  it('applies blue variant styling', () => {
    render(<AdminBadge label="Info" variant="blue" />);
    const badge = screen.getByTestId('admin-badge');
    expect(badge.className).toMatch(/blue/);
  });

  it('applies gray variant styling', () => {
    render(<AdminBadge label="Inactive" variant="gray" />);
    const badge = screen.getByTestId('admin-badge');
    expect(badge.className).toMatch(/gray/);
  });

  it('applies orange variant styling', () => {
    render(<AdminBadge label="Warning" variant="orange" />);
    const badge = screen.getByTestId('admin-badge');
    expect(badge.className).toMatch(/orange/);
  });

  it('renders as an inline element', () => {
    render(<AdminBadge label="Test" variant="green" />);
    const badge = screen.getByTestId('admin-badge');
    expect(badge.tagName.toLowerCase()).toBe('span');
  });
});
