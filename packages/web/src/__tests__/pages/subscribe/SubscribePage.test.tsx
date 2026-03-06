/**
 * Tests for SubscribePage (pages/subscribe/page.tsx)
 * Tests the newsletter subscription page with full digest options and WhatsApp opt-in.
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import SubscribePage from '@/app/subscribe/page';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a data-href={href} {...props}>{children}</a>;
  };
});

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  };
});

describe('SubscribePage', () => {
  let mockFetchResponse: { ok: boolean; status: number; json: () => Promise<unknown> };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchResponse = {
      ok: true,
      status: 200,
      json: async () => ({ subscription_id: 'sub-123', status: 'active' }),
    };
    global.fetch = jest.fn(() => Promise.resolve(mockFetchResponse)) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('page layout and header', () => {
    it('should render the page header with title and subtitle', () => {
      render(<SubscribePage />);

      // Page title appears in both the header h1 and the card h3
      const titles = screen.getAllByText('Subscribe to Our Newsletter');
      expect(titles.length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText(/Stay connected with the Indian American community/)
      ).toBeInTheDocument();
    });

    it('should render the gradient header section', () => {
      render(<SubscribePage />);

      // Find the h1 (page header title) specifically
      const titles = screen.getAllByText('Subscribe to Our Newsletter');
      const h1Title = titles.find((el) => el.tagName === 'H1');
      expect(h1Title).toBeDefined();
      const header = h1Title!.closest('section');
      expect(header).toHaveClass('bg-gradient-to-r', 'from-orange-600', 'to-red-500');
    });

    it('should render the header title in white', () => {
      render(<SubscribePage />);

      const titles = screen.getAllByText('Subscribe to Our Newsletter');
      const h1Title = titles.find((el) => el.tagName === 'H1');
      expect(h1Title).toBeDefined();
      expect(h1Title).toHaveClass('text-white');
    });
  });

  describe('newsletter signup form', () => {
    it('should render the NewsletterSignup component', () => {
      render(<SubscribePage />);

      expect(screen.getByTestId('newsletter-signup')).toBeInTheDocument();
    });

    it('should show the card variant title', () => {
      render(<SubscribePage />);

      // The NewsletterSignup card variant renders "Subscribe to Our Newsletter" as well
      // Use getAllByText since the page title and card title may match
      const titles = screen.getAllByText('Subscribe to Our Newsletter');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should render the newsletter form', () => {
      render(<SubscribePage />);

      expect(screen.getByTestId('newsletter-form')).toBeInTheDocument();
    });

    it('should show name input field', () => {
      render(<SubscribePage />);

      expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    });

    it('should show email input field', () => {
      render(<SubscribePage />);

      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });

    it('should show the Subscribe button', () => {
      render(<SubscribePage />);

      expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
    });
  });

  describe('digest options', () => {
    it('should show all five digest type options', () => {
      render(<SubscribePage />);

      // Some labels appear in both digest options and benefits section
      expect(screen.getAllByText('Community Updates').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Immigration Alerts').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Deals/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Job Alerts').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Event Reminders')).toBeInTheDocument();
    });

    it('should show digest type descriptions', () => {
      render(<SubscribePage />);

      expect(screen.getByText('Local news and community highlights')).toBeInTheDocument();
      expect(screen.getByText('Visa bulletins, USCIS updates, policy changes')).toBeInTheDocument();
      expect(screen.getByText('Best deals from Indian businesses near you')).toBeInTheDocument();
      expect(screen.getByText('New job listings matching your preferences')).toBeInTheDocument();
      expect(screen.getByText('Upcoming community events and festivals')).toBeInTheDocument();
    });

    it('should have community and immigration checked by default', () => {
      render(<SubscribePage />);

      const checkboxes = screen.getAllByRole('checkbox');
      // Find digest checkboxes (community and immigration should be checked)
      const communityCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('Community Updates');
      });
      const immigrationCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('Immigration Alerts');
      });

      expect(communityCheckbox).toBeChecked();
      expect(immigrationCheckbox).toBeChecked();
    });

    it('should show the "What interests you?" legend', () => {
      render(<SubscribePage />);

      expect(screen.getByText('What interests you?')).toBeInTheDocument();
    });

    it('should show the frequency selector', () => {
      render(<SubscribePage />);

      expect(screen.getByText('How often?')).toBeInTheDocument();
      expect(screen.getByText('Daily Digest')).toBeInTheDocument();
      expect(screen.getByText('Weekly Digest')).toBeInTheDocument();
    });

    it('should default to weekly frequency', () => {
      render(<SubscribePage />);

      const frequencySelect = screen.getByLabelText('How often?') as HTMLSelectElement;
      expect(frequencySelect.value).toBe('weekly');
    });

    it('should allow toggling digest types', () => {
      render(<SubscribePage />);

      const checkboxes = screen.getAllByRole('checkbox');
      const dealsCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('Deals');
      });

      expect(dealsCheckbox).not.toBeChecked();
      fireEvent.click(dealsCheckbox!);
      expect(dealsCheckbox).toBeChecked();
    });
  });

  describe('WhatsApp opt-in', () => {
    it('should show the WhatsApp opt-in checkbox', () => {
      render(<SubscribePage />);

      expect(screen.getByText('Also send me updates on WhatsApp')).toBeInTheDocument();
    });

    it('should not show WhatsApp number input by default', () => {
      render(<SubscribePage />);

      expect(screen.queryByPlaceholderText('+1 (555) 000-0000')).not.toBeInTheDocument();
    });

    it('should show WhatsApp number input when opted in', () => {
      render(<SubscribePage />);

      const checkboxes = screen.getAllByRole('checkbox');
      const whatsappCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('WhatsApp');
      });

      fireEvent.click(whatsappCheckbox!);
      expect(screen.getByPlaceholderText('+1 (555) 000-0000')).toBeInTheDocument();
    });

    it('should hide WhatsApp number input when unchecked', () => {
      render(<SubscribePage />);

      const checkboxes = screen.getAllByRole('checkbox');
      const whatsappCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('WhatsApp');
      });

      // Check then uncheck
      fireEvent.click(whatsappCheckbox!);
      expect(screen.getByPlaceholderText('+1 (555) 000-0000')).toBeInTheDocument();

      fireEvent.click(whatsappCheckbox!);
      expect(screen.queryByPlaceholderText('+1 (555) 000-0000')).not.toBeInTheDocument();
    });
  });

  describe('benefits section', () => {
    it('should render the "What You\'ll Get" heading', () => {
      render(<SubscribePage />);

      expect(screen.getByText("What You'll Get")).toBeInTheDocument();
    });

    it('should render all four benefit cards', () => {
      render(<SubscribePage />);

      // Benefit card titles (distinct from digest option labels)
      const benefitCards = screen.getByText("What You'll Get").closest('div');
      expect(benefitCards).toBeInTheDocument();

      // Check benefit emojis exist
      expect(screen.getByText('📰')).toBeInTheDocument();
      expect(screen.getByText('🛂')).toBeInTheDocument();
      expect(screen.getByText('🏷️')).toBeInTheDocument();
      expect(screen.getByText('💼')).toBeInTheDocument();
    });

    it('should render benefit descriptions', () => {
      render(<SubscribePage />);

      expect(
        screen.getByText(/Local news and highlights from the Indian American community/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Visa bulletins, USCIS updates, H-1B news/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Exclusive deals from Indian businesses/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/New job listings, career opportunities/)
      ).toBeInTheDocument();
    });
  });

  describe('privacy note and navigation', () => {
    it('should render the privacy note', () => {
      render(<SubscribePage />);

      expect(screen.getByText(/We respect your privacy/)).toBeInTheDocument();
      expect(screen.getByText(/Unsubscribe anytime/)).toBeInTheDocument();
    });

    it('should link to the privacy policy page', () => {
      render(<SubscribePage />);

      const privacyLink = screen.getByText('Privacy Policy');
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('data-href', '/privacy');
    });
  });

  describe('form validation', () => {
    it('should show error when submitting with empty email', async () => {
      render(<SubscribePage />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByText('Please enter your email address.')).toBeInTheDocument();
    });

    it('should show error for invalid email format', async () => {
      render(<SubscribePage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    });

    it('should show error when no digest types selected', async () => {
      render(<SubscribePage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      // Uncheck default digest types (community + immigration)
      const checkboxes = screen.getAllByRole('checkbox');
      const communityCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('Community Updates');
      });
      const immigrationCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('Immigration Alerts');
      });

      fireEvent.click(communityCheckbox!);
      fireEvent.click(immigrationCheckbox!);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByText('Please select at least one digest type.')).toBeInTheDocument();
    });

    it('should show error when WhatsApp opted in but no number provided', async () => {
      render(<SubscribePage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      // Opt in to WhatsApp
      const checkboxes = screen.getAllByRole('checkbox');
      const whatsappCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('WhatsApp');
      });
      fireEvent.click(whatsappCheckbox!);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByText('Please enter your WhatsApp number.')).toBeInTheDocument();
    });
  });

  describe('successful submission', () => {
    it('should submit the form and show success state', async () => {
      render(<SubscribePage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'anu@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByTestId('newsletter-success')).toBeInTheDocument();
      expect(screen.getByText("You're Subscribed!")).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('should call fetch with correct newsletter data', async () => {
      render(<SubscribePage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const nameInput = screen.getByPlaceholderText('Your name');

      fireEvent.change(nameInput, { target: { value: 'Anu' } });
      fireEvent.change(emailInput, { target: { value: 'anu@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'anu@example.com',
          name: 'Anu',
          digest_types: ['community', 'immigration'],
          frequency: 'weekly',
          whatsapp_opted_in: false,
          whatsapp_number: undefined,
        }),
      });
    });

    it('should submit with WhatsApp data when opted in', async () => {
      render(<SubscribePage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'anu@example.com' } });

      // Opt in to WhatsApp
      const checkboxes = screen.getAllByRole('checkbox');
      const whatsappCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('WhatsApp');
      });
      fireEvent.click(whatsappCheckbox!);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 000-0000');
      fireEvent.change(phoneInput, { target: { value: '+1 (555) 123-4567' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'anu@example.com',
          digest_types: ['community', 'immigration'],
          frequency: 'weekly',
          whatsapp_opted_in: true,
          whatsapp_number: '+1 (555) 123-4567',
        }),
      });
    });

    it('should submit with custom digest types and frequency', async () => {
      render(<SubscribePage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'anu@example.com' } });

      // Add deals to digest types
      const checkboxes = screen.getAllByRole('checkbox');
      const dealsCheckbox = checkboxes.find((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.includes('Deals');
      });
      fireEvent.click(dealsCheckbox!);

      // Change frequency to daily
      const frequencySelect = screen.getByLabelText('How often?');
      fireEvent.change(frequencySelect, { target: { value: 'daily' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'anu@example.com',
          digest_types: ['community', 'immigration', 'deals'],
          frequency: 'daily',
          whatsapp_opted_in: false,
          whatsapp_number: undefined,
        }),
      });
    });

    it('should show button text as Subscribing... during submission', async () => {
      // Delay the fetch response
      let resolvePromise: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => { resolvePromise = resolve; });
      (global.fetch as jest.Mock).mockReturnValue(fetchPromise);

      render(<SubscribePage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'anu@example.com' } });

      // Don't await - check intermediate state
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByText('Subscribing...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Subscribing...' })).toBeDisabled();

      // Resolve the fetch
      await act(async () => {
        resolvePromise!(mockFetchResponse);
      });
    });
  });

  describe('error handling', () => {
    it('should show error message when API returns error', async () => {
      mockFetchResponse = {
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error occurred' }),
      };

      render(<SubscribePage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'anu@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByText('Server error occurred')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should show fallback error when API returns non-JSON error', async () => {
      mockFetchResponse = {
        ok: false,
        status: 500,
        json: async () => { throw new Error('Not JSON'); },
      };

      render(<SubscribePage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'anu@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByText('Failed to subscribe. Please try again.')).toBeInTheDocument();
    });

    it('should show error when fetch throws network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<SubscribePage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'anu@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should clear error when user retypes and resubmits', async () => {
      render(<SubscribePage />);

      // First, trigger validation error
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.getByText('Please enter your email address.')).toBeInTheDocument();

      // Now fill valid email and submit - error should clear
      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'anu@example.com' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
      });

      expect(screen.queryByText('Please enter your email address.')).not.toBeInTheDocument();
    });
  });
});
