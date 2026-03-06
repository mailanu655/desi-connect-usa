'use client';

import { useState } from 'react';
import type { DigestType, DigestFrequency } from '@/lib/api-client';

export interface NewsletterSignupProps {
  variant?: 'inline' | 'card' | 'banner';
  showDigestOptions?: boolean;
  showWhatsAppOptIn?: boolean;
  defaultDigestTypes?: DigestType[];
  onSuccess?: () => void;
  className?: string;
}

const DIGEST_OPTIONS: { value: DigestType; label: string; description: string }[] = [
  { value: 'community', label: 'Community Updates', description: 'Local news and community highlights' },
  { value: 'immigration', label: 'Immigration Alerts', description: 'Visa bulletins, USCIS updates, policy changes' },
  { value: 'deals', label: 'Deals & Coupons', description: 'Best deals from Indian businesses near you' },
  { value: 'jobs', label: 'Job Alerts', description: 'New job listings matching your preferences' },
  { value: 'events', label: 'Event Reminders', description: 'Upcoming community events and festivals' },
];

const FREQUENCY_OPTIONS: { value: DigestFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily Digest' },
  { value: 'weekly', label: 'Weekly Digest' },
];

export default function NewsletterSignup({
  variant = 'card',
  showDigestOptions = false,
  showWhatsAppOptIn = false,
  defaultDigestTypes = ['community', 'immigration'],
  onSuccess,
  className = '',
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [digestTypes, setDigestTypes] = useState<DigestType[]>(defaultDigestTypes);
  const [frequency, setFrequency] = useState<DigestFrequency>('weekly');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDigestToggle = (digestType: DigestType) => {
    setDigestTypes((prev) =>
      prev.includes(digestType)
        ? prev.filter((t) => t !== digestType)
        : [...prev, digestType]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (digestTypes.length === 0) {
      setError('Please select at least one digest type.');
      return;
    }

    if (whatsappOptIn && !whatsappNumber.trim()) {
      setError('Please enter your WhatsApp number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          digest_types: digestTypes,
          frequency,
          whatsapp_opted_in: whatsappOptIn,
          whatsapp_number: whatsappOptIn ? whatsappNumber.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to subscribe. Please try again.');
      }

      setIsSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`newsletter-signup newsletter-signup--${variant} ${className}`} data-testid="newsletter-success">
        <div className="text-center py-6">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-xl font-bold text-green-700 mb-2">You&apos;re Subscribed!</h3>
          <p className="text-gray-600">
            Check your inbox for a confirmation email. Welcome to the Desi Connect USA community!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`newsletter-signup newsletter-signup--${variant} ${className}`} data-testid="newsletter-signup">
      {variant === 'banner' && (
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-2">Stay Connected with Your Community</h3>
          <p className="mb-4 opacity-90">
            Get the latest news, deals, immigration updates, and events from the Indian diaspora delivered to your inbox.
          </p>
        </div>
      )}

      {variant === 'card' && (
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">Subscribe to Our Newsletter</h3>
          <p className="text-sm text-gray-600 mt-1">
            Stay updated with the Desi Connect USA community.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate data-testid="newsletter-form">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm" role="alert">
            {error}
          </div>
        )}

        <div className={variant === 'inline' ? 'flex gap-2' : 'space-y-4'}>
          {variant !== 'inline' && (
            <div>
              <label htmlFor="newsletter-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name (optional)
              </label>
              <input
                id="newsletter-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className={variant === 'inline' ? 'flex-1' : ''}>
            <label htmlFor="newsletter-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>

          {showDigestOptions && (
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-2">What interests you?</legend>
              <div className="space-y-2">
                {DIGEST_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={digestTypes.includes(option.value)}
                      onChange={() => handleDigestToggle(option.value)}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium">{option.label}</span>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {showDigestOptions && (
            <div>
              <label htmlFor="newsletter-frequency" className="block text-sm font-medium text-gray-700 mb-1">
                How often?
              </label>
              <select
                id="newsletter-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as DigestFrequency)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showWhatsAppOptIn && (
            <div className="border-t pt-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={whatsappOptIn}
                  onChange={(e) => setWhatsappOptIn(e.target.checked)}
                />
                <span className="text-sm font-medium">Also send me updates on WhatsApp</span>
              </label>
              {whatsappOptIn && (
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  aria-label="WhatsApp phone number"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>
      </form>
    </div>
  );
}
