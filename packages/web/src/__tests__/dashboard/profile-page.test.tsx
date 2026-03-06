import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ProfileSettingsPage from '@/app/dashboard/profile/page';

const mockGetUserProfile = jest.fn();
const mockUpdateUserProfile = jest.fn();

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
    updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
  },
}));

jest.mock('@/lib/user-profile', () => ({
  getProfileCompletionPercentage: jest.fn((user) => 75),
  formatUserDisplayName: jest.fn((user) => user?.display_name || 'User'),
}));

describe('Profile Settings Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.back = jest.fn();
  });

  it('should display loading state initially', () => {
    mockGetUserProfile.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
    );

    render(<ProfileSettingsPage />);

    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('should fetch user profile on mount', async () => {
    const mockUser = {
      display_name: 'John Doe',
      email: 'john@example.com',
      phone_number: '555-1234',
      city: 'San Francisco',
      state: 'CA',
      preferred_channel: 'both' as const,
      identity_linked: false,
    };

    mockGetUserProfile.mockResolvedValue(mockUser);

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalledTimes(1);
    });
  });

  it('should populate form fields with user data', async () => {
    const mockUser = {
      display_name: 'John Doe',
      email: 'john@example.com',
      phone_number: '555-1234',
      city: 'San Francisco',
      state: 'CA',
      preferred_channel: 'both' as const,
      identity_linked: false,
    };

    mockGetUserProfile.mockResolvedValue(mockUser);

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      const displayNameInput = screen.getByDisplayValue('John Doe') as HTMLInputElement;
      expect(displayNameInput.value).toBe('John Doe');
    });
  });

  it('should display profile completion percentage', async () => {
    mockGetUserProfile.mockResolvedValue({
      display_name: 'John Doe',
      email: 'john@example.com',
    });

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Profile Completion')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  it('should display profile completion progress bar', async () => {
    mockGetUserProfile.mockResolvedValue({
      display_name: 'John Doe',
      email: 'john@example.com',
    });

    const { container } = render(<ProfileSettingsPage />);

    await waitFor(() => {
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  it('should render all form fields', async () => {
    mockGetUserProfile.mockResolvedValue({
      display_name: 'John Doe',
      email: 'john@example.com',
      phone_number: '555-1234',
      city: 'San Francisco',
      state: 'CA',
      preferred_channel: 'both',
      identity_linked: false,
    });

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
      expect(screen.getByLabelText('City')).toBeInTheDocument();
      expect(screen.getByLabelText('State')).toBeInTheDocument();
    });
  });

  it('should disable email field', async () => {
    mockGetUserProfile.mockResolvedValue({
      display_name: 'John Doe',
      email: 'john@example.com',
      phone_number: '555-1234',
      city: 'San Francisco',
      state: 'CA',
      preferred_channel: 'both',
      identity_linked: false,
    });

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      const emailInput = screen.getByDisplayValue('john@example.com') as HTMLInputElement;
      expect(emailInput).toBeDisabled();
    });
  });

  it('should handle form submission', async () => {
    const mockUser = {
      display_name: 'John Doe',
      email: 'john@example.com',
      phone_number: '555-1234',
      city: 'San Francisco',
      state: 'CA',
      preferred_channel: 'both' as const,
      identity_linked: false,
    };

    mockGetUserProfile.mockResolvedValue(mockUser);
    mockUpdateUserProfile.mockResolvedValue(mockUser);

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalled();
    });
  });

  it('should display success message after saving', async () => {
    mockGetUserProfile.mockResolvedValue({
      display_name: 'John Doe',
      email: 'john@example.com',
    });
    mockUpdateUserProfile.mockResolvedValue({});

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });
  });

  it('should display error message on update failure', async () => {
    mockGetUserProfile.mockResolvedValue({
      display_name: 'John Doe',
      email: 'john@example.com',
    });
    mockUpdateUserProfile.mockRejectedValue(new Error('Update failed'));

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(screen.getByText(/Failed to update profile/)).toBeInTheDocument();
    });
  });

  it('should handle form field changes', async () => {
    mockGetUserProfile.mockResolvedValue({
      display_name: 'John Doe',
      email: 'john@example.com',
      phone_number: '555-1234',
      city: 'San Francisco',
      state: 'CA',
      preferred_channel: 'both',
      identity_linked: false,
    });

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      const displayNameInput = screen.getByDisplayValue('John Doe') as HTMLInputElement;
      expect(displayNameInput).toBeInTheDocument();
    });

    const cityInput = screen.getByDisplayValue('San Francisco') as HTMLInputElement;
    fireEvent.change(cityInput, { target: { value: 'New York' } });

    expect(cityInput.value).toBe('New York');
  });

  it('should display state dropdown', async () => {
    mockGetUserProfile.mockResolvedValue({
      display_name: 'John Doe',
      email: 'john@example.com',
      state: 'CA',
      preferred_channel: 'both',
      identity_linked: false,
    });

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      const stateSelect = screen.getByLabelText('State');
      expect(stateSelect).toBeInTheDocument();
      expect(stateSelect).toHaveValue('CA');
    });
  });

  it('should display preferred channel radio buttons', async () => {
    mockGetUserProfile.mockResolvedValue({
      display_name: 'John Doe',
      email: 'john@example.com',
      preferred_channel: 'both',
      identity_linked: false,
    });

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Preferred Communication Channel/)).toBeInTheDocument();
      expect(screen.getByText('WhatsApp Only')).toBeInTheDocument();
      expect(screen.getByText('Web Only')).toBeInTheDocument();
      expect(screen.getByText('Both WhatsApp & Web')).toBeInTheDocument();
    });
  });

  it('should display identity linking section', async () => {
    mockGetUserProfile.mockResolvedValue({
      display_name: 'John Doe',
      email: 'john@example.com',
      identity_linked: false,
    });

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Identity Linking')).toBeInTheDocument();
      expect(screen.getByText('Link WhatsApp Account')).toBeInTheDocument();
    });
  });

  it('should show linked status when identity is linked', async () => {
    mockGetUserProfile.mockResolvedValue({
      display_name: 'John Doe',
      email: 'john@example.com',
      identity_linked: true,
    });

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('✓ Identity Linked')).toBeInTheDocument();
    });
  });

  it('should display cancel button', async () => {
    mockGetUserProfile.mockResolvedValue({
      display_name: 'John Doe',
      email: 'john@example.com',
    });

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('should handle cancel button click', async () => {
    mockGetUserProfile.mockResolvedValue({
      display_name: 'John Doe',
      email: 'john@example.com',
    });

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel'));

    expect(window.history.back).toHaveBeenCalled();
  });

  it('should show saving state on button', async () => {
    mockGetUserProfile.mockResolvedValue({
      display_name: 'John Doe',
      email: 'john@example.com',
    });
    mockUpdateUserProfile.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
    );

    render(<ProfileSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save Changes'));

    // During saving, button text should change
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).toBeInTheDocument();
    });
  });
});
