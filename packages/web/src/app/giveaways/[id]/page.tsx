'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import type { GiveawayCampaign, GiveawayParticipant, EntryMethod } from '@desi-connect/shared';
import {
  getCampaignTimeStatus,
  formatCountdown,
  formatPrizeValue,
  formatEntryCount,
  generateReferralCode,
  getEntryMethodBreakdown,
} from '@/lib/giveaway/giveaway-utils';
import GiveawayEntryForm from '@/components/giveaway/GiveawayEntryForm';
import ReferralWidget from '@/components/giveaway/ReferralWidget';

export default function GiveawayDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<GiveawayCampaign | null>(null);
  const [participant, setParticipant] = useState<GiveawayParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedMethods, setCompletedMethods] = useState<EntryMethod[]>([]);

  const baseUrl = process.env.NEXT_PUBLIC_NOCODEBACKEND_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${baseUrl}/giveaways/${campaignId}`);
        if (!response.ok) throw new Error('Failed to fetch giveaway');

        const data = await response.json();
        setCampaign(data.data || data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) fetchCampaign();
  }, [campaignId, baseUrl]);

  const handleEntry = useCallback(
    async (method: EntryMethod, email?: string, referralCode?: string) => {
      const response = await fetch(`${baseUrl}/giveaways/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          entry_method: method,
          email,
          referral_code: referralCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to enter giveaway');
      }

      setCompletedMethods((prev) => [...prev, method]);
    },
    [campaignId, baseUrl]
  );

  if (loading) {
    return (
      <div className="w-full">
        <section className="py-24">
          <div className="container-page">
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-gray-200 rounded-lg" />
              <div className="h-8 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-24 bg-gray-200 rounded" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="w-full">
        <section className="py-24">
          <div className="container-page">
            <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
              <h2 className="text-lg font-semibold text-red-800">
                {error || 'Giveaway not found'}
              </h2>
              <a href="/giveaways" className="mt-4 inline-block text-saffron-600 hover:text-saffron-700">
                Back to Giveaways
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const timeStatus = getCampaignTimeStatus(campaign);
  const countdown = formatCountdown(campaign);
  const imageUrl = campaign.image_url || '/images/placeholder-giveaway.jpg';
  const referralCode = participant?.referral_code || generateReferralCode('Guest', campaignId);

  return (
    <div className="w-full">
      {/* Hero Image */}
      <section className="relative h-64 bg-gray-100 sm:h-80 lg:h-96">
        <Image
          src={imageUrl}
          alt={campaign.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container-page">
            <span className="inline-block rounded-full bg-saffron-500 px-3 py-1 text-sm font-semibold text-white mb-2">
              {campaign.status}
            </span>
            <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">
              {campaign.title}
            </h1>
            <p className="mt-2 text-lg text-white/80">
              by {campaign.sponsor_name}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Prize & Countdown */}
              <div className="card">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="rounded-lg bg-saffron-100 px-4 py-3">
                    <p className="text-xs text-saffron-600 font-semibold">Prize</p>
                    <p className="text-lg font-bold text-saffron-700" data-testid="prize-description">
                      {campaign.prize_description}
                    </p>
                    {campaign.prize_value && (
                      <p className="text-sm text-saffron-600">
                        Value: {formatPrizeValue(campaign.prize_value)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-lg font-bold ${
                        timeStatus.hasEnded ? 'text-red-600' : 'text-green-600'
                      }`}
                      data-testid="countdown-text"
                    >
                      {countdown}
                    </p>
                    {timeStatus.isActive && (
                      <div className="mt-2 h-2 w-48 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-saffron-500"
                          style={{ width: `${timeStatus.percentComplete}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="card">
                <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">
                  About This Giveaway
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap" data-testid="campaign-description">
                  {campaign.description}
                </p>

                {/* Rules */}
                {campaign.rules && (
                  <div className="mt-6 border-t border-gray-100 pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Rules & Terms</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {campaign.rules}
                    </p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="card">
                <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">
                  Campaign Stats
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="text-center rounded-lg bg-gray-50 p-4">
                    <p className="text-2xl font-bold text-gray-900" data-testid="total-entries">
                      {formatEntryCount(campaign.total_entries || 0)}
                    </p>
                    <p className="text-xs text-gray-500">Total Entries</p>
                  </div>
                  <div className="text-center rounded-lg bg-gray-50 p-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatEntryCount(campaign.total_participants || 0)}
                    </p>
                    <p className="text-xs text-gray-500">Participants</p>
                  </div>
                  <div className="text-center rounded-lg bg-gray-50 p-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {campaign.winner_count || 1}
                    </p>
                    <p className="text-xs text-gray-500">Winners</p>
                  </div>
                  <div className="text-center rounded-lg bg-gray-50 p-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {campaign.max_entries_per_user}
                    </p>
                    <p className="text-xs text-gray-500">Max Entries</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Entry Form + Referral */}
            <div className="space-y-6">
              {/* Entry Form */}
              <div className="card">
                <GiveawayEntryForm
                  campaign={campaign}
                  onEntry={handleEntry}
                  completedMethods={completedMethods}
                  disabled={timeStatus.hasEnded || !timeStatus.isActive}
                />
              </div>

              {/* Referral Widget */}
              <ReferralWidget
                campaign={campaign}
                referralCode={referralCode}
                referralCount={participant?.referral_count || 0}
              />

              {/* Location */}
              {campaign.city && campaign.state && (
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                  <p className="text-sm text-gray-600">
                    {campaign.city}, {campaign.state}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-2">Campaign Dates</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Start:</span>{' '}
                    {new Date(campaign.start_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p>
                    <span className="font-medium">End:</span>{' '}
                    {new Date(campaign.end_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
