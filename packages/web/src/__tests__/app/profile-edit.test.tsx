import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EditProfilePage from '@/app/profile/edit/page';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a data-href={href} href={href}>{children}</a>
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

// Mock AuthContext
const mockRefreshUser = jest.fn();
const mockUseAuth = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock AuthGuard - render children directly
jest.mock('@/components/auth/AuthGuard', () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockUser = {
  display_name: 'Test User',
  email: 'test@example.com',
  phone_number: '+1234567890',
  avatar_url: 'https://example.com/avatar.jpg',
  city: 'Bay Area, CA',
  state: 'California',
  preferred_channel: 'web',
  identity_linked: true,
  auth_provider: 'google',
};

describe('EditProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockRefreshUser.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: mockUser,
      refreshUser: mockRefreshUser,
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    test('renders page with correct title', () => {
      render(<EditProfilePage />);
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    test('renders back link to profile page', () => {
      render(<EditProfilePage />);
      const backLink = screen.getByText(/Back to Profile/i);
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/profile');
    });

    test('renders all form sections', () => {
      render(<EditProfilePage />);
      expect(screen.getByText('Profile Photo')).toBeInTheDocument();
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Preferences')).toBeInTheDocument();
    });

    test('renders profile photo section with image', () => {
      render(<EditProfilePage />);
      const profileImage = screen.getByAltText('Test User');
      expect(profileImage).toBeInTheDocument();
      expect(profileImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    test('renders form inputs', () => {
      render(<EditProfilePage />);
      expect(document.querySelector('input[name="display_name"]')).toBeInTheDocument();
      expect(document.querySelector('input[type="email"]')).toBeInTheDocument();
      expect(document.querySelector('input[type="tel"]')).toBeInTheDocument();
      expect(document.querySelector('select[name="city"]')).toBeInTheDocument();
      expect(document.querySelector('select[name="state"]')).toBeInTheDocument();
      expect(document.querySelector('select[name="preferred_channel"]')).toBeInTheDocument();
    });

    test('renders submit and cancel buttons', () => {
      render(<EditProfilePage />);
      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  describe('Form Pre-population', () => {
    test('pre-populates display name from user', () => {
      render(<EditProfilePage />);
      const displayNameInput = document.querySelector('input[name="display_name"]') as HTMLInputElement;
      expect(displayNameInput.value).toBe('Test User');
    });

    test('pre-populates city from user', () => {
      render(<EditProfilePage />);
      expect(screen.getByDisplayValue('Bay Area, CA')).toBeInTheDocument();
    });

    test('pre-populates state from user', () => {
      render(<EditProfilePage />);
      expect(screen.getByDisplayValue('California')).toBeInTheDocument();
    });

    test('pre-populates preferred channel from user', () => {
      render(<EditProfilePage />);
      expect(screen.getByDisplayValue('Website Only')).toBeInTheDocument();
    });

    test('displays user email in disabled field', () => {
      render(<EditProfilePage />);
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      expect(emailInput.value).toBe('test@example.com');
      expect(emailInput.disabled).toBe(true);
    });

    test('displays user phone number in disabled field', () => {
      render(<EditProfilePage />);
      const phoneInput = document.querySelector('input[type="tel"]') as HTMLInputElement;
      expect(phoneInput.value).toBe('+1234567890');
      expect(phoneInput.disabled).toBe(true);
    });
  });

  describe('Avatar Display', () => {
    test('shows user avatar when available', () => {
      render(<EditProfilePage />);
      const avatar = screen.getByAltText('Test User');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    test('shows initial when avatar is not available', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, avatar_url: null },
        refreshUser: mockRefreshUser,
      });
      render(<EditProfilePage />);
      const initialsDiv = document.querySelector('.rounded-full.bg-orange-500');
      expect(initialsDiv).toBeInTheDocument();
      expect(initialsDiv).toHaveTextContent('T');
    });

    test('shows default initial "U" when user has no avatar and no display name', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, avatar_url: null, display_name: '' },
        refreshUser: mockRefreshUser,
      });
      render(<EditProfilePage />);
      const initialsDiv = document.querySelector('.rounded-full.bg-orange-500');
      expect(initialsDiv).toHaveTextContent('U');
    });
  });

  describe('Disabled Fields', () => {
    test('email field is disabled', () => {
      render(<EditProfilePage />);
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      expect(emailInput.disabled).toBe(true);
    });

    test('phone field is disabled', () => {
      render(<EditProfilePage />);
      const phoneInput = document.querySelector('input[type="tel"]') as HTMLInputElement;
      expect(phoneInput.disabled).toBe(true);
    });

    test('email field shows managed through login provider message', () => {
      render(<EditProfilePage />);
      expect(screen.getByText(/Email is managed through your login provider/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('shows validation error for empty display name', async () => {
      render(<EditProfilePage />);
      const displayNameInput = document.querySelector('input[name="display_name"]') as HTMLInputElement;
      const form = document.querySelector('form') as HTMLFormElement;

      await act(async () => {
        fireEvent.change(displayNameInput, { target: { value: '' } });
        // Use fireEvent.submit to bypass HTML5 native validation in jsdom
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(screen.getByText('Display name is required')).toBeInTheDocument();
      });
    });

    test('shows validation error for display name less than 2 characters', async () => {
      render(<EditProfilePage />);
      const displayNameInput = document.querySelector('input[name="display_name"]') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.change(displayNameInput, { target: { value: 'A' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Display name must be at least 2 characters')).toBeInTheDocument();
      });
    });

    test('shows validation error for display name with only whitespace', async () => {
      render(<EditProfilePage />);
      const displayNameInput = document.querySelector('input[name="display_name"]') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.change(displayNameInput, { target: { value: '   ' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Display name is required')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Submission', () => {
    test('calls PUT /api/users/profile with correct body on successful submission', async () => {
      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/profile',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              display_name: 'Test User',
              city: 'Bay Area, CA',
              state: 'California',
              preferred_channel: 'web',
            }),
          })
        );
      });
    });

    test('calls refreshUser after successful submission', async () => {
      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockRefreshUser).toHaveBeenCalled();
      });
    });

    test('shows success message on successful submission', async () => {
      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
      });
    });

    test('redirects to /profile after successful submission', async () => {
      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
      });

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/profile');
      });
    });
  });

  describe('Failed Submission', () => {
    test('shows error message from API response on failed submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Profile update failed' }),
      });

      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Profile update failed')).toBeInTheDocument();
      });
    });

    test('shows generic error message when API returns non-JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
      });
    });

    test('does not call refreshUser on failed submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Profile update failed' }),
      });

      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Profile update failed')).toBeInTheDocument();
      });

      expect(mockRefreshUser).not.toHaveBeenCalled();
    });

    test('does not redirect on failed submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Profile update failed' }),
      });

      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Profile update failed')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Submit Button States', () => {
    test('shows "Saving..." text when submitting', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));
      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Saving/i })).toBeInTheDocument();
      });
    });

    test('disables submit button during submission', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));
      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i }) as HTMLButtonElement;

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(submitButton.disabled).toBe(true);
      });
    });

    test('re-enables submit button after submission completes', async () => {
      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i }) as HTMLButtonElement;

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(submitButton.disabled).toBe(false);
      });
    });
  });

  describe('Location Dropdowns', () => {
    test('metro area dropdown contains Bay Area, CA', () => {
      render(<EditProfilePage />);
      const citySelect = document.querySelector('select[name="city"]') as HTMLSelectElement;
      const options = Array.from(citySelect.options).map(opt => opt.value);
      expect(options).toContain('Bay Area, CA');
    });

    test('metro area dropdown contains Dallas-Fort Worth, TX', () => {
      render(<EditProfilePage />);
      const citySelect = document.querySelector('select[name="city"]') as HTMLSelectElement;
      const options = Array.from(citySelect.options).map(opt => opt.value);
      expect(options).toContain('Dallas-Fort Worth, TX');
    });

    test('metro area dropdown contains all 20 metro areas', () => {
      render(<EditProfilePage />);
      const citySelect = document.querySelector('select[name="city"]') as HTMLSelectElement;
      const options = Array.from(citySelect.options).map(opt => opt.value).filter(v => v);
      expect(options.length).toBe(20);
    });

    test('state dropdown contains California', () => {
      render(<EditProfilePage />);
      const stateSelect = document.querySelector('select[name="state"]') as HTMLSelectElement;
      const options = Array.from(stateSelect.options).map(opt => opt.value);
      expect(options).toContain('California');
    });

    test('state dropdown contains Texas', () => {
      render(<EditProfilePage />);
      const stateSelect = document.querySelector('select[name="state"]') as HTMLSelectElement;
      const options = Array.from(stateSelect.options).map(opt => opt.value);
      expect(options).toContain('Texas');
    });

    test('state dropdown contains all 50 US states', () => {
      render(<EditProfilePage />);
      const stateSelect = document.querySelector('select[name="state"]') as HTMLSelectElement;
      const options = Array.from(stateSelect.options).map(opt => opt.value).filter(v => v);
      expect(options.length).toBe(50);
    });

    test('can change metro area selection', async () => {
      render(<EditProfilePage />);
      const citySelect = document.querySelector('select[name="city"]') as HTMLSelectElement;

      await act(async () => {
        fireEvent.change(citySelect, { target: { value: 'New York, NY' } });
      });

      expect(citySelect.value).toBe('New York, NY');
    });

    test('can change state selection', async () => {
      render(<EditProfilePage />);
      const stateSelect = document.querySelector('select[name="state"]') as HTMLSelectElement;

      await act(async () => {
        fireEvent.change(stateSelect, { target: { value: 'Texas' } });
      });

      expect(stateSelect.value).toBe('Texas');
    });
  });

  describe('Preferred Channel Options', () => {
    test('preferred channel dropdown contains "Website Only" option', () => {
      render(<EditProfilePage />);
      const channelSelect = document.querySelector('select[name="preferred_channel"]') as HTMLSelectElement;
      const options = Array.from(channelSelect.options).map(opt => opt.textContent);
      expect(options).toContain('Website Only');
    });

    test('preferred channel dropdown contains "WhatsApp Only" option', () => {
      render(<EditProfilePage />);
      const channelSelect = document.querySelector('select[name="preferred_channel"]') as HTMLSelectElement;
      const options = Array.from(channelSelect.options).map(opt => opt.textContent);
      expect(options).toContain('WhatsApp Only');
    });

    test('preferred channel dropdown contains "Both Website & WhatsApp" option', () => {
      render(<EditProfilePage />);
      const channelSelect = document.querySelector('select[name="preferred_channel"]') as HTMLSelectElement;
      const options = Array.from(channelSelect.options).map(opt => opt.textContent);
      expect(options).toContain('Both Website & WhatsApp');
    });

    test('can change preferred channel selection', async () => {
      render(<EditProfilePage />);
      const channelSelect = document.querySelector('select[name="preferred_channel"]') as HTMLSelectElement;

      await act(async () => {
        fireEvent.change(channelSelect, { target: { value: 'whatsapp' } });
      });

      expect(channelSelect.value).toBe('whatsapp');
    });

    test('submits correct value for whatsapp channel', async () => {
      render(<EditProfilePage />);
      const channelSelect = document.querySelector('select[name="preferred_channel"]') as HTMLSelectElement;
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.change(channelSelect, { target: { value: 'whatsapp' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/profile',
          expect.objectContaining({
            body: JSON.stringify({
              display_name: 'Test User',
              city: 'Bay Area, CA',
              state: 'California',
              preferred_channel: 'whatsapp',
            }),
          })
        );
      });
    });

    test('submits correct value for both channel', async () => {
      render(<EditProfilePage />);
      const channelSelect = document.querySelector('select[name="preferred_channel"]') as HTMLSelectElement;
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.change(channelSelect, { target: { value: 'both' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/profile',
          expect.objectContaining({
            body: JSON.stringify({
              display_name: 'Test User',
              city: 'Bay Area, CA',
              state: 'California',
              preferred_channel: 'both',
            }),
          })
        );
      });
    });
  });

  describe('Back to Profile Link', () => {
    test('back to profile link navigates to /profile', () => {
      render(<EditProfilePage />);
      const backLink = screen.getByText(/Back to Profile/i).closest('a');
      expect(backLink).toHaveAttribute('href', '/profile');
    });
  });

  describe('Cancel Button', () => {
    test('cancel button links to /profile', () => {
      render(<EditProfilePage />);
      const cancelLink = screen.getByRole('link', { name: /Cancel/i });
      expect(cancelLink).toHaveAttribute('href', '/profile');
    });

    test('cancel button does not submit form', async () => {
      render(<EditProfilePage />);
      const cancelLink = screen.getByRole('link', { name: /Cancel/i });

      fireEvent.click(cancelLink);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Link Identity Hint', () => {
    test('shows link identity hint when identity not linked', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, identity_linked: false },
        refreshUser: mockRefreshUser,
      });
      render(<EditProfilePage />);
      expect(screen.getByText(/Link your WhatsApp number/i)).toBeInTheDocument();
    });

    test('does not show link identity hint when identity is linked', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, identity_linked: true },
        refreshUser: mockRefreshUser,
      });
      render(<EditProfilePage />);
      expect(screen.queryByText(/Link your WhatsApp number/i)).not.toBeInTheDocument();
    });

    test('link identity hint link navigates to /auth/link-identity', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, identity_linked: false },
        refreshUser: mockRefreshUser,
      });
      render(<EditProfilePage />);
      const linkIdentityLink = screen.getByText(/Link your WhatsApp number/i).closest('a');
      expect(linkIdentityLink).toHaveAttribute('href', '/auth/link-identity');
    });
  });

  describe('Form Input Interactions', () => {
    test('updates form state when display name changes', async () => {
      render(<EditProfilePage />);
      const displayNameInput = document.querySelector('input[name="display_name"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(displayNameInput, { target: { value: 'New Name' } });
      });

      expect(displayNameInput.value).toBe('New Name');
    });

    test('clears error message when user modifies form after validation error', async () => {
      render(<EditProfilePage />);
      const displayNameInput = document.querySelector('input[name="display_name"]') as HTMLInputElement;
      const form = document.querySelector('form') as HTMLFormElement;

      await act(async () => {
        fireEvent.change(displayNameInput, { target: { value: '' } });
        // Use fireEvent.submit to bypass HTML5 native validation in jsdom
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(screen.getByText('Display name is required')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(displayNameInput, { target: { value: 'Valid Name' } });
      });

      // Error message should still be visible until next submission
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
    });

    test('sends updated form data with changed display name', async () => {
      render(<EditProfilePage />);
      const displayNameInput = document.querySelector('input[name="display_name"]') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/profile',
          expect.objectContaining({
            body: JSON.stringify({
              display_name: 'Updated Name',
              city: 'Bay Area, CA',
              state: 'California',
              preferred_channel: 'web',
            }),
          })
        );
      });
    });

    test('sends updated form data with changed city', async () => {
      render(<EditProfilePage />);
      const citySelect = document.querySelector('select[name="city"]') as HTMLSelectElement;
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.change(citySelect, { target: { value: 'Seattle, WA' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/profile',
          expect.objectContaining({
            body: JSON.stringify({
              display_name: 'Test User',
              city: 'Seattle, WA',
              state: 'California',
              preferred_channel: 'web',
            }),
          })
        );
      });
    });

    test('sends updated form data with changed state', async () => {
      render(<EditProfilePage />);
      const stateSelect = document.querySelector('select[name="state"]') as HTMLSelectElement;
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.change(stateSelect, { target: { value: 'Texas' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/profile',
          expect.objectContaining({
            body: JSON.stringify({
              display_name: 'Test User',
              city: 'Bay Area, CA',
              state: 'Texas',
              preferred_channel: 'web',
            }),
          })
        );
      });
    });
  });

  describe('Auth Provider Display', () => {
    test('displays auth provider in avatar section', () => {
      render(<EditProfilePage />);
      expect(screen.getByText(/synced from your login provider.*google/i)).toBeInTheDocument();
    });

    test('formats auth provider name by replacing underscores with spaces', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, auth_provider: 'google_oauth' },
        refreshUser: mockRefreshUser,
      });
      render(<EditProfilePage />);
      expect(screen.getByText(/google oauth/i)).toBeInTheDocument();
    });

    test('shows default "Google" when auth provider is not set', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, auth_provider: undefined },
        refreshUser: mockRefreshUser,
      });
      render(<EditProfilePage />);
      expect(screen.getByText(/Google/i)).toBeInTheDocument();
    });
  });

  describe('Network Error Handling', () => {
    test('handles fetch network error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('displays error message when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Connection refused')).toBeInTheDocument();
      });
    });
  });

  describe('Success Message Styling', () => {
    test('success message has correct styling classes', async () => {
      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        const successMsg = screen.getByText(/Profile updated successfully/i);
        expect(successMsg.closest('div')).toHaveClass('bg-green-50');
        expect(successMsg.closest('div')).toHaveClass('border-green-200');
      });
    });
  });

  describe('Error Message Styling', () => {
    test('error message has correct styling classes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error' }),
      });

      render(<EditProfilePage />);
      const submitButton = screen.getByRole('button', { name: /Save Changes/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        const errorMsg = screen.getByText('Test error');
        expect(errorMsg.closest('div')).toHaveClass('bg-red-50');
        expect(errorMsg.closest('div')).toHaveClass('border-red-200');
      });
    });
  });
});
