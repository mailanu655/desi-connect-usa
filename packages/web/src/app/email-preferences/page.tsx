'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { DigestType, DigestFrequency, NewsletterSubscription, UpdateNewsletterPreferencesInput } from '@/lib/api-client';

const DIGEST_OPTIONS: { value: DigestType; label: string; description: string }[] = [
  { value: 'community', label: 'Community Updates', description: 'Local news and community highlights' },
  { value: 'immigration', label: 'Immigration Alerts', description: 'Visa bulletins, USCIS updates, policy changes' },
  { value: 'deals', label: 'Deals & Coupons', description: 'Best deals from Indian businesses near you' },
  { value: 'jobs', label: 'Job Alerts', description: 'New job listings matching your preferences' },
  { value: 'events', label: 'Event Reminders', description: 'Upcoming community events and festivals' },
];

const FREQUENCY_OPTIONS: { value: DigestFrequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily Digest', description: 'Get updates every morning' },
  { value: 'weekly', label: 'Weekly Digest', description: 'A summary every Monday' },
];

export default function EmailPreferencesPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLookedUp, setIsLookedUp] = useState(false);
  const [subscription, setSubscription] = useState<NewsletterSubscription | null>(null);
  const [digestTypes, setDigestTypes] = useState<DigestType[]>([]);
  const [frequency, setFrequency] = useState<DigestFrequency>('weekly');
  const [whatsappOptedIn, setWhatsappOptedIn] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);

  const searchParams = useSearchParams();

  const loadSubscription = useCallback(async (lookupEmail: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/newsletter/subscription?email=${encodeURIComponent(lookupEmail)}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('No subscription found for this email address.');
          setSubscription(null);
          setIsLookedUp(true);
          return;
        }
        throw new Error('Failed to load subscription');
      }
      const data: NewsletterSubscription = await response.json();
      setSubscription(data);
      setDigestTypes(data.digest_types);
      setFrequency(data.frequency);
      setWhatsappOptedIn(data.whatsapp_opted_in);
      setWhatsappNumber(data.whatsapp_number || '');
      setIsLookedUp(true);
    } catch {
      setError('Unable to load your subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for email query param
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      loadSubscription(emailParam);
    }
  }, [searchParams, loadSubscription]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    await loadSubscription(email);
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    const preferences: UpdateNewsletterPreferencesInput = {
      digest_types: digestTypes,
      frequency,
      whatsapp_opted_in: whatsappOptedIn,
      ...(whatsappOptedIn && whatsappNumber ? { whatsapp_number: whatsappNumber } : {}),
    };

    try {
      const response = await fetch('/api/newsletter/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...preferences }),
      });
      if (!response.ok) throw new Error('Failed to update preferences');
      const updated: NewsletterSubscription = await response.json();
      setSubscription(updated);
      setDigestTypes(updated.digest_types);
      setFrequency(updated.frequency);
      setWhatsappOptedIn(updated.whatsapp_opted_in);
      setWhatsappNumber(updated.whatsapp_number || '');
      setSaveSuccess(true);
    } catch {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscription) return;
    setIsUnsubscribing(true);
    setError(null);

    try {
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error('Failed to unsubscribe');
      setIsUnsubscribed(true);
      setSubscription(null);
    } catch {
      setError('Failed to unsubscribe. Please try again.');
    } finally {
      setIsUnsubscribing(false);
    }
  };

  const toggleDigestType = (type: DigestType) => {
    setDigestTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setSaveSuccess(false);
  };

  return (
    <div className="w-full" data-testid="email-preferences-page">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-orange-600 to-red-500 py-16 sm:py-24">
        <div className="container-page">
          <nav className="mb-4 text-sm text-white/70">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white">Email Preferences</span>
          </nav>
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            Email Preferences
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Manage your newsletter subscriptions and notification settings.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl">
            {/* Unsubscribed State */}
            {isUnsubscribed && (
              <div data-testid="unsubscribed-state" className="card p-8 text-center">
                <div className="text-4xl mb-4">👋</div>
                <h2 className="text-xl font-bold text-gray-900">You&apos;ve Been Unsubscribed</h2>
                <p className="mt-2 text-gray-600">
                  We&apos;re sorry to see you go. You can always re-subscribe anytime.
                </p>
                <Link
                  href="/subscribe"
                  className="mt-6 inline-block btn-primary"
                >
                  Re-subscribe
                </Link>
              </div>
            )}

            {/* Email Lookup Form */}
            {!isUnsubscribed && !isLookedUp && (
              <div className="card p-6 sm:p-8" data-testid="email-lookup-card">
                <h2 className="text-xl font-bold text-gray-900">Find Your Subscription</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Enter the email address you used to subscribe.
                </p>
                <form onSubmit={handleLookup} noValidate className="mt-6" data-testid="email-lookup-form">
                  <div>
                    <label htmlFor="lookup-email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      id="lookup-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      placeholder="your@email.com"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-4 w-full btn-primary"
                  >
                    {isLoading ? 'Looking up...' : 'Find My Subscription'}
                  </button>
                </form>
              </div>
            )}

            {/* Subscription Not Found */}
            {!isUnsubscribed && isLookedUp && !subscription && (
              <div data-testid="not-found-state" className="card p-8 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h2 className="text-xl font-bold text-gray-900">No Subscription Found</h2>
                <p className="mt-2 text-gray-600">
                  We couldn&apos;t find a subscription for <strong>{email}</strong>.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link href="/subscribe" className="btn-primary">
                    Subscribe Now
                  </Link>
                  <button
                    onClick={() => { setIsLookedUp(false); setError(null); setEmail(''); }}
                    className="btn-secondary"
                    data-testid="try-another-email"
                  >
                    Try Another Email
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Editor */}
            {!isUnsubscribed && subscription && (
              <div data-testid="preferences-editor">
                {/* Success Banner */}
                {saveSuccess && (
                  <div data-testid="save-success" className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800" role="status">
                    ✅ Your preferences have been saved successfully.
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSavePreferences} noValidate data-testid="preferences-form">
                  {/* Digest Types */}
                  <div className="card p-6 sm:p-8">
                    <h2 className="text-lg font-bold text-gray-900">Content Preferences</h2>
                    <p className="mt-1 text-sm text-gray-600">Choose which updates you&apos;d like to receive.</p>
                    <div className="mt-4 space-y-3">
                      {DIGEST_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-start gap-3 cursor-pointer"
                          data-testid={`digest-option-${option.value}`}
                        >
                          <input
                            type="checkbox"
                            checked={digestTypes.includes(option.value)}
                            onChange={() => toggleDigestType(option.value)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900">{option.label}</span>
                            <p className="text-xs text-gray-500">{option.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Frequency */}
                  <div className="card p-6 sm:p-8 mt-6">
                    <h2 className="text-lg font-bold text-gray-900">Delivery Frequency</h2>
                    <p className="mt-1 text-sm text-gray-600">How often would you like to receive updates?</p>
                    <div className="mt-4 space-y-3">
                      {FREQUENCY_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-3 cursor-pointer"
                          data-testid={`frequency-option-${option.value}`}
                        >
                          <input
                            type="radio"
                            name="frequency"
                            value={option.value}
                            checked={frequency === option.value}
                            onChange={() => { setFrequency(option.value); setSaveSuccess(false); }}
                            className="h-4 w-4 border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900">{option.label}</span>
                            <p className="text-xs text-gray-500">{option.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* WhatsApp Settings */}
                  <div className="card p-6 sm:p-8 mt-6">
                    <h2 className="text-lg font-bold text-gray-900">WhatsApp Notifications</h2>
                    <p className="mt-1 text-sm text-gray-600">Get important updates directly on WhatsApp.</p>
                    <div className="mt-4">
                      <label className="flex items-center gap-3 cursor-pointer" data-testid="whatsapp-toggle">
                        <input
                          type="checkbox"
                          checked={whatsappOptedIn}
                          onChange={() => { setWhatsappOptedIn(!whatsappOptedIn); setSaveSuccess(false); }}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          Enable WhatsApp updates
                        </span>
                      </label>
                      {whatsappOptedIn && (
                        <div className="mt-3 ml-7">
                          <label htmlFor="whatsapp-number" className="block text-sm font-medium text-gray-700">
                            WhatsApp Phone Number
                          </label>
                          <input
                            id="whatsapp-number"
                            type="tel"
                            value={whatsappNumber}
                            onChange={(e) => { setWhatsappNumber(e.target.value); setSaveSuccess(false); }}
                            placeholder="+1 (555) 123-4567"
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full btn-primary"
                      data-testid="save-preferences"
                    >
                      {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </form>

                {/* Unsubscribe Section */}
                <div className="mt-10 border-t border-gray-200 pt-8">
                  <h3 className="text-sm font-medium text-gray-500">Unsubscribe</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    No longer want to receive emails? You can unsubscribe below.
                  </p>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={isUnsubscribing}
                    className="mt-3 text-sm text-red-500 hover:text-red-700 underline"
                    data-testid="unsubscribe-button"
                  >
                    {isUnsubscribing ? 'Unsubscribing...' : 'Unsubscribe from all emails'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
