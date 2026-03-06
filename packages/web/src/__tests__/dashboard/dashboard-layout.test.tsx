import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePathname } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/layout';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  );
});

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Dashboard Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/dashboard');
  });

  it('should render sidebar with navigation links', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('My Submissions')).toBeInTheDocument();
    expect(screen.getByText('Saved Items')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('should render dashboard title', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render children content', () => {
    render(
      <DashboardLayout>
        <div>Test Child Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });

  it('should toggle sidebar on button click', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const toggleButton = screen.getByLabelText('Toggle sidebar');
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);
    // After clicking, sidebar should close
    fireEvent.click(toggleButton);
    // After clicking again, sidebar should open
    expect(toggleButton).toBeInTheDocument();
  });

  it('should highlight active route', () => {
    mockUsePathname.mockReturnValue('/dashboard/profile');

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const profileLink = screen.getByText('Profile Settings').closest('a');
    expect(profileLink).toHaveClass('bg-orange-100', 'text-orange-600');
  });

  it('should not highlight inactive routes', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const profileLink = screen.getByText('Profile Settings').closest('a');
    expect(profileLink).toHaveClass('text-gray-700');
    expect(profileLink).not.toHaveClass('bg-orange-100');
  });

  it('should have correct navigation hrefs', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Overview').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('My Submissions').closest('a')).toHaveAttribute('href', '/dashboard/submissions');
    expect(screen.getByText('Saved Items').closest('a')).toHaveAttribute('href', '/dashboard/saved');
    expect(screen.getByText('Notifications').closest('a')).toHaveAttribute('href', '/dashboard/notifications');
    expect(screen.getByText('Profile Settings').closest('a')).toHaveAttribute('href', '/dashboard/profile');
    expect(screen.getByText('Analytics').closest('a')).toHaveAttribute('href', '/dashboard/analytics');
  });

  it('should render header with toggle button', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const header = screen.getByRole('button', { name: /toggle sidebar/i }).closest('header');
    expect(header).toBeInTheDocument();
  });

  it('should render main content area', () => {
    render(
      <DashboardLayout>
        <div>Main Content Area</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Main Content Area')).toBeInTheDocument();
  });

  it('should have proper layout structure with flex container', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const mainDiv = container.querySelector('.flex.h-screen.bg-gray-50');
    expect(mainDiv).toBeInTheDocument();
  });

  it('should display sidebar with transition on close', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const sidebar = container.querySelector('[class*="transition-all"]');
    expect(sidebar).toBeInTheDocument();
  });
});
