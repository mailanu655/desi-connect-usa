import Link from 'next/link';
import Image from 'next/image';
import type { GiveawayCampaign } from '@desi-connect/shared';
import { getCampaignTimeStatus, formatCountdown, formatPrizeValue, formatEntryCount } from '@/lib/giveaway/giveaway-utils';

interface GiveawayCardProps {
  campaign: GiveawayCampaign;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  paused: 'bg-yellow-100 text-yellow-700',
  ended: 'bg-red-100 text-red-600',
  cancelled: 'bg-red-100 text-red-600',
};

export default function GiveawayCard({ campaign }: GiveawayCardProps) {
  const timeStatus = getCampaignTimeStatus(campaign);
  const countdown = formatCountdown(campaign);
  const imageUrl = campaign.image_url || '/images/placeholder-giveaway.jpg';

  return (
    <Link href={`/giveaways/${campaign.campaign_id}`}>
      <div
        className={`card cursor-pointer transition-shadow hover:shadow-lg ${
          timeStatus.hasEnded ? 'opacity-75' : ''
        }`}
        data-testid="giveaway-card"
      >
        {/* Image */}
        <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={imageUrl}
            alt={campaign.title}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {timeStatus.hasEnded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-lg font-bold text-white">Ended</span>
            </div>
          )}
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                statusColors[campaign.status] || 'bg-gray-100 text-gray-600'
              }`}
              data-testid="campaign-status"
            >
              {campaign.status}
            </span>
          </div>
        </div>

        {/* Sponsor */}
        <p className="text-xs font-semibold text-gray-500 uppercase">
          {campaign.sponsor_name}
        </p>

        {/* Title */}
        <h3 className="mt-1 font-heading text-lg font-bold text-gray-900 line-clamp-2 hover:text-saffron-600">
          {campaign.title}
        </h3>

        {/* Prize */}
        <div className="mt-2">
          <span className="inline-block rounded-lg bg-saffron-100 px-3 py-1 text-sm font-bold text-saffron-700">
            {campaign.prize_description}
          </span>
          {campaign.prize_value && (
            <span className="ml-2 text-sm font-semibold text-gray-600">
              {formatPrizeValue(campaign.prize_value)}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {campaign.description}
        </p>

        {/* Progress Bar */}
        {timeStatus.isActive && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-gray-200">
              <div
                className="h-1.5 rounded-full bg-saffron-500 transition-all"
                style={{ width: `${timeStatus.percentComplete}%` }}
                data-testid="progress-bar"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <span
            className={`text-xs font-semibold ${
              timeStatus.hasEnded
                ? 'text-red-600'
                : timeStatus.daysRemaining <= 3
                  ? 'text-orange-600'
                  : 'text-green-600'
            }`}
            data-testid="countdown"
          >
            {countdown}
          </span>
          {campaign.total_entries !== undefined && (
            <span className="text-xs text-gray-500" data-testid="entry-count">
              {formatEntryCount(campaign.total_entries)} entries
            </span>
          )}
        </div>

        {/* Location */}
        {campaign.city && campaign.state && (
          <p className="mt-1 text-xs text-gray-400">
            {campaign.city}, {campaign.state}
          </p>
        )}
      </div>
    </Link>
  );
}
