/**
 * Tests for LoginPage (pages/auth/login/page.tsx)
 * Tests the login page with three authentication methods: Google, Email, Phone
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/auth/login/page';

jest.mock('@/context/AuthContext');
jest.mock('@/lib/auth-client');

import { useAuth } from '@/context/AuthContext';
import authClient from '@/lib/auth-client';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockAuthClient = authClient as jest.Mocked<typeof authClient>;

describe('LoginPage', () => {
  let mockLogin: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin = jest.fn();
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      login: mockLogin,
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  describe('page layout', () => {
    it('should render the page title and subtitle', () => {
      render(<LoginPage />);

      expect(screen.getByText('Desi Connect USA')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });

    it('should render three authentication method tabs', () => {
      render(<LoginPage />);

      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
    });

    it('should have Google sign in button visible by default', () => {
      render(<LoginPage />);

      // Google tab should be active by default - Sign in with Google button is visible
      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
      // Email magic link input should not be visible
      expect(screen.queryByPlaceholderText('you@example.com')).not.toBeInTheDocument();
    });
  });

  describe('Google Sign In tab', () => {
    it('should show Google sign in button on Google tab', () => {
      render(<LoginPage />);

      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });

    it('should call login with google provider when button clicked', () => {
      render(<LoginPage />);

      const googleButton = screen.getByText('Sign in with Google');
      fireEvent.click(googleButton);

      expect(mockLogin).toHaveBeenCalledWith('google');
    });

    it('should show descriptive text for Google sign in', () => {
      render(<LoginPage />);

      expect(
        screen.getByText('Fast, secure, and the easiest way to sign in.')
      ).toBeInTheDocument();
    });

    it('should attempt to login when button is clicked', async () => {
      render(<LoginPage />);

      const googleButton = screen.getByText('Sign in with Google');
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('google');
      });
    });
  });

  describe('Email Magic Link tab', () => {
    it('should switch to email tab when clicked', () => {
      render(<LoginPage />);

      const emailTab = screen.getAllByText('Email')[0];
      fireEvent.click(emailTab);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      expect(emailInput).toBeInTheDocument();
    });

    it('should show email input field', () => {
      render(<LoginPage />);

      const emailTab = screen.getAllByText('Email')[0];
      fireEvent.click(emailTab);

      const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
      expect(emailInput).toBeInTheDocument();
      expect(emailInput.type).toBe('email');
    });

    it('should show Send Magic Link button', () => {
      render(<LoginPage />);

      const emailTab = screen.getAllByText('Email')[0];
      fireEvent.click(emailTab);

      expect(screen.getByText('Send Magic Link')).toBeInTheDocument();
    });

    it('should show error when email is empty', () => {
      render(<LoginPage />);

      const emailTab = screen.getAllByText('Email')[0];
      fireEvent.click(emailTab);

      const submitButton = screen.getByText('Send Magic Link');
      fireEvent.click(submitButton);

      expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
    });

    it('should send magic link with valid email', async () => {
      mockAuthClient.sendMagicLink.mockResolvedValueOnce({
        success: true,
        message: 'Magic link sent',
      });

      render(<LoginPage />);

      const emailTab = screen.getAllByText('Email')[0];
      fireEvent.click(emailTab);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByText('Send Magic Link');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthClient.sendMagicLink).toHaveBeenCalledWith('user@example.com');
      });
    });

    it('should show success message after sending magic link', async () => {
      mockAuthClient.sendMagicLink.mockResolvedValueOnce({
        success: true,
        message: 'Magic link sent',
      });

      render(<LoginPage />);

      const emailTab = screen.getAllByText('Email')[0];
      fireEvent.click(emailTab);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByText('Send Magic Link');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Magic link sent! Check your email/)
        ).toBeInTheDocument();
      });
    });

    it('should clear email field after successful send', async () => {
      mockAuthClient.sendMagicLink.mockResolvedValueOnce({
        success: true,
        message: 'Magic link sent',
      });

      render(<LoginPage />);

      const emailTab = screen.getAllByText('Email')[0];
      fireEvent.click(emailTab);

      const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByText('Send Magic Link');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput.value).toBe('');
      });
    });

    it('should show error message on failure', async () => {
      mockAuthClient.sendMagicLink.mockRejectedValueOnce(
        new Error('Failed to send magic link')
      );

      render(<LoginPage />);

      const emailTab = screen.getAllByText('Email')[0];
      fireEvent.click(emailTab);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByText('Send Magic Link');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to send magic link')).toBeInTheDocument();
      });
    });

    it('should disable button while loading', async () => {
      mockAuthClient.sendMagicLink.mockImplementation(
        () => new Promise(() => {
          // Never resolves
        })
      );

      render(<LoginPage />);

      const emailTab = screen.getAllByText('Email')[0];
      fireEvent.click(emailTab);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByText('Send Magic Link') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(false);

      fireEvent.click(submitButton);

      expect(submitButton.disabled).toBe(true);
      expect(submitButton).toHaveTextContent('Sending...');
    });

    it('should show descriptive text for email magic link', () => {
      render(<LoginPage />);

      const emailTab = screen.getAllByText('Email')[0];
      fireEvent.click(emailTab);

      expect(
        screen.getByText(
          "We'll send you a link to sign in without a password."
        )
      ).toBeInTheDocument();
    });
  });

  describe('Phone OTP tab', () => {
    it('should switch to phone tab when clicked', () => {
      render(<LoginPage />);

      const phoneTab = screen.getAllByText('Phone')[0];
      fireEvent.click(phoneTab);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      expect(phoneInput).toBeInTheDocument();
    });

    it('should show phone input field', () => {
      render(<LoginPage />);

      const phoneTab = screen.getAllByText('Phone')[0];
      fireEvent.click(phoneTab);

      const phoneInput = screen.getByLabelText('Phone Number') as HTMLInputElement;
      expect(phoneInput).toBeInTheDocument();
      expect(phoneInput.type).toBe('tel');
    });

    it('should show Send OTP via SMS button', () => {
      render(<LoginPage />);

      const phoneTab = screen.getAllByText('Phone')[0];
      fireEvent.click(phoneTab);

      expect(screen.getByText('Send OTP via SMS')).toBeInTheDocument();
    });

    it('should show error when phone is empty', () => {
      render(<LoginPage />);

      const phoneTab = screen.getAllByText('Phone')[0];
      fireEvent.click(phoneTab);

      const submitButton = screen.getByText('Send OTP via SMS');
      fireEvent.click(submitButton);

      expect(screen.getByText('Please enter your phone number')).toBeInTheDocument();
    });

    it('should send OTP with valid phone number', async () => {
      mockAuthClient.sendPhoneOtp.mockResolvedValueOnce({
        success: true,
        verificationId: 'verif123',
      });

      render(<LoginPage />);

      const phoneTab = screen.getAllByText('Phone')[0];
      fireEvent.click(phoneTab);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+1234567890' } });

      const submitButton = screen.getByText('Send OTP via SMS');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthClient.sendPhoneOtp).toHaveBeenCalledWith(
          '+1234567890'
        );
      });
    });

    it('should show success message with phone number', async () => {
      mockAuthClient.sendPhoneOtp.mockResolvedValueOnce({
        success: true,
        verificationId: 'verif123',
      });

      render(<LoginPage />);

      const phoneTab = screen.getAllByText('Phone')[0];
      fireEvent.click(phoneTab);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+1234567890' } });

      const submitButton = screen.getByText('Send OTP via SMS');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/OTP sent to \+1234567890/)
        ).toBeInTheDocument();
      });
    });

    it('should clear phone field after successful send', async () => {
      mockAuthClient.sendPhoneOtp.mockResolvedValueOnce({
        success: true,
        verificationId: 'verif123',
      });

      render(<LoginPage />);

      const phoneTab = screen.getAllByText('Phone')[0];
      fireEvent.click(phoneTab);

      const phoneInput = screen.getByPlaceholderText(
        '+1 (555) 123-4567'
      ) as HTMLInputElement;
      fireEvent.change(phoneInput, { target: { value: '+1234567890' } });

      const submitButton = screen.getByText('Send OTP via SMS');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(phoneInput.value).toBe('');
      });
    });

    it('should show error message on OTP failure', async () => {
      mockAuthClient.sendPhoneOtp.mockRejectedValueOnce(
        new Error('Invalid phone number')
      );

      render(<LoginPage />);

      const phoneTab = screen.getAllByText('Phone')[0];
      fireEvent.click(phoneTab);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: 'invalid' } });

      const submitButton = screen.getByText('Send OTP via SMS');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid phone number')).toBeInTheDocument();
      });
    });

    it('should disable button while loading OTP', async () => {
      mockAuthClient.sendPhoneOtp.mockImplementation(
        () => new Promise(() => {
          // Never resolves
        })
      );

      render(<LoginPage />);

      const phoneTab = screen.getAllByText('Phone')[0];
      fireEvent.click(phoneTab);

      const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
      fireEvent.change(phoneInput, { target: { value: '+1234567890' } });

      const submitButton = screen.getByText('Send OTP via SMS') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(false);

      fireEvent.click(submitButton);

      expect(submitButton.disabled).toBe(true);
      expect(submitButton).toHaveTextContent('Sending OTP...');
    });

    it('should show descriptive text for phone OTP', () => {
      render(<LoginPage />);

      const phoneTab = screen.getAllByText('Phone')[0];
      fireEvent.click(phoneTab);

      expect(
        screen.getByText(
          'Receive a one-time code to verify your phone number.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('error and success messages', () => {
    it('should show error when email is empty on email tab', () => {
      render(<LoginPage />);

      const emailTab = screen.getAllByText('Email')[0];
      fireEvent.click(emailTab);

      const submitButton = screen.getByText('Send Magic Link');
      fireEvent.click(submitButton);

      expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
    });

    it('should show success message after sending magic link', async () => {
      mockAuthClient.sendMagicLink.mockResolvedValueOnce({
        success: true,
        message: 'Magic link sent',
      });

      render(<LoginPage />);

      const emailTab = screen.getAllByText('Email')[0];
      fireEvent.click(emailTab);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const submitButton = screen.getByText('Send Magic Link');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Magic link sent/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('terms and conditions footer', () => {
    it('should show terms and privacy policy text', () => {
      render(<LoginPage />);

      expect(
        screen.getByText(/By signing in, you agree to our Terms of Service and Privacy Policy/)
      ).toBeInTheDocument();
    });
  });
});
