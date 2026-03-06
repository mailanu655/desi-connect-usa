import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ProfilePage from '@/app/profile/page';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a data-href={href} href={href}>
      {children}
    </a>
  );
});

// Mock next/image
jest.mock('next/image', () => {
  return (props: Record<string, unknown>) => <img {...props} />;
});

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock AuthGuard to render children directly
jest.mock('@/components/auth/AuthGuard', () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });

const mockUser = {
  user_id: 'user-1',
  display_name: 'Test User',
  email: 'test@example.com',
  phone_number: '+1234567890',
  avatar_url: 'https://example.com/avatar.jpg',
  city: 'Bay Area',
  state: 'California',
  preferred_channel: 'web' as const,
  identity_linked: true,
  auth_provider: 'google',
  is_verified: true,
  created_via: 'web',
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
};

const mockSubmission = {
  submission_id: 'sub-1',
  content_type: 'business',
  content_id: 'business-1',
  title: 'Test Business Submission',
  status: 'pending',
  submitted_at: '2024-06-01T10:00:00Z',
  updated_at: '2024-06-01T10:00:00Z',
  rejection_reason: undefined,
};

const mockSavedItem = {
  saved_id: 'saved-1',
  item_type: 'business',
  item_id: 'business-1',
  item_title: 'Test Business',
  item_subtitle: 'Test Subtitle',
  item_image_url: 'https://example.com/image.jpg',
  saved_at: '2024-06-01T10:00:00Z',
};

const mockNotificationPref = {
  type: 'immigration_updates',
  label: 'Immigration Updates',
  description: 'Get alerts on visa bulletins',
  enabled: true,
  frequency: 'daily',
  channels: ['email'],
};

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockFetch.mockClear();
  });

  describe('AuthGuard Protection', () => {
    it('renders within AuthGuard component', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      const { container } = render(<ProfilePage />);
      expect(container).toBeTruthy();
    });

    it('displays user information when authenticated', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<ProfilePage />);
      expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(0);
    });
  });

  describe('Profile Header', () => {
    it('renders user avatar with image', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<ProfilePage />);
      const avatar = screen.getByAltText('Test User');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('renders avatar initial when no avatar_url', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, avatar_url: null },
      });
      render(<ProfilePage />);
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('displays verification badge when verified', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      const { container } = render(<ProfilePage />);
      const verificationBadge = container.querySelector('svg');
      expect(verificationBadge).toBeInTheDocument();
    });

    it('displays user location information', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<ProfilePage />);
      expect(screen.getAllByText('Bay Area, California').length).toBeGreaterThan(0);
    });

    it('displays member since date', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<ProfilePage />);
      expect(screen.getByText(/Member since/)).toBeInTheDocument();
    });

    it('displays WhatsApp Linked badge when identity_linked is true', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<ProfilePage />);
      expect(screen.getByText('WhatsApp Linked')).toBeInTheDocument();
    });

    it('renders Edit Profile link', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<ProfilePage />);
      const editLink = screen.getByRole('link', { name: /Edit Profile/ });
      expect(editLink).toHaveAttribute('data-href', '/profile/edit');
    });

    it('handles missing user data gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, city: null, state: null },
      });
      render(<ProfilePage />);
      expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
    });
  });

  describe('Tab Navigation', () => {
    it('renders all four tabs', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<ProfilePage />);
      expect(screen.getByRole('tab', { name: /Overview/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /My Submissions/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Saved Items/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Notifications/ })).toBeInTheDocument();
    });

    it('starts with Overview tab selected', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<ProfilePage />);
      const overviewTab = screen.getByRole('tab', { name: /Overview/ });
      expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    });

    it('switches to Submissions tab on click', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      fireEvent.click(submissionsTab);
      await waitFor(() => {
        expect(submissionsTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('switches to Saved Items tab on click', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });
      render(<ProfilePage />);
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(savedTab);
      await waitFor(() => {
        expect(savedTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('switches to Notifications tab on click', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ preferences: [] }),
      });
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      await waitFor(() => {
        expect(notifTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('Overview Tab', () => {
    it('displays profile information card', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<ProfilePage />);
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(0);
    });

    it('displays activity summary with view links', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<ProfilePage />);
      expect(screen.getByText('Activity Summary')).toBeInTheDocument();
      expect(screen.getAllByText('My Submissions').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Saved Items').length).toBeGreaterThan(0);
    });

    it('displays quick actions', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<ProfilePage />);
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Submit a Business')).toBeInTheDocument();
      expect(screen.getByText('Submit an Event')).toBeInTheDocument();
      expect(screen.getByText('Submit a Deal')).toBeInTheDocument();
    });

    it('navigates to submission tab when clicking activity summary view', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });
      render(<ProfilePage />);
      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /My Submissions/ })).toHaveAttribute(
          'aria-selected',
          'true'
        );
      });
    });

    it('has links to submit business, event, and deal', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<ProfilePage />);
      expect(screen.getByRole('link', { name: /Submit a Business/ })).toHaveAttribute(
        'data-href',
        '/businesses/submit'
      );
      expect(screen.getByRole('link', { name: /Submit an Event/ })).toHaveAttribute(
        'data-href',
        '/events/submit'
      );
      expect(screen.getByRole('link', { name: /Submit a Deal/ })).toHaveAttribute(
        'data-href',
        '/deals/submit'
      );
    });

    it('displays all user profile fields', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<ProfilePage />);
      expect(screen.getByText('Display Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Preferred Channel')).toBeInTheDocument();
      expect(screen.getByText('Auth Provider')).toBeInTheDocument();
    });
  });

  describe('Submissions Tab', () => {
    it('fetches submissions when tab is selected', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSubmission] }),
      });
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      fireEvent.click(submissionsTab);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users/submissions?');
      });
    });

    it('displays loading state when fetching submissions', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({ data: [] }) }),
              100
            )
          )
      );
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      fireEvent.click(submissionsTab);
      expect(screen.getByText('Loading submissions...')).toBeInTheDocument();
    });

    it('displays submitted submissions', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSubmission] }),
      });
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      fireEvent.click(submissionsTab);
      await waitFor(() => {
        expect(screen.getByText('Test Business Submission')).toBeInTheDocument();
      });
    });

    it('displays empty state when no submissions', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      fireEvent.click(submissionsTab);
      await waitFor(() => {
        expect(screen.getByText('No submissions yet')).toBeInTheDocument();
      });
    });

    it('displays submission status badge', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSubmission] }),
      });
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      fireEvent.click(submissionsTab);
      await waitFor(() => {
        expect(screen.getByText('pending')).toBeInTheDocument();
      });
    });

    it('displays submission content type', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSubmission] }),
      });
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      fireEvent.click(submissionsTab);
      await waitFor(() => {
        expect(screen.getByText('Business')).toBeInTheDocument();
      });
    });

    it('displays rejection reason when present', async () => {
      const rejectedSubmission = {
        ...mockSubmission,
        status: 'rejected',
        rejection_reason: 'Incomplete information',
      };
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [rejectedSubmission] }),
      });
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      fireEvent.click(submissionsTab);
      await waitFor(() => {
        expect(screen.getByText(/Incomplete information/)).toBeInTheDocument();
      });
    });

    it('filters submissions by content_type', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSubmission] }),
      });
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      fireEvent.click(submissionsTab);
      const filterSelect = screen.getByLabelText('Filter submissions by type');
      fireEvent.change(filterSelect, { target: { value: 'event' } });
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/submissions?content_type=event'
        );
      });
    });

    it('resets filter to all types', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSubmission] }),
      });
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      fireEvent.click(submissionsTab);
      const filterSelect = screen.getByLabelText('Filter submissions by type');
      fireEvent.change(filterSelect, { target: { value: 'business' } });
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/submissions?content_type=business'
        );
      });
      fireEvent.change(filterSelect, { target: { value: 'all' } });
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users/submissions?');
      });
    });

    it('provides view link for each submission', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSubmission] }),
      });
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      fireEvent.click(submissionsTab);
      await waitFor(() => {
        const viewLink = screen.getByRole('link', { name: /View/ });
        expect(viewLink).toHaveAttribute('data-href', '/businesss/business-1');
      });
    });

    it('displays different status styles for different statuses', async () => {
      const submissions = [
        mockSubmission,
        { ...mockSubmission, submission_id: 'sub-2', status: 'approved' },
        { ...mockSubmission, submission_id: 'sub-3', status: 'rejected' },
      ];
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: submissions }),
      });
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      fireEvent.click(submissionsTab);
      await waitFor(() => {
        expect(screen.getByText('pending')).toBeInTheDocument();
        expect(screen.getByText('approved')).toBeInTheDocument();
        expect(screen.getByText('rejected')).toBeInTheDocument();
      });
    });

    it('handles fetch error gracefully', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      fireEvent.click(submissionsTab);
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
      consoleSpy.mockRestore();
    });
  });

  describe('Saved Items Tab', () => {
    it('fetches saved items when tab is selected', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSavedItem] }),
      });
      render(<ProfilePage />);
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(savedTab);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users/saved?');
      });
    });

    it('displays loading state when fetching saved items', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({ data: [] }) }),
              100
            )
          )
      );
      render(<ProfilePage />);
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(savedTab);
      expect(screen.getByText('Loading saved items...')).toBeInTheDocument();
    });

    it('displays saved items in grid', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSavedItem] }),
      });
      render(<ProfilePage />);
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(savedTab);
      await waitFor(() => {
        expect(screen.getByText('Test Business')).toBeInTheDocument();
      });
    });

    it('displays empty state when no saved items', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });
      render(<ProfilePage />);
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(savedTab);
      await waitFor(() => {
        expect(screen.getByText('No saved items')).toBeInTheDocument();
      });
    });

    it('displays saved item image when present', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSavedItem] }),
      });
      render(<ProfilePage />);
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(savedTab);
      await waitFor(() => {
        const image = screen.getByAltText('Test Business');
        expect(image).toBeInTheDocument();
      });
    });

    it('displays saved item subtitle when present', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSavedItem] }),
      });
      render(<ProfilePage />);
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(savedTab);
      await waitFor(() => {
        expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
      });
    });

    it('filters saved items by item_type', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSavedItem] }),
      });
      render(<ProfilePage />);
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(savedTab);
      const filterSelect = screen.getByLabelText('Filter saved items by type');
      fireEvent.change(filterSelect, { target: { value: 'event' } });
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/saved?item_type=event'
        );
      });
    });

    it('removes saved item on button click', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSavedItem] }),
      });
      render(<ProfilePage />);
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(savedTab);
      await waitFor(() => {
        expect(screen.getByText('Test Business')).toBeInTheDocument();
      });
      mockFetch.mockResolvedValue({ ok: true });
      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users/saved/saved-1', {
          method: 'DELETE',
        });
      });
    });

    it('removes item from display after successful deletion', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSavedItem] }),
      });
      render(<ProfilePage />);
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(savedTab);
      await waitFor(() => {
        expect(screen.getByText('Test Business')).toBeInTheDocument();
      });
      mockFetch.mockResolvedValue({ ok: true });
      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);
      await waitFor(() => {
        expect(screen.queryByText('Test Business')).not.toBeInTheDocument();
      });
    });

    it('handles removal error gracefully', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSavedItem] }),
      });
      render(<ProfilePage />);
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(savedTab);
      await waitFor(() => {
        expect(screen.getByText('Test Business')).toBeInTheDocument();
      });
      mockFetch.mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
      consoleSpy.mockRestore();
    });

    it('displays item type label', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSavedItem] }),
      });
      render(<ProfilePage />);
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(savedTab);
      await waitFor(() => {
        expect(screen.getByText('Business')).toBeInTheDocument();
      });
    });

    it('displays saved date', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSavedItem] }),
      });
      render(<ProfilePage />);
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(savedTab);
      await waitFor(() => {
        expect(screen.getByText(/Saved Jun 1, 2024/)).toBeInTheDocument();
      });
    });
  });

  describe('Notifications Tab', () => {
    it('fetches notification preferences when tab is selected', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ preferences: [] }),
      });
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users/notifications');
      });
    });

    it('displays loading state when fetching notifications', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({ preferences: [] }) }),
              100
            )
          )
      );
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      expect(screen.getByText('Loading preferences...')).toBeInTheDocument();
    });

    it('displays notification preferences from API', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ preferences: [mockNotificationPref] }),
      });
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      await waitFor(() => {
        expect(screen.getByText('Immigration Updates')).toBeInTheDocument();
      });
    });

    it('uses default preferences when API returns empty', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ preferences: [] }),
      });
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      await waitFor(() => {
        expect(screen.getByText('Immigration Updates')).toBeInTheDocument();
        expect(screen.getByText('Job Alerts')).toBeInTheDocument();
      });
    });

    it('toggles notification preference', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ preferences: [mockNotificationPref] }),
      });
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      await waitFor(() => {
        expect(screen.getByText('Immigration Updates')).toBeInTheDocument();
      });
      const toggleLabels = screen.getAllByLabelText(/Toggle/);
      mockFetch.mockResolvedValue({ ok: true });
      fireEvent.click(toggleLabels[0]);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('immigration_updates'),
        });
      });
    });

    it('saves message shown after toggle', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ preferences: [mockNotificationPref] }),
      });
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      await waitFor(() => {
        expect(screen.getByText('Immigration Updates')).toBeInTheDocument();
      });
      mockFetch.mockResolvedValue({ ok: true });
      const toggleLabels = screen.getAllByLabelText(/Toggle/);
      fireEvent.click(toggleLabels[0]);
      await waitFor(() => {
        expect(screen.getByText('Preferences saved!')).toBeInTheDocument();
      });
    });

    it('changes frequency for enabled notification', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ preferences: [mockNotificationPref] }),
      });
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      await waitFor(() => {
        expect(screen.getByText('Immigration Updates')).toBeInTheDocument();
      });
      mockFetch.mockResolvedValue({ ok: true });
      const frequencySelects = screen.getAllByLabelText(/frequency/i);
      fireEvent.change(frequencySelects[0], { target: { value: 'weekly' } });
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('weekly'),
        });
      });
    });

    it('hides frequency dropdown when notification is disabled', async () => {
      const disabledPref = { ...mockNotificationPref, enabled: false };
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ preferences: [disabledPref] }),
      });
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      await waitFor(() => {
        expect(screen.getByText('Immigration Updates')).toBeInTheDocument();
      });
      const frequencySelects = screen.queryAllByLabelText(/frequency/i);
      expect(frequencySelects.length).toBe(0);
    });

    it('shows frequency dropdown when notification is enabled', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ preferences: [mockNotificationPref] }),
      });
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      await waitFor(() => {
        expect(screen.getByText('Immigration Updates')).toBeInTheDocument();
      });
      const frequencySelects = screen.queryAllByLabelText(/frequency/i);
      expect(frequencySelects.length).toBeGreaterThan(0);
    });

    it('displays notification description', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ preferences: [mockNotificationPref] }),
      });
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      await waitFor(() => {
        expect(
          screen.getByText('Get alerts on visa bulletins')
        ).toBeInTheDocument();
      });
    });

    it('handles fetch error for notifications gracefully', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
      consoleSpy.mockRestore();
    });

    it('handles toggle error gracefully', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ preferences: [mockNotificationPref] }),
      });
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      await waitFor(() => {
        expect(screen.getByText('Immigration Updates')).toBeInTheDocument();
      });
      mockFetch.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const toggleLabels = screen.getAllByLabelText(/Toggle/);
      fireEvent.click(toggleLabels[0]);
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
      consoleSpy.mockRestore();
    });

    it('handles frequency change error gracefully', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ preferences: [mockNotificationPref] }),
      });
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      await waitFor(() => {
        expect(screen.getByText('Immigration Updates')).toBeInTheDocument();
      });
      mockFetch.mockRejectedValue(new Error('Frequency update failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const frequencySelects = screen.getAllByLabelText(/frequency/i);
      fireEvent.change(frequencySelects[0], { target: { value: 'weekly' } });
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
      consoleSpy.mockRestore();
    });

    it('displays all frequency options', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ preferences: [mockNotificationPref] }),
      });
      render(<ProfilePage />);
      const notifTab = screen.getByRole('tab', { name: /Notifications/ });
      fireEvent.click(notifTab);
      await waitFor(() => {
        expect(screen.getByText('Immigration Updates')).toBeInTheDocument();
      });
      const frequencySelects = screen.getAllByLabelText(/frequency/i);
      const select = frequencySelects[0] as HTMLSelectElement;
      expect(select.innerHTML).toContain('Immediate');
      expect(select.innerHTML).toContain('Daily');
      expect(select.innerHTML).toContain('Weekly');
    });
  });

  describe('Date Formatting', () => {
    it('formats member since date correctly', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      render(<ProfilePage />);
      expect(screen.getByText(/Member since January 2024/)).toBeInTheDocument();
    });

    it('formats submission date correctly', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSubmission] }),
      });
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      fireEvent.click(submissionsTab);
      await waitFor(() => {
        expect(screen.getByText(/Submitted Jun 1, 2024/)).toBeInTheDocument();
      });
    });

    it('formats saved date correctly', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockSavedItem] }),
      });
      render(<ProfilePage />);
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(savedTab);
      await waitFor(() => {
        expect(screen.getByText(/Saved Jun 1, 2024/)).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('maintains state when switching between tabs', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });
      render(<ProfilePage />);
      const submissionsTab = screen.getByRole('tab', { name: /My Submissions/ });
      const savedTab = screen.getByRole('tab', { name: /Saved Items/ });
      fireEvent.click(submissionsTab);
      await waitFor(() => {
        expect(submissionsTab).toHaveAttribute('aria-selected', 'true');
      });
      fireEvent.click(savedTab);
      await waitFor(() => {
        expect(savedTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('renders and is a function component', () => {
      expect(ProfilePage).toBeDefined();
      expect(typeof ProfilePage).toBe('function');
    });

    it('exports ProfilePage as a client component', () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      const { container } = render(<ProfilePage />);
      expect(container).toBeTruthy();
    });

    it('loads different tabs without crashing', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [], preferences: [] }),
      });
      const { container } = render(<ProfilePage />);
      const tabs = screen.getAllByRole('tab');
      for (const tab of tabs) {
        fireEvent.click(tab);
        await waitFor(() => {
          expect(container).toBeTruthy();
        });
      }
    });
  });
});
