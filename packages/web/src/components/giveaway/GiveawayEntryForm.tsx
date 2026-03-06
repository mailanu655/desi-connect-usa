'use client';

import { useState } from 'react';
import type { GiveawayCampaign, EntryMethod, EntryMethodConfig } from '@desi-connect/shared';
import { getEntryMethodLabel, getEntryMethodIcon } from '@/lib/giveaway/giveaway-utils';

interface GiveawayEntryFormProps {
  campaign: GiveawayCampaign;
  onEntry: (method: EntryMethod, email?: string, referralCode?: string) => Promise<void>;
  completedMethods: EntryMethod[];
  disabled?: boolean;
}

export default function GiveawayEntryForm({
  campaign,
  onEntry,
  completedMethods,
  disabled = false,
}: GiveawayEntryFormProps) {
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState<EntryMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEntry = async (method: EntryMethod) => {
    try {
      setLoading(method);
      setError(null);
      setSuccess(null);

      if (method === 'email_signup' && !email) {
        setError('Please enter your email address');
        return;
      }

      await onEntry(method, email || undefined, referralCode || undefined);
      setSuccess(`Entry submitted via ${getEntryMethodLabel(method)}!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit entry');
    } finally {
      setLoading(null);
    }
  };

  const isMethodCompleted = (method: EntryMethod) => completedMethods.includes(method);

  return (
    <div className="space-y-4" data-testid="giveaway-entry-form">
      <h3 className="font-heading text-lg font-bold text-gray-900">
        Ways to Enter
      </h3>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-testid="entry-error">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700" data-testid="entry-success">
          {success}
        </div>
      )}

      {/* Email Input (for email_signup method) */}
      {campaign.entry_methods.some((m) => m.method === 'email_signup') && (
        <div>
          <label htmlFor="entry-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="entry-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-saffron-500 focus:outline-none focus:ring-1 focus:ring-saffron-500"
            disabled={disabled}
            data-testid="email-input"
          />
        </div>
      )}

      {/* Referral Code Input */}
      <div>
        <label htmlFor="referral-code" className="block text-sm font-medium text-gray-700 mb-1">
          Referral Code (optional)
        </label>
        <input
          id="referral-code"
          type="text"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          placeholder="Enter referral code"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-saffron-500 focus:outline-none focus:ring-1 focus:ring-saffron-500"
          disabled={disabled}
          data-testid="referral-input"
        />
      </div>

      {/* Entry Methods */}
      <div className="space-y-2" data-testid="entry-methods">
        {campaign.entry_methods.map((methodConfig: EntryMethodConfig) => {
          const completed = isMethodCompleted(methodConfig.method);
          const isLoading = loading === methodConfig.method;

          return (
            <button
              key={methodConfig.method}
              onClick={() => handleEntry(methodConfig.method)}
              disabled={disabled || completed || isLoading}
              className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                completed
                  ? 'border-green-200 bg-green-50 cursor-not-allowed'
                  : disabled || isLoading
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-saffron-300 hover:bg-saffron-50 cursor-pointer'
              }`}
              data-testid={`entry-method-${methodConfig.method}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getEntryMethodIcon(methodConfig.method)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {methodConfig.label || getEntryMethodLabel(methodConfig.method)}
                  </p>
                  <p className="text-xs text-gray-500">
                    +{methodConfig.points} points
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {completed ? (
                  <span className="text-green-600 text-sm font-semibold">Completed</span>
                ) : isLoading ? (
                  <span className="text-gray-400 text-sm">Submitting...</span>
                ) : (
                  <span className="text-saffron-600 text-sm font-medium">Enter</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
