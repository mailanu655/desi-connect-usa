import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import LeadCapturePopup from '@/components/newsletter/LeadCapturePopup';

// Mock child components
jest.mock('@/components/newsletter/NewsletterSignup', () => {
  return function MockNewsletterSignup({ onSuccess, variant }: { onSuccess?: () => void; variant?: string }) {
    return (
      <div data-testid="mock-newsletter-signup" data-variant={variant}>
        <button data-testid="mock-newsletter-submit" onClick={onSuccess}>
          Subscribe
        </button>
      </div>
    );
  };
});

jest.mock('@/components/newsletter/WhatsAppOptIn', () => {
  return function MockWhatsAppOptIn({ onSuccess, variant }: { onSuccess?: (phone: string) => void; variant?: string }) {
    return (
      <div data-testid="mock-whatsapp-optin" data-variant={variant}>
        <button data-testid="mock-whatsapp-submit" onClick={() => onSuccess?.('+1234567890')}>
          Get WhatsApp Updates
        </button>
      </div>
    );
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('LeadCapturePopup', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorageMock.clear();
    jest.clearAllMocks();
    // Reset scroll state
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 800, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', { value: 0, writable: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('delay trigger (default)', () => {
    it('should not render popup initially', () => {
      render(<LeadCapturePopup />);
      expect(screen.queryByTestId('lead-capture-popup')).not.toBeInTheDocument();
    });

    it('should show popup after default delay of 5000ms', () => {
      render(<LeadCapturePopup />);
      act(() => { jest.advanceTimersByTime(5000); });
      expect(screen.getByTestId('lead-capture-popup')).toBeInTheDocument();
    });

    it('should not show popup before delay completes', () => {
      render(<LeadCapturePopup delayMs={3000} />);
      act(() => { jest.advanceTimersByTime(2999); });
      expect(screen.queryByTestId('lead-capture-popup')).not.toBeInTheDocument();
    });

    it('should show popup after custom delay', () => {
      render(<LeadCapturePopup delayMs={2000} />);
      act(() => { jest.advanceTimersByTime(2000); });
      expect(screen.getByTestId('lead-capture-popup')).toBeInTheDocument();
    });

    it('should not show popup if previously dismissed within dismissHours', () => {
      const key = 'dcu_lead_popup_default';
      localStorageMock.setItem(key, Date.now().toString());
      render(<LeadCapturePopup />);
      act(() => { jest.advanceTimersByTime(10000); });
      expect(screen.queryByTestId('lead-capture-popup')).not.toBeInTheDocument();
    });

    it('should show popup if dismissal has expired', () => {
      const key = 'dcu_lead_popup_default';
      const expiredTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      localStorageMock.setItem(key, expiredTime.toString());
      render(<LeadCapturePopup dismissHours={24} />);
      act(() => { jest.advanceTimersByTime(5000); });
      expect(screen.getByTestId('lead-capture-popup')).toBeInTheDocument();
    });
  });

  describe('scroll trigger', () => {
    it('should not render popup initially with scroll trigger', () => {
      render(<LeadCapturePopup trigger="scroll" scrollPercent={50} />);
      expect(screen.queryByTestId('lead-capture-popup')).not.toBeInTheDocument();
    });

    it('should show popup when scroll threshold is reached', () => {
      render(<LeadCapturePopup trigger="scroll" scrollPercent={50} />);
      // Simulate scrolling to 60%
      Object.defineProperty(window, 'scrollY', { value: 720, writable: true });
      act(() => { fireEvent.scroll(window); });
      expect(screen.getByTestId('lead-capture-popup')).toBeInTheDocument();
    });

    it('should not show popup before scroll threshold', () => {
      render(<LeadCapturePopup trigger="scroll" scrollPercent={50} />);
      // Simulate scrolling to 30%
      Object.defineProperty(window, 'scrollY', { value: 360, writable: true });
      act(() => { fireEvent.scroll(window); });
      expect(screen.queryByTestId('lead-capture-popup')).not.toBeInTheDocument();
    });
  });

  describe('manual trigger', () => {
    it('should show popup when isOpen is true', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
      expect(screen.getByTestId('lead-capture-popup')).toBeInTheDocument();
    });

    it('should not show popup when isOpen is false', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={false} />);
      expect(screen.queryByTestId('lead-capture-popup')).not.toBeInTheDocument();
    });

    it('should toggle visibility with isOpen prop changes', () => {
      const { rerender } = render(<LeadCapturePopup trigger="manual" isOpen={false} />);
      expect(screen.queryByTestId('lead-capture-popup')).not.toBeInTheDocument();

      rerender(<LeadCapturePopup trigger="manual" isOpen={true} />);
      expect(screen.getByTestId('lead-capture-popup')).toBeInTheDocument();
    });
  });

  describe('popup structure and content', () => {
    beforeEach(() => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
    });

    it('should render as a dialog with modal role', () => {
      const popup = screen.getByTestId('lead-capture-popup');
      expect(popup.getAttribute('role')).toBe('dialog');
      expect(popup.getAttribute('aria-modal')).toBe('true');
    });

    it('should render the header with title', () => {
      expect(screen.getByText('Stay Connected with Desi Connect')).toBeInTheDocument();
    });

    it('should render the header subtitle', () => {
      expect(screen.getByText(/Join thousands of Indian Americans/)).toBeInTheDocument();
    });

    it('should render the close button', () => {
      expect(screen.getByTestId('lead-capture-close')).toBeInTheDocument();
    });

    it('should render the backdrop', () => {
      expect(screen.getByTestId('lead-capture-backdrop')).toBeInTheDocument();
    });

    it('should render tab navigation with newsletter and whatsapp tabs', () => {
      expect(screen.getByTestId('tab-newsletter')).toBeInTheDocument();
      expect(screen.getByTestId('tab-whatsapp')).toBeInTheDocument();
    });

    it('should render the privacy footer', () => {
      expect(screen.getByText(/We respect your privacy/)).toBeInTheDocument();
    });

    it('should render the close button with accessible label', () => {
      const closeBtn = screen.getByTestId('lead-capture-close');
      expect(closeBtn.getAttribute('aria-label')).toBe('Close popup');
    });
  });

  describe('tab navigation', () => {
    it('should show newsletter tab as active by default', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
      const newsletterTab = screen.getByTestId('tab-newsletter');
      expect(newsletterTab.getAttribute('aria-selected')).toBe('true');
    });

    it('should show newsletter panel and hide whatsapp panel by default', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
      const newsletterPanel = screen.getByTestId('panel-newsletter');
      const whatsappPanel = screen.getByTestId('panel-whatsapp');
      expect(newsletterPanel.className).not.toContain('hidden');
      expect(whatsappPanel.className).toContain('hidden');
    });

    it('should switch to whatsapp tab on click', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
      fireEvent.click(screen.getByTestId('tab-whatsapp'));
      const whatsappTab = screen.getByTestId('tab-whatsapp');
      expect(whatsappTab.getAttribute('aria-selected')).toBe('true');
      const whatsappPanel = screen.getByTestId('panel-whatsapp');
      expect(whatsappPanel.className).not.toContain('hidden');
    });

    it('should switch back to newsletter tab', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
      fireEvent.click(screen.getByTestId('tab-whatsapp'));
      fireEvent.click(screen.getByTestId('tab-newsletter'));
      const newsletterTab = screen.getByTestId('tab-newsletter');
      expect(newsletterTab.getAttribute('aria-selected')).toBe('true');
    });

    it('should use defaultTab=whatsapp when specified', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} defaultTab="whatsapp" />);
      const whatsappTab = screen.getByTestId('tab-whatsapp');
      expect(whatsappTab.getAttribute('aria-selected')).toBe('true');
    });

    it('should pass inline variant to newsletter signup', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
      const signup = screen.getByTestId('mock-newsletter-signup');
      expect(signup.getAttribute('data-variant')).toBe('inline');
    });

    it('should pass inline variant to whatsapp optin', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} defaultTab="whatsapp" />);
      const optin = screen.getByTestId('mock-whatsapp-optin');
      expect(optin.getAttribute('data-variant')).toBe('inline');
    });
  });

  describe('closing behavior', () => {
    it('should close popup when close button is clicked', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
      fireEvent.click(screen.getByTestId('lead-capture-close'));
      expect(screen.queryByTestId('lead-capture-popup')).not.toBeInTheDocument();
    });

    it('should close popup when backdrop is clicked', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
      fireEvent.click(screen.getByTestId('lead-capture-backdrop'));
      expect(screen.queryByTestId('lead-capture-popup')).not.toBeInTheDocument();
    });

    it('should close popup when Escape key is pressed', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByTestId('lead-capture-popup')).not.toBeInTheDocument();
    });

    it('should call onClose callback when closed', () => {
      const onClose = jest.fn();
      render(<LeadCapturePopup trigger="manual" isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByTestId('lead-capture-close'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should save dismissal to localStorage when closed', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
      fireEvent.click(screen.getByTestId('lead-capture-close'));
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dcu_lead_popup_default',
        expect.any(String)
      );
    });

    it('should use custom storageKey for dismissal', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} storageKey="homepage" />);
      fireEvent.click(screen.getByTestId('lead-capture-close'));
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dcu_lead_popup_homepage',
        expect.any(String)
      );
    });
  });

  describe('successful submission', () => {
    it('should show success state after newsletter subscription', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
      fireEvent.click(screen.getByTestId('mock-newsletter-submit'));
      expect(screen.getByTestId('lead-capture-success')).toBeInTheDocument();
      expect(screen.getByText('Welcome Aboard!')).toBeInTheDocument();
    });

    it('should show success state after whatsapp opt-in', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} defaultTab="whatsapp" />);
      fireEvent.click(screen.getByTestId('mock-whatsapp-submit'));
      expect(screen.getByTestId('lead-capture-success')).toBeInTheDocument();
    });

    it('should call onSuccess callback on subscription', () => {
      const onSuccess = jest.fn();
      render(<LeadCapturePopup trigger="manual" isOpen={true} onSuccess={onSuccess} />);
      fireEvent.click(screen.getByTestId('mock-newsletter-submit'));
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('should auto-close popup after success with delay', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
      fireEvent.click(screen.getByTestId('mock-newsletter-submit'));
      expect(screen.getByTestId('lead-capture-success')).toBeInTheDocument();

      act(() => { jest.advanceTimersByTime(3000); });
      expect(screen.queryByTestId('lead-capture-popup')).not.toBeInTheDocument();
    });

    it('should hide privacy footer after conversion', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
      expect(screen.getByText(/We respect your privacy/)).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('mock-newsletter-submit'));
      expect(screen.queryByText(/We respect your privacy/)).not.toBeInTheDocument();
    });

    it('should hide tab panels and show only success content after conversion', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} />);
      fireEvent.click(screen.getByTestId('mock-newsletter-submit'));
      // Tab panels should be replaced by success content
      expect(screen.queryByTestId('panel-newsletter')).not.toBeInTheDocument();
      expect(screen.queryByTestId('panel-whatsapp')).not.toBeInTheDocument();
      expect(screen.getByTestId('lead-capture-success')).toBeInTheDocument();
    });
  });

  describe('custom props', () => {
    it('should apply custom className', () => {
      render(<LeadCapturePopup trigger="manual" isOpen={true} className="my-custom-class" />);
      const popup = screen.getByTestId('lead-capture-popup');
      expect(popup.className).toContain('my-custom-class');
    });

    it('should use custom dismissHours', () => {
      const key = 'dcu_lead_popup_default';
      // Dismissed 3 hours ago, but dismissHours is 2 — should show
      const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
      localStorageMock.setItem(key, threeHoursAgo.toString());
      render(<LeadCapturePopup dismissHours={2} />);
      act(() => { jest.advanceTimersByTime(5000); });
      expect(screen.getByTestId('lead-capture-popup')).toBeInTheDocument();
    });

    it('should not show if within custom dismissHours', () => {
      const key = 'dcu_lead_popup_default';
      // Dismissed 1 hour ago, dismissHours is 2 — should NOT show
      const oneHourAgo = Date.now() - (1 * 60 * 60 * 1000);
      localStorageMock.setItem(key, oneHourAgo.toString());
      render(<LeadCapturePopup dismissHours={2} />);
      act(() => { jest.advanceTimersByTime(5000); });
      expect(screen.queryByTestId('lead-capture-popup')).not.toBeInTheDocument();
    });
  });
});
