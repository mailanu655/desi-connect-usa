'use client';

import { useState } from 'react';
import type { GiveawayCampaign } from '@desi-connect/shared';
import { buildReferralUrl, buildGiveawayShareUrls } from '@/lib/giveaway/giveaway-utils';

interface ReferralWidgetProps {
  campaign: GiveawayCampaign;
  referralCode: string;
  referralCount?: number;
  baseUrl?: string;
}

export default function ReferralWidget({
  campaign,
  referralCode,
  referralCount = 0,
  baseUrl = typeof window !== 'undefined' ? window.location.origin : '',
}: ReferralWidgetProps) {
  const [copied, setCopied] = useState(false);

  const referralUrl = buildReferralUrl(baseUrl, campaign.campaign_id, referralCode);
  const shareUrls = buildGiveawayShareUrls(campaign, referralUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = referralUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const socialPlatforms = [
    { key: 'facebook', label: 'Facebook', icon: '📘' },
    { key: 'twitter', label: 'Twitter', icon: '🐦' },
    { key: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { key: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { key: 'email', label: 'Email', icon: '📧' },
  ];

  return (
    <div className="rounded-lg border border-saffron-200 bg-saffron-50 p-4" data-testid="referral-widget">
      <h3 className="font-heading text-lg font-bold text-gray-900">
        Share & Earn More Entries
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        Share your unique link to earn bonus entries for each friend who joins!
      </p>

      {/* Referral Stats */}
      <div className="mt-3 flex items-center gap-4">
        <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
          <p className="text-xs text-gray-500">Your Referrals</p>
          <p className="text-lg font-bold text-saffron-600" data-testid="referral-count">
            {referralCount}
          </p>
        </div>
        <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
          <p className="text-xs text-gray-500">Your Code</p>
          <p className="text-sm font-mono font-bold text-gray-900" data-testid="referral-code">
            {referralCode}
          </p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="mt-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Your referral link
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={referralUrl}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
            data-testid="referral-url"
          />
          <button
            onClick={handleCopy}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-saffron-500 text-white hover:bg-saffron-600'
            }`}
            data-testid="copy-button"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Social Share Buttons */}
      <div className="mt-4">
        <p className="text-xs font-medium text-gray-600 mb-2">Share on</p>
        <div className="flex flex-wrap gap-2" data-testid="share-buttons">
          {socialPlatforms.map((platform) => (
            <a
              key={platform.key}
              href={shareUrls[platform.key]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:border-saffron-300 hover:bg-saffron-50 transition-colors"
              data-testid={`share-${platform.key}`}
            >
              <span>{platform.icon}</span>
              <span>{platform.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
