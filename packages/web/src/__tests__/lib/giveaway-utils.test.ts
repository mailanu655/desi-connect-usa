/**
 * Giveaway Utilities Tests
 * Tests for giveaway campaign helper functions
 */

import {
  generateReferralCode,
  buildReferralUrl,
  buildGiveawayShareUrls,
  validateEntry,
  getCampaignTimeStatus,
  formatCountdown,
  calculateParticipantPoints,
  calculateWinChance,
  getEntryMethodBreakdown,
  selectWinners,
  calculateCampaignStats,
  formatPrizeValue,
  formatEntryCount,
  getEntryMethodLabel,
  getEntryMethodIcon,
} from '@/lib/giveaway/giveaway-utils';
import type {
  GiveawayCampaign,
  GiveawayParticipant,
  GiveawayEntry,
  EntryMethod,
  EntryMethodConfig,
} from '@desi-connect/shared';

// ─── Helpers ────────────────────────────────────────────────────────

function makeEntryMethodConfig(
  method: EntryMethod,
  overrides: Partial<EntryMethodConfig> = {}
): EntryMethodConfig {
  return {
    method,
    label: method.replace(/_/g, ' '),
    description: `Description for ${method}`,
    points: 1,
    max_entries: 3,
    is_required: false,
    ...overrides,
  };
}

function makeCampaign(overrides: Partial<GiveawayCampaign> = {}): GiveawayCampaign {
  return {
    campaign_id: 'camp-123',
    title: 'Win a Gift Card',
    description: 'Enter to win!',
    short_description: 'Win big!',
    prize_description: '$100 Amazon Gift Card',
    prize_value: '100',
    sponsor_name: 'Test Sponsor',
    start_date: '2024-01-01',
    end_date: '2030-12-31',
    status: 'active',
    entry_methods: [
      makeEntryMethodConfig('email_signup', { is_required: true }),
      makeEntryMethodConfig('social_share'),
      makeEntryMethodConfig('referral', { points: 5 }),
    ],
    max_entries_per_user: 5,
    winner_count: 1,
    total_entries: 100,
    total_participants: 50,
    share_url: 'https://desi.com/giveaways/camp-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  } as GiveawayCampaign;
}

// ─── generateReferralCode ───────────────────────────────────────────
describe('generateReferralCode', () => {
  it('generates a code containing participant name fragment', () => {
    const code = generateReferralCode('JohnDoe', 'camp-123');
    expect(code).toContain('JOHN');
  });

  it('generates a code containing campaign ID fragment', () => {
    const code = generateReferralCode('Jane', 'campaign-abc');
    expect(code.toUpperCase()).toContain('CAMP');
  });

  it('generates unique codes for different inputs', () => {
    const code1 = generateReferralCode('Alice', 'camp-1');
    const code2 = generateReferralCode('Bob', 'camp-2');
    expect(code1).not.toBe(code2);
  });
});

// ─── buildReferralUrl ───────────────────────────────────────────────
describe('buildReferralUrl', () => {
  it('builds a URL with referral code', () => {
    const url = buildReferralUrl('https://example.com', 'camp-1', 'REF-CODE');
    expect(url).toContain('camp-1');
    expect(url).toContain('REF-CODE');
  });

  it('returns a valid URL', () => {
    const url = buildReferralUrl('https://desi.com', 'c1', 'R1');
    expect(() => new URL(url)).not.toThrow();
  });
});

// ─── buildGiveawayShareUrls ─────────────────────────────────────────
describe('buildGiveawayShareUrls', () => {
  it('returns share URLs for all social platforms', () => {
    const campaign = makeCampaign();
    const referralUrl = 'https://desi.com/giveaways/c1?ref=CODE';
    const urls = buildGiveawayShareUrls(campaign, referralUrl);

    expect(urls).toHaveProperty('facebook');
    expect(urls).toHaveProperty('twitter');
    expect(urls).toHaveProperty('whatsapp');
    expect(urls.facebook).toContain('facebook');
    expect(urls.twitter).toContain('twitter');
  });

  it('includes prize_description in share text', () => {
    const campaign = makeCampaign({ prize_description: 'Amazing Prize Pack' });
    const urls = buildGiveawayShareUrls(campaign, 'https://example.com/ref');
    const allUrls = Object.values(urls).join(' ');
    expect(allUrls).toContain('Amazing');
  });
});

// ─── validateEntry ──────────────────────────────────────────────────
describe('validateEntry', () => {
  const campaign = makeCampaign();

  it('returns valid for a legitimate entry', () => {
    const result = validateEntry(
      { campaign_id: 'camp-123', entry_method: 'email_signup', email: 'test@example.com' },
      campaign,
      []
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects entry for ended campaign', () => {
    const endedCampaign = makeCampaign({ status: 'ended' });
    const result = validateEntry(
      { campaign_id: 'camp-123', entry_method: 'email_signup', email: 'test@example.com' },
      endedCampaign,
      []
    );
    expect(result.valid).toBe(false);
  });

  it('rejects when max entries exceeded', () => {
    const existingEntries = Array.from({ length: 5 }, (_, i) => ({
      entry_id: `e${i}`,
      campaign_id: 'camp-123',
      participant_id: 'p1',
      entry_method: 'social_share' as EntryMethod,
      points_earned: 1,
      is_verified: true,
      created_at: '2025-03-01T00:00:00Z',
    })) as GiveawayEntry[];

    const result = validateEntry(
      { campaign_id: 'camp-123', entry_method: 'email_signup', email: 'test@example.com' },
      campaign,
      existingEntries
    );
    expect(result.valid).toBe(false);
  });

  it('rejects email_signup without email', () => {
    const result = validateEntry(
      { campaign_id: 'camp-123', entry_method: 'email_signup' },
      campaign,
      []
    );
    expect(result.valid).toBe(false);
  });

  it('rejects invalid entry method for campaign', () => {
    const limitedCampaign = makeCampaign({
      entry_methods: [makeEntryMethodConfig('email_signup', { is_required: true })],
    });
    const result = validateEntry(
      { campaign_id: 'camp-123', entry_method: 'social_share' },
      limitedCampaign,
      []
    );
    expect(result.valid).toBe(false);
  });
});

// ─── getCampaignTimeStatus ──────────────────────────────────────────
describe('getCampaignTimeStatus', () => {
  it('shows active for current campaign', () => {
    const campaign = makeCampaign({
      start_date: '2024-01-01',
      end_date: '2030-12-31',
    });
    const status = getCampaignTimeStatus(campaign);
    expect(status.isActive).toBe(true);
    expect(status.hasEnded).toBe(false);
  });

  it('shows ended for past campaign', () => {
    const campaign = makeCampaign({
      start_date: '2020-01-01',
      end_date: '2020-12-31',
    });
    const status = getCampaignTimeStatus(campaign);
    expect(status.hasEnded).toBe(true);
    expect(status.isActive).toBe(false);
  });

  it('shows upcoming for future campaign', () => {
    const campaign = makeCampaign({
      start_date: '2099-01-01',
      end_date: '2099-12-31',
    });
    const status = getCampaignTimeStatus(campaign);
    expect(status.isUpcoming).toBe(true);
    expect(status.isActive).toBe(false);
  });

  it('calculates percent complete for active campaign', () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 5);
    const end = new Date(now);
    end.setDate(end.getDate() + 5);

    const campaign = makeCampaign({
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    });
    const status = getCampaignTimeStatus(campaign);
    expect(status.percentComplete).toBeGreaterThan(0);
    expect(status.percentComplete).toBeLessThan(100);
  });
});

// ─── formatCountdown ────────────────────────────────────────────────
describe('formatCountdown', () => {
  it('returns "Ended" for past campaigns', () => {
    const campaign = makeCampaign({
      start_date: '2020-01-01',
      end_date: '2020-06-01',
    });
    const result = formatCountdown(campaign);
    expect(result.toLowerCase()).toContain('ended');
  });

  it('returns countdown text for active campaigns', () => {
    const campaign = makeCampaign({
      start_date: '2024-01-01',
      end_date: '2030-12-31',
    });
    const result = formatCountdown(campaign);
    expect(result.length).toBeGreaterThan(0);
    expect(result.toLowerCase()).not.toContain('ended');
  });

  it('returns upcoming text for future campaigns', () => {
    const campaign = makeCampaign({
      start_date: '2099-06-01',
      end_date: '2099-12-31',
    });
    const result = formatCountdown(campaign);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── calculateParticipantPoints ─────────────────────────────────────
describe('calculateParticipantPoints', () => {
  it('calculates points from entries', () => {
    const entries = [
      { entry_method: 'email_signup', points_earned: 1 },
      { entry_method: 'social_share', points_earned: 2 },
      { entry_method: 'referral', points_earned: 5 },
    ] as GiveawayEntry[];
    const total = calculateParticipantPoints(entries);
    expect(total).toBe(8);
  });

  it('returns 0 for empty entries', () => {
    expect(calculateParticipantPoints([])).toBe(0);
  });
});

// ─── calculateWinChance ─────────────────────────────────────────────
describe('calculateWinChance', () => {
  it('calculates correct win chance percentage', () => {
    const chance = calculateWinChance(10, 100);
    expect(chance).toBeCloseTo(10, 0);
  });

  it('returns 0 when totalPoints is 0', () => {
    expect(calculateWinChance(5, 0)).toBe(0);
  });

  it('returns over 100% when participant has more points than total', () => {
    const chance = calculateWinChance(200, 100);
    expect(chance).toBe(200);
  });
});

// ─── getEntryMethodBreakdown ────────────────────────────────────────
describe('getEntryMethodBreakdown', () => {
  it('breaks down entries by method', () => {
    const entries = [
      { entry_method: 'email_signup', points_earned: 1 },
      { entry_method: 'email_signup', points_earned: 1 },
      { entry_method: 'social_share', points_earned: 2 },
    ] as GiveawayEntry[];
    const methods: EntryMethodConfig[] = [
      makeEntryMethodConfig('email_signup'),
      makeEntryMethodConfig('social_share'),
      makeEntryMethodConfig('referral'),
    ];

    const breakdown = getEntryMethodBreakdown(entries, methods);
    expect(breakdown).toBeDefined();
    expect(Array.isArray(breakdown)).toBe(true);
    expect(breakdown.length).toBe(3);

    const emailEntry = breakdown.find((b) => b.method === 'email_signup');
    expect(emailEntry?.completed).toBe(2);
    expect(emailEntry?.points).toBe(2);

    const socialEntry = breakdown.find((b) => b.method === 'social_share');
    expect(socialEntry?.completed).toBe(1);

    const referralEntry = breakdown.find((b) => b.method === 'referral');
    expect(referralEntry?.completed).toBe(0);
  });
});

// ─── selectWinners ──────────────────────────────────────────────────
describe('selectWinners', () => {
  const participants = Array.from({ length: 10 }, (_, i) => ({
    participant_id: `p${i}`,
    total_points: (i + 1) * 10,
  })) as GiveawayParticipant[];

  it('selects the correct number of winners', () => {
    const winners = selectWinners(participants, 3);
    expect(winners.length).toBe(3);
  });

  it('does not select more winners than participants', () => {
    const winners = selectWinners(participants, 20);
    expect(winners.length).toBeLessThanOrEqual(participants.length);
  });

  it('returns unique winners', () => {
    const winners = selectWinners(participants, 5);
    const ids = winners.map((w) => w.participant_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('produces deterministic results with same seed', () => {
    const winners1 = selectWinners(participants, 3, 42);
    const winners2 = selectWinners(participants, 3, 42);
    expect(winners1.map((w) => w.participant_id)).toEqual(
      winners2.map((w) => w.participant_id)
    );
  });

  it('produces different results with different seeds', () => {
    const winners1 = selectWinners(participants, 3, 1);
    const winners2 = selectWinners(participants, 3, 2);
    const ids1 = winners1.map((w) => w.participant_id).sort();
    const ids2 = winners2.map((w) => w.participant_id).sort();
    // At least one winner should differ (probabilistic but almost certain with 10 participants)
    expect(ids1.join(',') === ids2.join(',')).toBe(false);
  });
});

// ─── calculateCampaignStats ─────────────────────────────────────────
describe('calculateCampaignStats', () => {
  it('calculates stats from entries and participants', () => {
    const entries = [
      {
        entry_id: 'e1',
        campaign_id: 'camp-123',
        participant_id: 'p1',
        entry_method: 'email_signup' as EntryMethod,
        points_earned: 1,
        is_verified: true,
        created_at: '2025-03-01T00:00:00Z',
      },
      {
        entry_id: 'e2',
        campaign_id: 'camp-123',
        participant_id: 'p1',
        entry_method: 'social_share' as EntryMethod,
        points_earned: 2,
        is_verified: true,
        created_at: '2025-03-01T00:00:00Z',
      },
    ] as GiveawayEntry[];

    const participants = [
      {
        participant_id: 'p1',
        campaign_id: 'camp-123',
        name: 'Test User',
        email: 'test@example.com',
        total_entries: 2,
        total_points: 3,
        referral_code: 'REF-123',
        referral_count: 0,
        referral_entries: 0,
        entries: [],
        joined_at: '2025-03-01T00:00:00Z',
      },
    ] as GiveawayParticipant[];

    const stats = calculateCampaignStats('camp-123', entries, participants);
    expect(stats).toBeDefined();
    expect(stats.total_entries).toBe(2);
    expect(stats.total_participants).toBe(1);
  });

  it('handles empty inputs', () => {
    const stats = calculateCampaignStats('camp-123', [], []);
    expect(stats.total_entries).toBe(0);
    expect(stats.total_participants).toBe(0);
  });
});

// ─── formatPrizeValue ───────────────────────────────────────────────
describe('formatPrizeValue', () => {
  it('formats integer value as USD', () => {
    const result = formatPrizeValue('100');
    expect(result).toContain('100');
    expect(result).toContain('$');
  });

  it('formats decimal value (rounds to whole number)', () => {
    const result = formatPrizeValue('49.99');
    // Intl.NumberFormat with maximumFractionDigits:0 rounds 49.99 → $50
    expect(result).toContain('50');
  });

  it('handles zero', () => {
    const result = formatPrizeValue('0');
    expect(result).toContain('0');
  });

  it('handles non-numeric string', () => {
    const result = formatPrizeValue('Free Meals');
    expect(result).toBe('Free Meals');
  });
});

// ─── formatEntryCount ───────────────────────────────────────────────
describe('formatEntryCount', () => {
  it('returns number as-is for small values', () => {
    expect(formatEntryCount(42)).toBe('42');
  });

  it('formats thousands with K suffix', () => {
    const result = formatEntryCount(1500);
    expect(result).toContain('K');
  });

  it('formats millions with M suffix', () => {
    const result = formatEntryCount(2500000);
    expect(result).toContain('M');
  });

  it('handles zero', () => {
    expect(formatEntryCount(0)).toBe('0');
  });
});

// ─── getEntryMethodLabel ────────────────────────────────────────────
describe('getEntryMethodLabel', () => {
  it('returns human-readable label for each method', () => {
    const methods: EntryMethod[] = [
      'email_signup',
      'social_share',
      'referral',
      'daily_visit',
      'newsletter_subscribe',
    ];
    methods.forEach((m) => {
      const label = getEntryMethodLabel(m);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });
  });
});

// ─── getEntryMethodIcon ─────────────────────────────────────────────
describe('getEntryMethodIcon', () => {
  it('returns an icon string for each method', () => {
    const methods: EntryMethod[] = ['email_signup', 'social_share', 'referral'];
    methods.forEach((m) => {
      const icon = getEntryMethodIcon(m);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    });
  });
});
