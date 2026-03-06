import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/dashboard/page';

const mockGetUserProfile = jest.fn();
const mockGetUserSubmissions = jest.fn();
const mockGetSavedItems = jest.fn();

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
    getUserSubmissions: (...args: unknown[]) => mockGetUserSubmissions(...args),
    getSavedItems: (...args: unknown[]) => mockGetSavedItems(...args),
  },
}));

jest.mock('@/lib/user-profile', () => ({
  formatUserDisplayName: jest.fn((user) => user?.display_name || 'User'),
  formatJoinDate: jest.fn((date) => new Date(date).toLocaleDateString()),
  getProfileCompletionPercentage: jest.fn(() => 75),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    mockGetUserProfile.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
    );
    mockGetUserSubmissions.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 100))
    );
    mockGetSavedItems.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 100))
    );

    render(<DashboardPage />);

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('should fetch user data on mount', async () => {
    const mockUser = { display_name: 'John Doe', created_at: '2024-01-01T00:00:00Z' };
    mockGetUserProfile.mockResolvedValue(mockUser);
    mockGetUserSubmissions.mockResolvedValue({ data: [] });
    mockGetSavedItems.mockResolvedValue({ data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalledTimes(1);
      expect(mockGetUserSubmissions).toHaveBeenCalledWith({ limit: 5 });
      expect(mockGetSavedItems).toHaveBeenCalledWith({ limit: 10 });
    });
  });

  it('should display welcome banner with user name', async () => {
    const mockUser = { display_name: 'John Doe', created_at: '2024-01-01T00:00:00Z' };
    mockGetUserProfile.mockResolvedValue(mockUser);
    mockGetUserSubmissions.mockResolvedValue({ data: [] });
    mockGetSavedItems.mockResolvedValue({ data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });
  });

  it('should display stats cards with counts', async () => {
    const mockUser = { display_name: 'John', created_at: '2024-01-01T00:00:00Z' };
    const submissions = [
      { submission_id: '1', title: 'Test', content_type: 'business', status: 'approved' as const, submitted_at: '2024-01-01T00:00:00Z' },
    ];
    const savedItems = [
      { saved_id: '1', item_id: 'item1', item_type: 'business', item_title: 'Business 1', saved_at: '2024-01-01T00:00:00Z' },
    ];

    mockGetUserProfile.mockResolvedValue(mockUser);
    mockGetUserSubmissions.mockResolvedValue({ data: submissions });
    mockGetSavedItems.mockResolvedValue({ data: savedItems });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Submissions')).toBeInTheDocument();
      expect(screen.getByText('Saved Items')).toBeInTheDocument();
      expect(screen.getByText('Notifications Active')).toBeInTheDocument();
    });
  });

  it('should display error message on api failure', async () => {
    mockGetUserProfile.mockRejectedValue(new Error('API Error'));
    mockGetUserSubmissions.mockResolvedValue({ data: [] });
    mockGetSavedItems.mockResolvedValue({ data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load dashboard data/)).toBeInTheDocument();
    });
  });

  it('should display recent submissions section', async () => {
    const mockUser = { display_name: 'John', created_at: '2024-01-01T00:00:00Z' };
    const submissions = [
      { submission_id: '1', title: 'Business Submission', content_type: 'business', status: 'approved' as const, submitted_at: '2024-01-01T00:00:00Z' },
    ];

    mockGetUserProfile.mockResolvedValue(mockUser);
    mockGetUserSubmissions.mockResolvedValue({ data: submissions });
    mockGetSavedItems.mockResolvedValue({ data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Recent Submissions')).toBeInTheDocument();
      expect(screen.getByText('Business Submission')).toBeInTheDocument();
    });
  });

  it('should display view all link for submissions', async () => {
    mockGetUserProfile.mockResolvedValue({ display_name: 'John', created_at: '2024-01-01T00:00:00Z' });
    mockGetUserSubmissions.mockResolvedValue({ data: [] });
    mockGetSavedItems.mockResolvedValue({ data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      const viewAllLink = screen.getByText('View all');
      expect(viewAllLink).toHaveAttribute('href', '/dashboard/submissions');
    });
  });

  it('should display quick action links', async () => {
    mockGetUserProfile.mockResolvedValue({ display_name: 'John', created_at: '2024-01-01T00:00:00Z' });
    mockGetUserSubmissions.mockResolvedValue({ data: [] });
    mockGetSavedItems.mockResolvedValue({ data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Submit Business')).toBeInTheDocument();
      expect(screen.getByText('Find Deals')).toBeInTheDocument();
      expect(screen.getByText('Browse Events')).toBeInTheDocument();
    });
  });

  it('should display no submissions message when empty', async () => {
    mockGetUserProfile.mockResolvedValue({ display_name: 'John', created_at: '2024-01-01T00:00:00Z' });
    mockGetUserSubmissions.mockResolvedValue({ data: [] });
    mockGetSavedItems.mockResolvedValue({ data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No submissions yet.')).toBeInTheDocument();
    });
  });

  it('should format submission status with proper styling', async () => {
    const mockUser = { display_name: 'John', created_at: '2024-01-01T00:00:00Z' };
    const submissions = [
      { submission_id: '1', title: 'Test', content_type: 'business', status: 'approved' as const, submitted_at: '2024-01-01T00:00:00Z' },
      { submission_id: '2', title: 'Test 2', content_type: 'event', status: 'pending' as const, submitted_at: '2024-01-02T00:00:00Z' },
    ];

    mockGetUserProfile.mockResolvedValue(mockUser);
    mockGetUserSubmissions.mockResolvedValue({ data: submissions });
    mockGetSavedItems.mockResolvedValue({ data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('should handle null submissions data', async () => {
    mockGetUserProfile.mockResolvedValue({ display_name: 'John', created_at: '2024-01-01T00:00:00Z' });
    mockGetUserSubmissions.mockResolvedValue({ data: null });
    mockGetSavedItems.mockResolvedValue({ data: null });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No submissions yet.')).toBeInTheDocument();
    });
  });

  it('should display member since date', async () => {
    const mockUser = { display_name: 'John', created_at: '2024-01-01T00:00:00Z' };
    mockGetUserProfile.mockResolvedValue(mockUser);
    mockGetUserSubmissions.mockResolvedValue({ data: [] });
    mockGetSavedItems.mockResolvedValue({ data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Member since/)).toBeInTheDocument();
    });
  });

  it('should call all three api endpoints', async () => {
    mockGetUserProfile.mockResolvedValue({ display_name: 'John', created_at: '2024-01-01T00:00:00Z' });
    mockGetUserSubmissions.mockResolvedValue({ data: [] });
    mockGetSavedItems.mockResolvedValue({ data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalledTimes(1);
      expect(mockGetUserSubmissions).toHaveBeenCalledTimes(1);
      expect(mockGetSavedItems).toHaveBeenCalledTimes(1);
    });
  });
});
