/**
 * Tests for WhatsAppOptIn component
 * Tests the WhatsApp opt-in form for lead capture with phone number validation,
 * submission, and all three variants (card, inline, banner).
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import WhatsAppOptIn from '@/components/newsletter/WhatsAppOptIn';

describe('WhatsAppOptIn', () => {
  let mockFetchResponse: { ok: boolean; status: number; json: () => Promise<unknown> };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchResponse = {
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    };
    global.fetch = jest.fn(() => Promise.resolve(mockFetchResponse)) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('card variant (default)', () => {
    it('should render the component with data-testid', () => {
      render(<WhatsAppOptIn />);
      expect(screen.getByTestId('whatsapp-optin')).toBeInTheDocument();
    });

    it('should render default title and description', () => {
      render(<WhatsAppOptIn />);
      expect(screen.getByText('Get Updates on WhatsApp')).toBeInTheDocument();
      expect(screen.getByText(/Receive community updates, immigration alerts/)).toBeInTheDocument();
    });

    it('should render the WhatsApp icon emoji', () => {
      render(<WhatsAppOptIn />);
      expect(screen.getByText('💬')).toBeInTheDocument();
    });

    it('should render the form', () => {
      render(<WhatsAppOptIn />);
      expect(screen.getByTestId('whatsapp-form')).toBeInTheDocument();
    });

    it('should show name input field', () => {
      render(<WhatsAppOptIn />);
      expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    });

    it('should show phone number input field', () => {
      render(<WhatsAppOptIn />);
      expect(screen.getByPlaceholderText('+1 (555) 123-4567')).toBeInTheDocument();
    });

    it('should show the submit button', () => {
      render(<WhatsAppOptIn />);
      expect(screen.getByRole('button', { name: 'Get WhatsApp Updates' })).toBeInTheDocument();
    });

    it('should show the opt-out disclaimer', () => {
      render(<WhatsAppOptIn />);
      expect(screen.getByText(/You can opt out anytime by replying STOP/)).toBeInTheDocument();
    });
  });

  describe('inline variant', () => {
    it('should render inline variant without name field', () => {
      render(<WhatsAppOptIn variant="inline" />);
      expect(screen.queryByPlaceholderText('Your name')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('+1 (555) 123-4567')).toBeInTheDocument();
    });

    it('should render title in inline variant', () => {
      render(<WhatsAppOptIn variant="inline" />);
      expect(screen.getByText('Get Updates on WhatsApp')).toBeInTheDocument();
    });
  });

  describe('banner variant', () => {
    it('should render banner with green gradient', () => {
      render(<WhatsAppOptIn variant="banner" />);
      const banner = screen.getByText('Get Updates on WhatsApp').closest('div');
      const gradientContainer = banner?.closest('.bg-gradient-to-r');
      expect(gradientContainer).toHaveClass('from-green-500', 'to-green-600');
    });

    it('should show description in banner', () => {
      render(<WhatsAppOptIn variant="banner" />);
      expect(screen.getByText(/Receive community updates, immigration alerts/)).toBeInTheDocument();
    });
  });

  describe('custom props', () => {
    it('should render with custom title and description', () => {
      render(
        <WhatsAppOptIn
          title="Join Our WhatsApp Group"
          description="Custom description text here."
        />
      );
      expect(screen.getByText('Join Our WhatsApp Group')).toBeInTheDocument();
      expect(screen.getByText('Custom description text here.')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<WhatsAppOptIn className="custom-class" />);
      expect(screen.getByTestId('whatsapp-optin')).toHaveClass('custom-class');
    });
  });

  describe('phone number validation', () => {
    it('should show error when submitting with empty phone number', async () => {
      render(<WhatsAppOptIn />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(screen.getByText('Please enter your WhatsApp phone number.')).toBeInTheDocument();
    });

    it('should show error for invalid phone number format', async () => {
      render(<WhatsAppOptIn />);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '123' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(screen.getByText(/Please enter a valid phone number/)).toBeInTheDocument();
    });

    it('should show error for phone with letters', async () => {
      render(<WhatsAppOptIn />);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: 'abcdefghij' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(screen.getByText(/Please enter a valid phone number/)).toBeInTheDocument();
    });

    it('should accept valid US phone number with country code', async () => {
      render(<WhatsAppOptIn />);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+1 (555) 123-4567' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      // Should not show validation error
      expect(screen.queryByText(/Please enter a valid phone number/)).not.toBeInTheDocument();
      expect(screen.queryByText('Please enter your WhatsApp phone number.')).not.toBeInTheDocument();
    });

    it('should accept valid phone number without formatting', async () => {
      render(<WhatsAppOptIn />);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+15551234567' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(screen.queryByText(/Please enter a valid phone number/)).not.toBeInTheDocument();
    });

    it('should accept valid Indian phone number', async () => {
      render(<WhatsAppOptIn />);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+91 98765 43210' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(screen.queryByText(/Please enter a valid phone number/)).not.toBeInTheDocument();
    });

    it('should show error in alert role', async () => {
      render(<WhatsAppOptIn />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('successful submission', () => {
    it('should submit the form and show success state', async () => {
      render(<WhatsAppOptIn />);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+15551234567' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(screen.getByTestId('whatsapp-success')).toBeInTheDocument();
      expect(screen.getByText("You're All Set!")).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('should call fetch with correct data (phone only)', async () => {
      render(<WhatsAppOptIn />);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+15551234567' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/whatsapp/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: '+15551234567',
          name: undefined,
        }),
      });
    });

    it('should call fetch with name and phone', async () => {
      render(<WhatsAppOptIn />);

      const nameInput = screen.getByPlaceholderText('Your name');
      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');

      fireEvent.change(nameInput, { target: { value: 'Anu' } });
      fireEvent.change(phoneInput, { target: { value: '+15551234567' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/whatsapp/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: '+15551234567',
          name: 'Anu',
        }),
      });
    });

    it('should call onSuccess callback with phone number', async () => {
      const mockOnSuccess = jest.fn();
      render(<WhatsAppOptIn onSuccess={mockOnSuccess} />);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+15551234567' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(mockOnSuccess).toHaveBeenCalledWith('+15551234567');
    });

    it('should show "Opting In..." during submission', async () => {
      let resolvePromise: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => { resolvePromise = resolve; });
      (global.fetch as jest.Mock).mockReturnValue(fetchPromise);

      render(<WhatsAppOptIn />);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+15551234567' } });

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(screen.getByText('Opting In...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Opting In...' })).toBeDisabled();

      await act(async () => {
        resolvePromise!(mockFetchResponse);
      });
    });

    it('should show success confirmation message', async () => {
      render(<WhatsAppOptIn />);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+15551234567' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(screen.getByText(/You'll start receiving updates on WhatsApp/)).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should show error when API returns error', async () => {
      mockFetchResponse = {
        ok: false,
        status: 400,
        json: async () => ({ message: 'Phone number already registered' }),
      };

      render(<WhatsAppOptIn />);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+15551234567' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(screen.getByText('Phone number already registered')).toBeInTheDocument();
    });

    it('should show fallback error when API returns non-JSON error', async () => {
      mockFetchResponse = {
        ok: false,
        status: 500,
        json: async () => { throw new Error('Not JSON'); },
      };

      render(<WhatsAppOptIn />);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+15551234567' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(screen.getByText('Failed to opt in. Please try again.')).toBeInTheDocument();
    });

    it('should show error when fetch throws network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<WhatsAppOptIn />);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+15551234567' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should clear error on next submission attempt', async () => {
      render(<WhatsAppOptIn />);

      // Trigger validation error
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(screen.getByText('Please enter your WhatsApp phone number.')).toBeInTheDocument();

      // Now fill valid phone and submit
      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+15551234567' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Get WhatsApp Updates' }));
      });

      expect(screen.queryByText('Please enter your WhatsApp phone number.')).not.toBeInTheDocument();
    });
  });
});
