/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NewsletterSignup from '@/components/newsletter/NewsletterSignup';

// ── Mock fetch ──────────────────────────────────────────────
let mockFetchResponse: { ok: boolean; status: number; json: () => Promise<unknown> };

beforeEach(() => {
  mockFetchResponse = {
    ok: true,
    status: 200,
    json: async () => ({ subscription_id: 'sub-1', status: 'active' }),
  };
  global.fetch = jest.fn(() => Promise.resolve(mockFetchResponse)) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Rendering Tests ─────────────────────────────────────────

describe('NewsletterSignup', () => {
  describe('Card Variant (default)', () => {
    it('renders card title and description', () => {
      render(<NewsletterSignup />);
      expect(screen.getByText('Subscribe to Our Newsletter')).toBeInTheDocument();
      expect(screen.getByText('Stay updated with the Desi Connect USA community.')).toBeInTheDocument();
    });

    it('renders email input', () => {
      render(<NewsletterSignup />);
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });

    it('renders name input in card variant', () => {
      render(<NewsletterSignup variant="card" />);
      expect(screen.getByLabelText('Name (optional)')).toBeInTheDocument();
    });

    it('renders subscribe button', () => {
      render(<NewsletterSignup />);
      expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
    });

    it('has newsletter-signup test id', () => {
      render(<NewsletterSignup />);
      expect(screen.getByTestId('newsletter-signup')).toBeInTheDocument();
    });
  });

  describe('Inline Variant', () => {
    it('does not render name input in inline variant', () => {
      render(<NewsletterSignup variant="inline" />);
      expect(screen.queryByLabelText('Name (optional)')).not.toBeInTheDocument();
    });

    it('renders email and submit in inline layout', () => {
      render(<NewsletterSignup variant="inline" />);
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
    });
  });

  describe('Banner Variant', () => {
    it('renders banner heading', () => {
      render(<NewsletterSignup variant="banner" />);
      expect(screen.getByText('Stay Connected with Your Community')).toBeInTheDocument();
    });

    it('renders banner description', () => {
      render(<NewsletterSignup variant="banner" />);
      expect(screen.getByText(/latest news, deals, immigration updates/)).toBeInTheDocument();
    });
  });

  describe('Digest Options', () => {
    it('does not show digest options by default', () => {
      render(<NewsletterSignup />);
      expect(screen.queryByText('What interests you?')).not.toBeInTheDocument();
    });

    it('shows digest checkboxes when showDigestOptions is true', () => {
      render(<NewsletterSignup showDigestOptions />);
      expect(screen.getByText('What interests you?')).toBeInTheDocument();
      expect(screen.getByText('Community Updates')).toBeInTheDocument();
      expect(screen.getByText('Immigration Alerts')).toBeInTheDocument();
      expect(screen.getByText('Deals & Coupons')).toBeInTheDocument();
      expect(screen.getByText('Job Alerts')).toBeInTheDocument();
      expect(screen.getByText('Event Reminders')).toBeInTheDocument();
    });

    it('shows digest descriptions', () => {
      render(<NewsletterSignup showDigestOptions />);
      expect(screen.getByText('Local news and community highlights')).toBeInTheDocument();
      expect(screen.getByText('Visa bulletins, USCIS updates, policy changes')).toBeInTheDocument();
    });

    it('has default digest types pre-checked', () => {
      render(<NewsletterSignup showDigestOptions defaultDigestTypes={['community', 'immigration']} />);
      const checkboxes = screen.getAllByRole('checkbox');
      // community and immigration should be checked
      const communityCheckbox = checkboxes[0];
      const immigrationCheckbox = checkboxes[1];
      expect(communityCheckbox).toBeChecked();
      expect(immigrationCheckbox).toBeChecked();
    });

    it('toggles digest type on click', () => {
      render(<NewsletterSignup showDigestOptions defaultDigestTypes={['community']} />);
      const dealsCheckbox = screen.getByText('Deals & Coupons').closest('label')?.querySelector('input');
      expect(dealsCheckbox).not.toBeChecked();
      fireEvent.click(dealsCheckbox!);
      expect(dealsCheckbox).toBeChecked();
    });

    it('unchecks digest type on second click', () => {
      render(<NewsletterSignup showDigestOptions defaultDigestTypes={['community']} />);
      const communityCheckbox = screen.getByText('Community Updates').closest('label')?.querySelector('input');
      expect(communityCheckbox).toBeChecked();
      fireEvent.click(communityCheckbox!);
      expect(communityCheckbox).not.toBeChecked();
    });

    it('shows frequency selector', () => {
      render(<NewsletterSignup showDigestOptions />);
      expect(screen.getByLabelText('How often?')).toBeInTheDocument();
      expect(screen.getByText('Daily Digest')).toBeInTheDocument();
      expect(screen.getByText('Weekly Digest')).toBeInTheDocument();
    });

    it('defaults to weekly frequency', () => {
      render(<NewsletterSignup showDigestOptions />);
      const select = screen.getByLabelText('How often?') as HTMLSelectElement;
      expect(select.value).toBe('weekly');
    });

    it('changes frequency on selection', () => {
      render(<NewsletterSignup showDigestOptions />);
      const select = screen.getByLabelText('How often?');
      fireEvent.change(select, { target: { value: 'daily' } });
      expect((select as HTMLSelectElement).value).toBe('daily');
    });
  });

  describe('WhatsApp Opt-In', () => {
    it('does not show WhatsApp opt-in by default', () => {
      render(<NewsletterSignup />);
      expect(screen.queryByText(/Also send me updates on WhatsApp/)).not.toBeInTheDocument();
    });

    it('shows WhatsApp checkbox when showWhatsAppOptIn is true', () => {
      render(<NewsletterSignup showWhatsAppOptIn />);
      expect(screen.getByText('Also send me updates on WhatsApp')).toBeInTheDocument();
    });

    it('does not show phone input until WhatsApp is checked', () => {
      render(<NewsletterSignup showWhatsAppOptIn />);
      expect(screen.queryByLabelText('WhatsApp phone number')).not.toBeInTheDocument();
    });

    it('shows phone input after checking WhatsApp opt-in', () => {
      render(<NewsletterSignup showWhatsAppOptIn />);
      const checkbox = screen.getByText('Also send me updates on WhatsApp').closest('label')?.querySelector('input');
      fireEvent.click(checkbox!);
      expect(screen.getByLabelText('WhatsApp phone number')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('+1 (555) 000-0000')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error for empty email', async () => {
      render(<NewsletterSignup />);
      fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Please enter your email address.');
      });
    });

    it('shows error for invalid email', async () => {
      render(<NewsletterSignup />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'invalid-email' } });
      fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address.');
      });
    });

    it('shows error when no digest types selected', async () => {
      render(<NewsletterSignup showDigestOptions defaultDigestTypes={['community']} />);
      // Uncheck community
      const communityCheckbox = screen.getByText('Community Updates').closest('label')?.querySelector('input');
      fireEvent.click(communityCheckbox!);
      // Fill valid email
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Please select at least one digest type.');
      });
    });

    it('shows error when WhatsApp opted in but no number', async () => {
      render(<NewsletterSignup showWhatsAppOptIn />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      const checkbox = screen.getByText('Also send me updates on WhatsApp').closest('label')?.querySelector('input');
      fireEvent.click(checkbox!);
      fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Please enter your WhatsApp number.');
      });
    });
  });

  describe('Successful Submission', () => {
    it('submits with correct data', async () => {
      render(<NewsletterSignup />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"email":"test@example.com"'),
      });
    });

    it('includes name when provided', async () => {
      render(<NewsletterSignup />);
      fireEvent.change(screen.getByLabelText('Name (optional)'), { target: { value: 'Priya' } });
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'priya@example.com' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.name).toBe('Priya');
    });

    it('shows success message after subscription', async () => {
      render(<NewsletterSignup />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByTestId('newsletter-success')).toBeInTheDocument();
      expect(screen.getByText("You're Subscribed!")).toBeInTheDocument();
      expect(screen.getByText(/Check your inbox/)).toBeInTheDocument();
    });

    it('shows submitting state', async () => {
      let resolvePromise: (value: unknown) => void;
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      render(<NewsletterSignup />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByRole('button', { name: 'Subscribing...' })).toBeDisabled();

      await act(async () => {
        resolvePromise!({ ok: true, json: async () => ({ subscription_id: 'sub-1' }) });
      });
    });

    it('calls onSuccess callback after subscription', async () => {
      const onSuccess = jest.fn();
      render(<NewsletterSignup onSuccess={onSuccess} />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('sends digest types and frequency', async () => {
      render(<NewsletterSignup showDigestOptions defaultDigestTypes={['community', 'immigration']} />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.digest_types).toEqual(['community', 'immigration']);
      expect(body.frequency).toBe('weekly');
    });

    it('sends WhatsApp data when opted in', async () => {
      render(<NewsletterSignup showWhatsAppOptIn />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      const checkbox = screen.getByText('Also send me updates on WhatsApp').closest('label')?.querySelector('input');
      fireEvent.click(checkbox!);
      fireEvent.change(screen.getByLabelText('WhatsApp phone number'), { target: { value: '+15551234567' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.whatsapp_opted_in).toBe(true);
      expect(body.whatsapp_number).toBe('+15551234567');
    });
  });

  describe('Error Handling', () => {
    it('shows server error message', async () => {
      mockFetchResponse = {
        ok: false,
        status: 400,
        json: async () => ({ message: 'Email already subscribed.' }),
      };

      render(<NewsletterSignup />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByRole('alert')).toHaveTextContent('Email already subscribed.');
    });

    it('shows generic error on network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<NewsletterSignup />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });

    it('shows fallback error when server returns non-JSON', async () => {
      mockFetchResponse = {
        ok: false,
        status: 500,
        json: async () => { throw new Error('not json'); },
      };

      render(<NewsletterSignup />);
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByRole('alert')).toHaveTextContent('Failed to subscribe. Please try again.');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<NewsletterSignup className="my-custom-class" />);
      expect(screen.getByTestId('newsletter-signup')).toHaveClass('my-custom-class');
    });
  });
});
