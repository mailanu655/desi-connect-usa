import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminSidebar from '@/components/admin/AdminSidebar';

// Mock next/navigation
const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; className?: string }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('AdminSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/admin');
  });

  it('renders with data-testid', () => {
    render(<AdminSidebar />);
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('displays the Admin Panel title', () => {
    render(<AdminSidebar />);
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('displays the Desi Connect USA subtitle', () => {
    render(<AdminSidebar />);
    expect(screen.getByText('Desi Connect USA')).toBeInTheDocument();
  });

  it('renders all 8 navigation items', () => {
    render(<AdminSidebar />);
    const navLabels = [
      'Dashboard', 'Moderation', 'Users', 'Content',
      'Approvals', 'Analytics', 'Audit Log', 'Settings',
    ];
    for (const label of navLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renders navigation links with correct hrefs', () => {
    render(<AdminSidebar />);
    const hrefs = [
      '/admin', '/admin/moderation', '/admin/users', '/admin/content',
      '/admin/approvals', '/admin/analytics', '/admin/audit-log', '/admin/settings',
    ];
    for (const href of hrefs) {
      const link = document.querySelector(`a[href="${href}"]`);
      expect(link).toBeTruthy();
    }
  });

  it('highlights Dashboard link when on /admin', () => {
    mockUsePathname.mockReturnValue('/admin');
    render(<AdminSidebar />);
    const dashboardLink = document.querySelector('a[href="/admin"]');
    expect(dashboardLink?.className).toMatch(/orange-600/);
  });

  it('highlights Moderation link when on /admin/moderation', () => {
    mockUsePathname.mockReturnValue('/admin/moderation');
    render(<AdminSidebar />);
    const modLink = document.querySelector('a[href="/admin/moderation"]');
    expect(modLink?.className).toMatch(/orange-600/);
  });

  it('does not highlight Dashboard when on sub-page', () => {
    mockUsePathname.mockReturnValue('/admin/users');
    render(<AdminSidebar />);
    const dashboardLink = document.querySelector('a[href="/admin"]');
    expect(dashboardLink?.className).not.toMatch(/orange-600/);
  });

  it('renders navigation icons', () => {
    render(<AdminSidebar />);
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('🛡️')).toBeInTheDocument();
    expect(screen.getByText('👥')).toBeInTheDocument();
    expect(screen.getByText('📝')).toBeInTheDocument();
  });
});
