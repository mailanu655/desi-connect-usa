'use client';

import { useState } from 'react';

export interface WhatsAppOptInProps {
  variant?: 'card' | 'inline' | 'banner';
  title?: string;
  description?: string;
  onSuccess?: (phoneNumber: string) => void;
  className?: string;
}

export default function WhatsAppOptIn({
  variant = 'card',
  title = 'Get Updates on WhatsApp',
  description = 'Receive community updates, immigration alerts, and exclusive deals directly on WhatsApp.',
  onSuccess,
  className = '',
}: WhatsAppOptInProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePhoneNumber = (phone: string): boolean => {
    // Accept formats: +1234567890, (555) 123-4567, 555-123-4567, etc.
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    return /^\+?\d{10,15}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneNumber.trim()) {
      setError('Please enter your WhatsApp phone number.');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number (e.g., +1 555-123-4567).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/whatsapp/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber.trim(),
          name: name.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to opt in. Please try again.');
      }

      setIsSuccess(true);
      onSuccess?.(phoneNumber.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`whatsapp-optin whatsapp-optin--${variant} ${className}`} data-testid="whatsapp-success">
        <div className="text-center py-6">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-xl font-bold text-green-700 mb-2">You&apos;re All Set!</h3>
          <p className="text-gray-600">
            You&apos;ll start receiving updates on WhatsApp shortly. Welcome to the Desi Connect USA community!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`whatsapp-optin whatsapp-optin--${variant} ${className}`} data-testid="whatsapp-optin">
      {variant === 'banner' && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💬</span>
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <p className="opacity-90">{description}</p>
        </div>
      )}

      {variant === 'card' && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">💬</span>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      )}

      {variant === 'inline' && (
        <div className="mb-3">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate data-testid="whatsapp-form">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm" role="alert">
            {error}
          </div>
        )}

        <div className={variant === 'inline' ? 'flex gap-2' : 'space-y-4'}>
          {variant !== 'inline' && (
            <div>
              <label htmlFor="whatsapp-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name (optional)
              </label>
              <input
                id="whatsapp-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className={variant === 'inline' ? 'flex-1' : ''}>
            <label htmlFor="whatsapp-phone" className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp Number
            </label>
            <input
              id="whatsapp-phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Opting In...' : 'Get WhatsApp Updates'}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          By opting in, you agree to receive messages from Desi Connect USA on WhatsApp. You can opt out anytime by replying STOP.
        </p>
      </form>
    </div>
  );
}
