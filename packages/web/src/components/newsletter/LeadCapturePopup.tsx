'use client';

import { useState, useEffect, useCallback } from 'react';
import NewsletterSignup from './NewsletterSignup';
import WhatsAppOptIn from './WhatsAppOptIn';

export type LeadCaptureTab = 'newsletter' | 'whatsapp';

export interface LeadCapturePopupProps {
  /** Trigger type: 'delay' shows after delayMs, 'scroll' shows after scrollPercent, 'manual' requires isOpen */
  trigger?: 'delay' | 'scroll' | 'manual';
  /** Delay in milliseconds before showing popup (for trigger='delay') */
  delayMs?: number;
  /** Scroll percentage (0-100) before showing popup (for trigger='scroll') */
  scrollPercent?: number;
  /** External control for manual trigger */
  isOpen?: boolean;
  /** Which tab to show first */
  defaultTab?: LeadCaptureTab;
  /** Called when popup is closed */
  onClose?: () => void;
  /** Called when user successfully subscribes */
  onSuccess?: () => void;
  /** LocalStorage key to track dismissal */
  storageKey?: string;
  /** Hours before showing popup again after dismissal */
  dismissHours?: number;
  /** Custom className */
  className?: string;
}

const STORAGE_PREFIX = 'dcu_lead_popup_';

export default function LeadCapturePopup({
  trigger = 'delay',
  delayMs = 5000,
  scrollPercent = 50,
  isOpen: externalIsOpen,
  defaultTab = 'newsletter',
  onClose,
  onSuccess,
  storageKey = 'default',
  dismissHours = 24,
  className = '',
}: LeadCapturePopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<LeadCaptureTab>(defaultTab);
  const [hasConverted, setHasConverted] = useState(false);

  const fullStorageKey = `${STORAGE_PREFIX}${storageKey}`;

  const isDismissed = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const dismissed = localStorage.getItem(fullStorageKey);
      if (!dismissed) return false;
      const dismissedAt = parseInt(dismissed, 10);
      const hoursElapsed = (Date.now() - dismissedAt) / (1000 * 60 * 60);
      return hoursElapsed < dismissHours;
    } catch {
      return false;
    }
  }, [fullStorageKey, dismissHours]);

  const saveDismissal = useCallback(() => {
    try {
      localStorage.setItem(fullStorageKey, Date.now().toString());
    } catch {
      // localStorage not available
    }
  }, [fullStorageKey]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    saveDismissal();
    onClose?.();
  }, [saveDismissal, onClose]);

  const handleSuccess = useCallback(() => {
    setHasConverted(true);
    onSuccess?.();
    // Auto-close after success message display
    setTimeout(() => {
      setIsVisible(false);
      saveDismissal();
    }, 3000);
  }, [saveDismissal, onSuccess]);

  // Handle delay trigger
  useEffect(() => {
    if (trigger !== 'delay') return;
    if (isDismissed()) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [trigger, delayMs, isDismissed]);

  // Handle scroll trigger
  useEffect(() => {
    if (trigger !== 'scroll') return;
    if (isDismissed()) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      if (scrolled >= scrollPercent) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trigger, scrollPercent, isDismissed]);

  // Handle manual trigger
  useEffect(() => {
    if (trigger !== 'manual') return;
    if (externalIsOpen !== undefined) {
      setIsVisible(externalIsOpen);
    }
  }, [trigger, externalIsOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleClose]);

  if (!isVisible) return null;

  return (
    <div
      data-testid="lead-capture-popup"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label="Subscribe to stay connected"
    >
      {/* Backdrop */}
      <div
        data-testid="lead-capture-backdrop"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Close Button */}
        <button
          data-testid="lead-capture-close"
          onClick={handleClose}
          className="absolute right-3 top-3 z-20 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Close popup"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-t-2xl px-6 py-5 text-white">
          <h2 className="text-xl font-bold">Stay Connected with Desi Connect</h2>
          <p className="mt-1 text-sm text-white/80">
            Join thousands of Indian Americans getting curated community updates.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'newsletter'}
            data-testid="tab-newsletter"
            onClick={() => setActiveTab('newsletter')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'newsletter'
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📧 Email Newsletter
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'whatsapp'}
            data-testid="tab-whatsapp"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'whatsapp'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            💬 WhatsApp Updates
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {hasConverted ? (
            <div data-testid="lead-capture-success" className="text-center py-4">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-semibold text-gray-900">Welcome Aboard!</h3>
              <p className="mt-1 text-sm text-gray-600">
                You&apos;re now part of the Desi Connect community.
              </p>
            </div>
          ) : (
            <>
              <div
                role="tabpanel"
                data-testid="panel-newsletter"
                className={activeTab === 'newsletter' ? '' : 'hidden'}
              >
                <NewsletterSignup
                  variant="inline"
                  showDigestOptions={false}
                  showWhatsAppOptIn={false}
                  onSuccess={handleSuccess}
                />
              </div>
              <div
                role="tabpanel"
                data-testid="panel-whatsapp"
                className={activeTab === 'whatsapp' ? '' : 'hidden'}
              >
                <WhatsAppOptIn
                  variant="inline"
                  onSuccess={() => handleSuccess()}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!hasConverted && (
          <div className="border-t border-gray-100 px-6 py-3">
            <p className="text-center text-xs text-gray-400">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
