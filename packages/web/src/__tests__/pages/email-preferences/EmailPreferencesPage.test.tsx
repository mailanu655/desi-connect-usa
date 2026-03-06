import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailPreferencesPage from '@/app/email-preferences/page';
import { useSearchParams } from 'next/navigation';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a data-href={href} {...props}>{children}</a>;
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => new URLSearchParams('')),
}));

// Setup fetch mock
let mockFetchResponse: { ok: boolean; status: number; json: () => Promise<unknown> };

const mockSubscription = {
  subscription_id: 'sub-123',
  email: 'test@example.com',
  name: 'Test User',
  digest_types: ['community', 'immigration'] as const,
  frequency: 'weekly' as const,
  whatsapp_opted_in: false,
  whatsapp_number: '',
  is_verified: true,
  subscribed_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
};

describe('EmailPreferencesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    mockFetchResponse = {
      ok: true,
      status: 200,
      json: async () => ({ ...mockSubscription }),
    };
    global.fetch = jest.fn(() => Promise.resolve(mockFetchResponse)) as jest.Mock;
  });

  describe('page layout and header', () => {
    it('should render the page', () => {
      render(<EmailPreferencesPage />);
      expect(screen.getByTestId('email-preferences-page')).toBeInTheDocument();
    });

    it('should render the page header with title', () => {
      render(<EmailPreferencesPage />);
      const headings = screen.getAllByText('Email Preferences');
      const h1 = headings.find((el) => el.tagName === 'H1');
      expect(h1).toBeDefined();
    });

    it('should render page description', () => {
      render(<EmailPreferencesPage />);
      expect(screen.getByText(/Manage your newsletter subscriptions/)).toBeInTheDocument();
    });

    it('should render breadcrumb with Home link', () => {
      render(<EmailPreferencesPage />);
      const homeLink = screen.getByText('Home');
      expect(homeLink.getAttribute('data-href')).toBe('/');
    });
  });

  describe('email lookup form', () => {
    it('should show email lookup form initially', () => {
      render(<EmailPreferencesPage />);
      expect(screen.getByTestId('email-lookup-card')).toBeInTheDocument();
    });

    it('should render email input field', () => {
      render(<EmailPreferencesPage />);
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    });

    it('should render lookup button', () => {
      render(<EmailPreferencesPage />);
      expect(screen.getByText('Find My Subscription')).toBeInTheDocument();
    });

    it('should show error when submitting empty email', async () => {
      render(<EmailPreferencesPage />);
      fireEvent.click(screen.getByText('Find My Subscription'));
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter your email address.');
    });

    it('should show loading state during lookup', async () => {
      global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;
      render(<EmailPreferencesPage />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Find My Subscription'));
      expect(screen.getByText('Looking up...')).toBeInTheDocument();
    });

    it('should load subscription on successful lookup', async () => {
      render(<EmailPreferencesPage />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Find My Subscription'));
      await waitFor(() => {
        expect(screen.getByTestId('preferences-editor')).toBeInTheDocument();
      });
    });
  });

  describe('email query parameter', () => {
    it('should auto-load subscription when email param is present', async () => {
      (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?email=test@example.com'));
      render(<EmailPreferencesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('preferences-editor')).toBeInTheDocument();
      });
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/newsletter/subscription?email=test%40example.com'
      );
    });
  });

  describe('subscription not found', () => {
    it('should show not-found state when subscription doesnt exist', async () => {
      mockFetchResponse = { ok: false, status: 404, json: async () => ({ error: 'Not found' }) };
      render(<EmailPreferencesPage />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'noexist@example.com' } });
      fireEvent.click(screen.getByText('Find My Subscription'));
      await waitFor(() => {
        expect(screen.getByTestId('not-found-state')).toBeInTheDocument();
      });
    });

    it('should show Subscribe Now link when not found', async () => {
      mockFetchResponse = { ok: false, status: 404, json: async () => ({ error: 'Not found' }) };
      render(<EmailPreferencesPage />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'noexist@example.com' } });
      fireEvent.click(screen.getByText('Find My Subscription'));
      await waitFor(() => {
        const link = screen.getByText('Subscribe Now');
        expect(link.getAttribute('data-href')).toBe('/subscribe');
      });
    });

    it('should allow trying another email', async () => {
      mockFetchResponse = { ok: false, status: 404, json: async () => ({ error: 'Not found' }) };
      render(<EmailPreferencesPage />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'noexist@example.com' } });
      fireEvent.click(screen.getByText('Find My Subscription'));
      await waitFor(() => {
        expect(screen.getByTestId('try-another-email')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('try-another-email'));
      expect(screen.getByTestId('email-lookup-card')).toBeInTheDocument();
    });
  });

  describe('preferences editor - digest types', () => {
    beforeEach(async () => {
      render(<EmailPreferencesPage />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Find My Subscription'));
      await waitFor(() => {
        expect(screen.getByTestId('preferences-editor')).toBeInTheDocument();
      });
    });

    it('should display all 5 digest options', () => {
      expect(screen.getByTestId('digest-option-community')).toBeInTheDocument();
      expect(screen.getByTestId('digest-option-immigration')).toBeInTheDocument();
      expect(screen.getByTestId('digest-option-deals')).toBeInTheDocument();
      expect(screen.getByTestId('digest-option-jobs')).toBeInTheDocument();
      expect(screen.getByTestId('digest-option-events')).toBeInTheDocument();
    });

    it('should pre-select digest types from subscription', () => {
      const communityCheckbox = screen.getByTestId('digest-option-community').querySelector('input');
      const immigrationCheckbox = screen.getByTestId('digest-option-immigration').querySelector('input');
      const dealsCheckbox = screen.getByTestId('digest-option-deals').querySelector('input');
      expect(communityCheckbox).toBeChecked();
      expect(immigrationCheckbox).toBeChecked();
      expect(dealsCheckbox).not.toBeChecked();
    });

    it('should toggle digest type on click', () => {
      const dealsCheckbox = screen.getByTestId('digest-option-deals').querySelector('input') as HTMLInputElement;
      fireEvent.click(dealsCheckbox);
      expect(dealsCheckbox).toBeChecked();
      fireEvent.click(dealsCheckbox);
      expect(dealsCheckbox).not.toBeChecked();
    });
  });

  describe('preferences editor - frequency', () => {
    beforeEach(async () => {
      render(<EmailPreferencesPage />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Find My Subscription'));
      await waitFor(() => {
        expect(screen.getByTestId('preferences-editor')).toBeInTheDocument();
      });
    });

    it('should display frequency options', () => {
      expect(screen.getByTestId('frequency-option-daily')).toBeInTheDocument();
      expect(screen.getByTestId('frequency-option-weekly')).toBeInTheDocument();
    });

    it('should pre-select weekly frequency from subscription', () => {
      const weeklyRadio = screen.getByTestId('frequency-option-weekly').querySelector('input');
      expect(weeklyRadio).toBeChecked();
    });

    it('should change frequency on click', () => {
      const dailyRadio = screen.getByTestId('frequency-option-daily').querySelector('input') as HTMLInputElement;
      fireEvent.click(dailyRadio);
      expect(dailyRadio).toBeChecked();
    });
  });

  describe('preferences editor - WhatsApp', () => {
    beforeEach(async () => {
      render(<EmailPreferencesPage />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Find My Subscription'));
      await waitFor(() => {
        expect(screen.getByTestId('preferences-editor')).toBeInTheDocument();
      });
    });

    it('should show WhatsApp toggle', () => {
      expect(screen.getByTestId('whatsapp-toggle')).toBeInTheDocument();
    });

    it('should not show phone input when WhatsApp is disabled', () => {
      expect(screen.queryByLabelText('WhatsApp Phone Number')).not.toBeInTheDocument();
    });

    it('should show phone input when WhatsApp is enabled', () => {
      const toggle = screen.getByTestId('whatsapp-toggle').querySelector('input') as HTMLInputElement;
      fireEvent.click(toggle);
      expect(screen.getByLabelText('WhatsApp Phone Number')).toBeInTheDocument();
    });
  });

  describe('saving preferences', () => {
    beforeEach(async () => {
      render(<EmailPreferencesPage />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Find My Subscription'));
      await waitFor(() => {
        expect(screen.getByTestId('preferences-editor')).toBeInTheDocument();
      });
      // Reset fetch mock for save calls
      (global.fetch as jest.Mock).mockClear();
      mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => ({ ...mockSubscription, digest_types: ['community', 'immigration', 'deals'], frequency: 'daily' }),
      };
    });

    it('should show save button', () => {
      expect(screen.getByTestId('save-preferences')).toBeInTheDocument();
    });

    it('should call API with updated preferences', async () => {
      // Toggle deals on
      const dealsCheckbox = screen.getByTestId('digest-option-deals').querySelector('input') as HTMLInputElement;
      fireEvent.click(dealsCheckbox);

      // Change frequency
      const dailyRadio = screen.getByTestId('frequency-option-daily').querySelector('input') as HTMLInputElement;
      fireEvent.click(dailyRadio);

      fireEvent.click(screen.getByTestId('save-preferences'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/newsletter/preferences', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }));
      });

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.email).toBe('test@example.com');
      expect(callBody.digest_types).toContain('deals');
      expect(callBody.frequency).toBe('daily');
    });

    it('should show success message after saving', async () => {
      fireEvent.click(screen.getByTestId('save-preferences'));
      await waitFor(() => {
        expect(screen.getByTestId('save-success')).toBeInTheDocument();
      });
    });

    it('should show saving state during submission', async () => {
      global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;
      fireEvent.click(screen.getByTestId('save-preferences'));
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should show error on save failure', async () => {
      mockFetchResponse = { ok: false, status: 500, json: async () => ({ error: 'Server error' }) };
      fireEvent.click(screen.getByTestId('save-preferences'));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to save preferences');
      });
    });
  });

  describe('unsubscribe', () => {
    beforeEach(async () => {
      render(<EmailPreferencesPage />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Find My Subscription'));
      await waitFor(() => {
        expect(screen.getByTestId('preferences-editor')).toBeInTheDocument();
      });
      (global.fetch as jest.Mock).mockClear();
    });

    it('should show unsubscribe button', () => {
      expect(screen.getByTestId('unsubscribe-button')).toBeInTheDocument();
    });

    it('should call unsubscribe API when clicked', async () => {
      mockFetchResponse = { ok: true, status: 200, json: async () => ({ success: true }) };
      fireEvent.click(screen.getByTestId('unsubscribe-button'));
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/newsletter/unsubscribe', expect.objectContaining({
          method: 'POST',
        }));
      });
    });

    it('should show unsubscribed state after success', async () => {
      mockFetchResponse = { ok: true, status: 200, json: async () => ({ success: true }) };
      fireEvent.click(screen.getByTestId('unsubscribe-button'));
      await waitFor(() => {
        expect(screen.getByTestId('unsubscribed-state')).toBeInTheDocument();
      });
    });

    it('should show re-subscribe link after unsubscribing', async () => {
      mockFetchResponse = { ok: true, status: 200, json: async () => ({ success: true }) };
      fireEvent.click(screen.getByTestId('unsubscribe-button'));
      await waitFor(() => {
        const link = screen.getByText('Re-subscribe');
        expect(link.getAttribute('data-href')).toBe('/subscribe');
      });
    });

    it('should show unsubscribing loading state', async () => {
      global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;
      fireEvent.click(screen.getByTestId('unsubscribe-button'));
      expect(screen.getByText('Unsubscribing...')).toBeInTheDocument();
    });

    it('should show error on unsubscribe failure', async () => {
      mockFetchResponse = { ok: false, status: 500, json: async () => ({ error: 'Server error' }) };
      fireEvent.click(screen.getByTestId('unsubscribe-button'));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to unsubscribe');
      });
    });
  });

  describe('API error handling', () => {
    it('should show error on network failure during lookup', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;
      render(<EmailPreferencesPage />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Find My Subscription'));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Unable to load your subscription');
      });
    });

    it('should clear error when typing new email', async () => {
      render(<EmailPreferencesPage />);
      fireEvent.click(screen.getByText('Find My Subscription'));
      expect(screen.getByRole('alert')).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'new@test.com' } });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
