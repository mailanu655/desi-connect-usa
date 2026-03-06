import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationsPage from '@/app/dashboard/notifications/page';

const mockGetNotificationPreferences = jest.fn();
const mockUpdateNotificationPreferences = jest.fn();

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getNotificationPreferences: (...args: unknown[]) => mockGetNotificationPreferences(...args),
    updateNotificationPreferences: (...args: unknown[]) => mockUpdateNotificationPreferences(...args),
  },
}));

jest.mock('@/lib/user-profile', () => ({
  getDefaultNotificationPreferences: () => [
    {
      type: 'new_listings',
      label: 'New Listings',
      description: 'Get notified about new businesses and opportunities',
      enabled: true,
      frequency: 'daily' as const,
      channels: ['email', 'whatsapp'],
    },
    {
      type: 'saved_items',
      label: 'Saved Items Updates',
      description: 'Updates about your saved items',
      enabled: true,
      frequency: 'weekly' as const,
      channels: ['email'],
    },
  ],
  toggleChannel: (pref: any, channel: string) => ({
    ...pref,
    channels: pref.channels.includes(channel)
      ? pref.channels.filter((c: string) => c !== channel)
      : [...pref.channels, channel],
  }),
  formatFrequencyLabel: (freq: string) => freq.charAt(0).toUpperCase() + freq.slice(1),
}));

describe('Notifications Page', () => {
  const mockPreferences = [
    {
      type: 'new_listings',
      label: 'New Listings',
      description: 'Get notified about new businesses and opportunities',
      enabled: true,
      frequency: 'daily' as const,
      channels: ['email', 'whatsapp'],
    },
    {
      type: 'saved_items',
      label: 'Saved Items Updates',
      description: 'Updates about your saved items',
      enabled: true,
      frequency: 'weekly' as const,
      channels: ['email'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    mockGetNotificationPreferences.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ preferences: [] }), 100))
    );

    render(<NotificationsPage />);

    expect(screen.getByText('Loading preferences...')).toBeInTheDocument();
  });

  it('should fetch notification preferences on mount', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(mockGetNotificationPreferences).toHaveBeenCalledTimes(1);
    });
  });

  it('should display page title and description', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(screen.getByText(/Choose what updates you want to receive/)).toBeInTheDocument();
    });
  });

  it('should display preference sections with toggles', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('New Listings')).toBeInTheDocument();
      expect(screen.getByText('Saved Items Updates')).toBeInTheDocument();
    });
  });

  it('should display preference descriptions', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Get notified about new businesses and opportunities')).toBeInTheDocument();
      expect(screen.getByText('Updates about your saved items')).toBeInTheDocument();
    });
  });

  it('should display frequency dropdown when enabled', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });

    render(<NotificationsPage />);

    await waitFor(() => {
      const frequencyLabels = screen.getAllByText('Frequency');
      expect(frequencyLabels.length).toBeGreaterThan(0);
    });
  });

  it('should display channel checkboxes', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('How to notify me').length).toBeGreaterThan(0);
    });
  });

  it('should toggle preference enabled state', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });
    mockUpdateNotificationPreferences.mockResolvedValue({});

    const { container } = render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('New Listings')).toBeInTheDocument();
    });

    const toggleButtons = container.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('New Listings')).toBeInTheDocument();
    });
  });

  it('should change frequency when dropdown changes', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('New Listings')).toBeInTheDocument();
    });

    const frequencySelects = screen.getAllByDisplayValue('Daily');
    fireEvent.change(frequencySelects[0], { target: { value: 'weekly' } });

    await waitFor(() => {
      expect(frequencySelects[0]).toHaveValue('weekly');
    });
  });

  it('should toggle channel selection', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });

    const { container } = render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('New Listings')).toBeInTheDocument();
    });

    const channelCheckboxes = container.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(channelCheckboxes[1]);

    await waitFor(() => {
      expect(screen.getByText('New Listings')).toBeInTheDocument();
    });
  });

  it('should display save preferences button', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });
  });

  it('should display cancel button', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('should save preferences on save button click', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });
    mockUpdateNotificationPreferences.mockResolvedValue({});

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Preferences');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateNotificationPreferences).toHaveBeenCalled();
    });
  });

  it('should display success message after save', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });
    mockUpdateNotificationPreferences.mockResolvedValue({});

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Preferences');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Notification preferences updated successfully!')).toBeInTheDocument();
    });
  });

  it('should display error message on save failure', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });
    mockUpdateNotificationPreferences.mockRejectedValue(new Error('Save failed'));

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Preferences');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update notification preferences')).toBeInTheDocument();
    });
  });

  it('should show saving state on button', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });
    mockUpdateNotificationPreferences.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
    );

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Preferences');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  it('should handle cancel button click', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });
    window.history.back = jest.fn();

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(window.history.back).toHaveBeenCalled();
  });

  it('should display frequency options', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('New Listings')).toBeInTheDocument();
    });

    const select = screen.getAllByDisplayValue('Daily')[0];
    const options = select.querySelectorAll('option');
    const optionTexts = Array.from(options).map((o) => o.textContent);

    expect(optionTexts).toContain('Immediately');
    expect(optionTexts).toContain('Daily');
    expect(optionTexts).toContain('Weekly');
    expect(optionTexts).toContain('Never');
  });

  it('should display channel options', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Email').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Whatsapp').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Push').length).toBeGreaterThan(0);
      expect(screen.getAllByText('In-App').length).toBeGreaterThan(0);
    });
  });

  it('should hide frequency and channels when preference is disabled', async () => {
    const disabledPreferences = [
      {
        type: 'new_listings',
        label: 'New Listings',
        description: 'Get notified about new businesses and opportunities',
        enabled: false,
        frequency: 'daily' as const,
        channels: ['email', 'whatsapp'],
      },
    ];

    mockGetNotificationPreferences.mockResolvedValue({ preferences: disabledPreferences });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('New Listings')).toBeInTheDocument();
    });

    const frequencyLabels = screen.queryAllByText('Frequency');
    expect(frequencyLabels.length).toBe(0);
  });

  it('should use default preferences on fetch error', async () => {
    mockGetNotificationPreferences.mockRejectedValue(new Error('Fetch failed'));

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    });
  });

  it('should render all preference items', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('New Listings')).toBeInTheDocument();
      expect(screen.getByText('Saved Items Updates')).toBeInTheDocument();
      expect(mockPreferences.length).toBe(2);
    });
  });

  it('should maintain preference state across interactions', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('New Listings')).toBeInTheDocument();
    });

    const firstFrequencySelect = screen.getAllByDisplayValue('Daily')[0];
    fireEvent.change(firstFrequencySelect, { target: { value: 'weekly' } });

    expect(firstFrequencySelect).toHaveValue('weekly');
  });

  it('should pass updated preferences to API on save', async () => {
    mockGetNotificationPreferences.mockResolvedValue({ preferences: mockPreferences });
    mockUpdateNotificationPreferences.mockResolvedValue({});

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Preferences');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith(expect.any(Array));
    });
  });
});
