/**
 * Giveaway Campaign utilities
 * Handles referral tracking, entry validation, winner selection, and sharing
 */

import type {
  GiveawayCampaign,
  GiveawayEntry,
  GiveawayParticipant,
  GiveawayWinner,
  GiveawayReferral,
  GiveawayStats,
  GiveawayEntryInput,
  EntryMethod,
  EntryMethodConfig,
  GiveawayStatus,
} from '@desi-connect/shared';

// ─── Referral Code Generation ──────────────────────────────

/**
 * Generate a unique referral code for a participant
 */
export function generateReferralCode(participantName: string, campaignId: string): string {
  const nameClean = participantName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 6)
    .toUpperCase();
  const campaignShort = campaignId.substring(0, 4).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${nameClean}-${campaignShort}-${randomSuffix}`;
}

/**
 * Build a referral share URL
 */
export function buildReferralUrl(
  baseUrl: string,
  campaignId: string,
  referralCode: string
): string {
  return `${baseUrl}/giveaways/${campaignId}?ref=${encodeURIComponent(referralCode)}`;
}

/**
 * Build social share URLs for giveaway referral
 */
export function buildGiveawayShareUrls(
  campaign: GiveawayCampaign,
  referralUrl: string
): Record<string, string> {
  const text = encodeURIComponent(
    `🎉 I just entered to win ${campaign.prize_description}! Enter here for a chance to win too:`
  );
  const url = encodeURIComponent(referralUrl);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    email: `mailto:?subject=${encodeURIComponent(`Win ${campaign.prize_description}!`)}&body=${text}%20${url}`,
  };
}

// ─── Entry Validation ──────────────────────────────────────

/**
 * Validate a giveaway entry
 */
export function validateEntry(
  input: GiveawayEntryInput,
  campaign: GiveawayCampaign,
  existingEntries: GiveawayEntry[] = []
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check campaign status
  if (campaign.status !== 'active') {
    errors.push('This giveaway is not currently active');
  }

  // Check campaign dates
  const now = new Date();
  if (new Date(campaign.start_date) > now) {
    errors.push('This giveaway has not started yet');
  }
  if (new Date(campaign.end_date) < now) {
    errors.push('This giveaway has ended');
  }

  // Check entry method is valid for this campaign
  const methodConfig = campaign.entry_methods.find(
    (m) => m.method === input.entry_method
  );
  if (!methodConfig) {
    errors.push('Invalid entry method for this campaign');
  }

  // Check max entries per method
  if (methodConfig) {
    const methodEntries = existingEntries.filter(
      (e) => e.entry_method === input.entry_method
    );
    if (methodEntries.length >= methodConfig.max_entries) {
      errors.push(`Maximum entries reached for ${methodConfig.label}`);
    }
  }

  // Check total max entries per user
  if (existingEntries.length >= campaign.max_entries_per_user) {
    errors.push('Maximum total entries reached for this campaign');
  }

  // Validate required fields for email signup
  if (input.entry_method === 'email_signup' && !input.email) {
    errors.push('Email is required for email signup entry');
  }

  // Validate email format
  if (input.email && !isValidEmail(input.email)) {
    errors.push('Invalid email address');
  }

  // Validate referral code is not self-referral
  if (input.referral_code && input.email) {
    // This would need server-side check, but we validate the format
    if (input.referral_code.length < 5) {
      errors.push('Invalid referral code');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ─── Campaign Status ──────────────────────────────────────

/**
 * Determine the current status of a campaign based on dates
 */
export function getCampaignTimeStatus(campaign: GiveawayCampaign): {
  isActive: boolean;
  isUpcoming: boolean;
  hasEnded: boolean;
  daysRemaining: number;
  daysUntilStart: number;
  percentComplete: number;
} {
  const now = new Date();
  const start = new Date(campaign.start_date);
  const end = new Date(campaign.end_date);

  const isUpcoming = start > now;
  const hasEnded = end < now;
  const isActive = !isUpcoming && !hasEnded && campaign.status === 'active';

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();

  return {
    isActive,
    isUpcoming,
    hasEnded,
    daysRemaining: hasEnded ? 0 : Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
    daysUntilStart: isUpcoming ? Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
    percentComplete: hasEnded ? 100 : isUpcoming ? 0 : Math.min(100, Math.round((elapsed / totalDuration) * 100)),
  };
}

/**
 * Format countdown text
 */
export function formatCountdown(campaign: GiveawayCampaign): string {
  const status = getCampaignTimeStatus(campaign);

  if (status.hasEnded) {
    return 'This giveaway has ended';
  }

  if (status.isUpcoming) {
    if (status.daysUntilStart === 1) return 'Starts tomorrow!';
    return `Starts in ${status.daysUntilStart} days`;
  }

  if (status.daysRemaining === 0) return 'Last day to enter!';
  if (status.daysRemaining === 1) return 'Ends tomorrow!';
  if (status.daysRemaining <= 3) return `Only ${status.daysRemaining} days left!`;
  return `${status.daysRemaining} days remaining`;
}

// ─── Points & Scoring ──────────────────────────────────────

/**
 * Calculate total points for a participant
 */
export function calculateParticipantPoints(entries: GiveawayEntry[]): number {
  return entries.reduce((total, entry) => total + entry.points_earned, 0);
}

/**
 * Calculate the entry weight/chance for a participant (weighted by points)
 */
export function calculateWinChance(
  participantPoints: number,
  totalPointsInCampaign: number
): number {
  if (totalPointsInCampaign === 0) return 0;
  return Number(((participantPoints / totalPointsInCampaign) * 100).toFixed(2));
}

/**
 * Get entry method breakdown for a participant
 */
export function getEntryMethodBreakdown(
  entries: GiveawayEntry[],
  entryMethods: EntryMethodConfig[]
): Array<{
  method: EntryMethod;
  label: string;
  completed: number;
  max: number;
  points: number;
  isMaxed: boolean;
}> {
  return entryMethods.map((config) => {
    const methodEntries = entries.filter((e) => e.entry_method === config.method);
    const totalPoints = methodEntries.reduce((sum, e) => sum + e.points_earned, 0);

    return {
      method: config.method,
      label: config.label,
      completed: methodEntries.length,
      max: config.max_entries,
      points: totalPoints,
      isMaxed: methodEntries.length >= config.max_entries,
    };
  });
}

// ─── Winner Selection ──────────────────────────────────────

/**
 * Select random winners from participants using weighted random selection
 * Points-based: more points = more chances to win
 */
export function selectWinners(
  participants: GiveawayParticipant[],
  winnerCount: number,
  seed?: number
): GiveawayParticipant[] {
  if (participants.length === 0) return [];
  if (participants.length <= winnerCount) return [...participants];

  const rng = seed !== undefined ? createSeededRandom(seed) : Math.random;

  // Build weighted pool
  const weightedPool: { participant: GiveawayParticipant; weight: number }[] = participants.map(
    (p) => ({
      participant: p,
      weight: Math.max(1, p.total_points), // Minimum weight of 1
    })
  );

  const winners: GiveawayParticipant[] = [];
  const selectedIds = new Set<string>();

  while (winners.length < winnerCount && selectedIds.size < participants.length) {
    const remainingWeight = weightedPool
      .filter(item => !selectedIds.has(item.participant.participant_id))
      .reduce((sum, item) => sum + item.weight, 0);
    let random = rng() * remainingWeight;
    for (const item of weightedPool) {
      if (selectedIds.has(item.participant.participant_id)) continue;
      random -= item.weight;
      if (random <= 0) {
        winners.push(item.participant);
        selectedIds.add(item.participant.participant_id);
        break;
      }
    }
  }

  return winners;
}

/**
 * Create a seeded random number generator for reproducible results
 */
function createSeededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// ─── Statistics ──────────────────────────────────────

/**
 * Calculate campaign statistics from entries and participants
 */
export function calculateCampaignStats(
  campaignId: string,
  entries: GiveawayEntry[],
  participants: GiveawayParticipant[]
): GiveawayStats {
  const today = new Date().toISOString().split('T')[0];

  const entriesToday = entries.filter(
    (e) => e.created_at.startsWith(today)
  );

  const participantsToday = participants.filter(
    (p) => p.joined_at.startsWith(today)
  );

  const referralEntries = entries.filter((e) => e.entry_method === 'referral');

  // Top referrers
  const referrerMap = new Map<string, { name: string; count: number }>();
  participants.forEach((p) => {
    if (p.referral_count > 0) {
      referrerMap.set(p.participant_id, {
        name: p.name,
        count: p.referral_count,
      });
    }
  });
  const topReferrers = Array.from(referrerMap.entries())
    .map(([id, data]) => ({
      participant_id: id,
      name: data.name,
      referral_count: data.count,
    }))
    .sort((a, b) => b.referral_count - a.referral_count)
    .slice(0, 10);

  // Entry method breakdown
  const methodCounts = new Map<EntryMethod, number>();
  entries.forEach((e) => {
    methodCounts.set(e.entry_method, (methodCounts.get(e.entry_method) || 0) + 1);
  });
  const totalEntries = entries.length;
  const entryMethodBreakdown = Array.from(methodCounts.entries()).map(([method, count]) => ({
    method,
    count,
    percentage: totalEntries > 0 ? Number(((count / totalEntries) * 100).toFixed(1)) : 0,
  }));

  // Daily entries (last 30 days)
  const dailyMap = new Map<string, { entries: number; participants: Set<string> }>();
  entries.forEach((e) => {
    const date = e.created_at.split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { entries: 0, participants: new Set() });
    }
    const day = dailyMap.get(date)!;
    day.entries++;
    day.participants.add(e.participant_id);
  });
  const dailyEntries = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      entries: data.entries,
      participants: data.participants.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // City breakdown
  const cityMap = new Map<string, { state: string; count: number }>();
  participants.forEach((p) => {
    if (p.city && p.state) {
      const key = `${p.city}-${p.state}`;
      if (!cityMap.has(key)) {
        cityMap.set(key, { state: p.state, count: 0 });
      }
      cityMap.get(key)!.count++;
    }
  });
  const cityBreakdown = Array.from(cityMap.entries())
    .map(([key, data]) => ({
      city: key.split('-')[0],
      state: data.state,
      participants: data.count,
    }))
    .sort((a, b) => b.participants - a.participants);

  return {
    campaign_id: campaignId,
    total_entries: entries.length,
    total_participants: participants.length,
    entries_today: entriesToday.length,
    participants_today: participantsToday.length,
    referral_entries: referralEntries.length,
    top_referrers: topReferrers,
    entry_method_breakdown: entryMethodBreakdown,
    daily_entries: dailyEntries,
    city_breakdown: cityBreakdown,
  };
}

// ─── Formatting ──────────────────────────────────────

/**
 * Format prize value for display
 */
export function formatPrizeValue(value: string): string {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

/**
 * Format entry count for display
 */
export function formatEntryCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

/**
 * Get a human-readable label for an entry method
 */
export function getEntryMethodLabel(method: EntryMethod): string {
  const labels: Record<EntryMethod, string> = {
    email_signup: 'Sign up with email',
    social_share: 'Share on social media',
    referral: 'Refer a friend',
    newsletter_subscribe: 'Subscribe to newsletter',
    whatsapp_subscribe: 'Join WhatsApp community',
    visit_business: 'Visit a local business',
    leave_review: 'Leave a review',
    submit_event: 'Submit an event',
    daily_visit: 'Visit daily',
  };
  return labels[method] || method;
}

/**
 * Get emoji icon for an entry method
 */
export function getEntryMethodIcon(method: EntryMethod): string {
  const icons: Record<EntryMethod, string> = {
    email_signup: '📧',
    social_share: '📱',
    referral: '👥',
    newsletter_subscribe: '📰',
    whatsapp_subscribe: '💬',
    visit_business: '🏪',
    leave_review: '⭐',
    submit_event: '📅',
    daily_visit: '🔄',
  };
  return icons[method] || '✅';
}

// ─── Helpers ──────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
