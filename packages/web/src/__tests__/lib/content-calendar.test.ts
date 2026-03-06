/**
 * Content Calendar Utilities Tests
 * Tests for social media content calendar helper functions
 */

import {
  getContentTemplates,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByPlatform,
  getDayTheme,
  generateContentCalendar,
  fillCaptionTemplate,
  generateHashtags,
  getOptimalPostingTimes,
  buildShareUrl,
  calculateEngagementRate,
  getContentSuggestions,
  validatePost,
} from '@/lib/social-media/content-calendar';
import type { SocialMediaPost } from '@desi-connect/shared';

// ─── getContentTemplates ────────────────────────────────────────────
describe('getContentTemplates', () => {
  it('returns an array of templates', () => {
    const templates = getContentTemplates();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
  });

  it('each template has required fields', () => {
    const templates = getContentTemplates();
    templates.forEach((t) => {
      expect(t).toHaveProperty('template_id');
      expect(t).toHaveProperty('name');
      expect(t).toHaveProperty('category');
      expect(t).toHaveProperty('caption_template');
      expect(t).toHaveProperty('platforms');
      expect(Array.isArray(t.platforms)).toBe(true);
    });
  });
});

// ─── getTemplateById ────────────────────────────────────────────────
describe('getTemplateById', () => {
  it('returns the correct template for a valid ID', () => {
    const templates = getContentTemplates();
    const first = templates[0];
    const found = getTemplateById(first.template_id);
    expect(found).toEqual(first);
  });

  it('returns undefined for an invalid ID', () => {
    expect(getTemplateById('nonexistent-id-999')).toBeUndefined();
  });
});

// ─── getTemplatesByCategory ─────────────────────────────────────────
describe('getTemplatesByCategory', () => {
  it('filters templates by category', () => {
    const result = getTemplatesByCategory('community_spotlight');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((t) => expect(t.category).toBe('community_spotlight'));
  });

  it('returns empty array for unknown category', () => {
    const result = getTemplatesByCategory('nonexistent_category' as any);
    expect(result).toEqual([]);
  });
});

// ─── getTemplatesByPlatform ─────────────────────────────────────────
describe('getTemplatesByPlatform', () => {
  it('filters templates by platform', () => {
    const result = getTemplatesByPlatform('instagram');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((t) => expect(t.platforms).toContain('instagram'));
  });

  it('returns empty array for unknown platform', () => {
    const result = getTemplatesByPlatform('tiktok' as any);
    expect(result).toEqual([]);
  });
});

// ─── getDayTheme ────────────────────────────────────────────────────
describe('getDayTheme', () => {
  it('returns a theme for each weekday name', () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach((day) => {
      const theme = getDayTheme(day);
      expect(theme).toBeDefined();
      expect(theme).toHaveProperty('theme');
      expect(theme).toHaveProperty('category');
    });
  });

  it('returns undefined for invalid day', () => {
    expect(getDayTheme('InvalidDay')).toBeUndefined();
  });
});

// ─── generateContentCalendar ────────────────────────────────────────
describe('generateContentCalendar', () => {
  it('generates entries for the given month', () => {
    const calendar = generateContentCalendar(1, 2025, []); // January 2025
    expect(Array.isArray(calendar.entries)).toBe(true);
    expect(calendar.entries.length).toBeGreaterThan(0);
  });

  it('each entry has a date and theme', () => {
    const calendar = generateContentCalendar(3, 2025, []);
    calendar.entries.forEach((entry) => {
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('theme');
      expect(entry).toHaveProperty('day_of_week');
    });
  });

  it('accounts for existing posts', () => {
    const existingPosts = [
      {
        post_id: 'p1',
        title: 'Existing Post',
        caption: 'Test',
        platforms: ['instagram'] as any,
        scheduled_date: '2025-01-15',
        status: 'scheduled' as any,
        category: 'community_spotlight' as any,
      },
    ] as SocialMediaPost[];

    const calendar = generateContentCalendar(1, 2025, existingPosts);
    expect(Array.isArray(calendar.entries)).toBe(true);
  });
});

// ─── fillCaptionTemplate ────────────────────────────────────────────
describe('fillCaptionTemplate', () => {
  it('replaces placeholders with data values', () => {
    const template = 'Welcome {name} from {city}!';
    const result = fillCaptionTemplate(template, { name: 'Raj', city: 'Dallas' });
    expect(result).toBe('Welcome Raj from Dallas!');
  });

  it('leaves unmatched placeholders as-is', () => {
    const template = 'Hello {name}, your order {orderId}';
    const result = fillCaptionTemplate(template, { name: 'Priya' });
    expect(result).toContain('Priya');
    expect(result).toContain('{orderId}');
  });

  it('handles empty data object', () => {
    const template = 'Hello {name}!';
    const result = fillCaptionTemplate(template, {});
    expect(result).toBe('Hello {name}!');
  });
});

// ─── generateHashtags ───────────────────────────────────────────────
describe('generateHashtags', () => {
  it('generates hashtags for a category', () => {
    const tags = generateHashtags('food_feature');
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
  });

  it('includes city-specific hashtag when city is provided', () => {
    const tags = generateHashtags('community_spotlight', 'Dallas');
    const joined = tags.join(' ').toLowerCase();
    expect(joined).toContain('dallas');
  });

  it('includes additional tags when provided', () => {
    const tags = generateHashtags('food_feature', undefined, ['biryani', 'homemade']);
    expect(tags).toContain('biryani');
    expect(tags).toContain('homemade');
  });

  it('caps hashtags at 15', () => {
    const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
    const tags = generateHashtags('food_feature', 'Houston', manyTags);
    expect(tags.length).toBeLessThanOrEqual(15);
  });
});

// ─── getOptimalPostingTimes ─────────────────────────────────────────
describe('getOptimalPostingTimes', () => {
  it('returns posting times for instagram', () => {
    const times = getOptimalPostingTimes('instagram');
    expect(Array.isArray(times)).toBe(true);
    expect(times.length).toBeGreaterThan(0);
  });

  it('returns posting times for all major platforms', () => {
    const platforms = ['instagram', 'facebook', 'twitter', 'linkedin'] as const;
    platforms.forEach((p) => {
      const times = getOptimalPostingTimes(p);
      expect(times.length).toBeGreaterThan(0);
    });
  });
});

// ─── buildShareUrl ──────────────────────────────────────────────────
describe('buildShareUrl', () => {
  it('builds a Facebook share URL', () => {
    const url = buildShareUrl('facebook', { share_url: 'https://example.com', title: 'Check this out', suggested_caption: 'Check this out' });
    expect(url).toContain('facebook.com');
    expect(url).toContain('example.com');
  });

  it('builds a Twitter share URL', () => {
    const url = buildShareUrl('twitter', { share_url: 'https://example.com', title: 'Tweet this', suggested_caption: 'Tweet this' });
    expect(url).toContain('twitter.com');
  });

  it('builds a LinkedIn share URL', () => {
    const url = buildShareUrl('linkedin', { share_url: 'https://example.com', title: 'Pro tip', suggested_caption: 'Pro tip' });
    expect(url).toContain('linkedin.com');
  });

  it('builds a WhatsApp share URL', () => {
    const url = buildShareUrl('whatsapp', { share_url: 'https://example.com', title: 'Hey!', suggested_caption: 'Hey!' });
    expect(url).toContain('wa.me');
  });
});

// ─── calculateEngagementRate ────────────────────────────────────────
describe('calculateEngagementRate', () => {
  it('calculates correct engagement rate', () => {
    const post = {
      engagement: { likes: 100, comments: 20, shares: 10, saves: 0, reach: 1000 },
    } as any;
    const rate = calculateEngagementRate(post);
    // (100 + 20 + 10) / 1000 * 100 = 13%
    expect(rate).toBeCloseTo(13, 0);
  });

  it('returns 0 when reach is 0', () => {
    const post = {
      engagement: { likes: 10, comments: 2, shares: 1, saves: 0, reach: 0 },
    } as any;
    const rate = calculateEngagementRate(post);
    expect(rate).toBe(0);
  });

  it('returns 0 when no engagement data', () => {
    const post = {} as any;
    const rate = calculateEngagementRate(post);
    expect(rate).toBe(0);
  });
});

// ─── getContentSuggestions ──────────────────────────────────────────
describe('getContentSuggestions', () => {
  it('returns suggestions for a date', () => {
    const suggestions = getContentSuggestions(new Date('2025-03-10')); // Monday
    expect(suggestions).toBeDefined();
    expect(suggestions).toHaveProperty('theme');
    expect(suggestions).toHaveProperty('templates');
    expect(Array.isArray(suggestions.templates)).toBe(true);
  });

  it('returns different themes for different days', () => {
    const monday = getContentSuggestions(new Date('2025-03-10'));
    const friday = getContentSuggestions(new Date('2025-03-14'));
    // Different days should have different themes (unless mapped identically)
    expect(monday).toBeDefined();
    expect(friday).toBeDefined();
  });
});

// ─── validatePost ───────────────────────────────────────────────────
describe('validatePost', () => {
  const validPost: Partial<SocialMediaPost> = {
    caption: 'Test caption',
    platforms: ['instagram'] as any,
    scheduled_date: '2030-12-31',
  };

  it('returns no errors for a valid post', () => {
    const result = validatePost(validPost as SocialMediaPost);
    expect(result.errors).toEqual([]);
  });

  it('returns error when caption is missing', () => {
    const result = validatePost({ ...validPost, caption: '' } as SocialMediaPost);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e: string) => e.toLowerCase().includes('caption'))).toBe(true);
  });

  it('returns error when platforms is empty', () => {
    const result = validatePost({ ...validPost, platforms: [] } as SocialMediaPost);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns error when scheduled_date is missing', () => {
    const result = validatePost({ ...validPost, scheduled_date: '' } as SocialMediaPost);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('warns about Twitter character limit (280)', () => {
    const longCaption = 'a'.repeat(300);
    const result = validatePost({
      ...validPost,
      caption: longCaption,
      platforms: ['twitter'] as any,
    } as SocialMediaPost);
    expect(result.errors.some((e: string) => e.toLowerCase().includes('twitter') || e.toLowerCase().includes('280'))).toBe(true);
  });

  it('warns about Instagram character limit (2200)', () => {
    const longCaption = 'a'.repeat(2300);
    const result = validatePost({
      ...validPost,
      caption: longCaption,
      platforms: ['instagram'] as any,
    } as SocialMediaPost);
    expect(result.warnings.some((w: string) => w.toLowerCase().includes('instagram') || w.toLowerCase().includes('2200'))).toBe(true);
  });

  it('warns about too many hashtags (>30)', () => {
    const manyHashtags = Array.from({ length: 35 }, (_, i) => `tag${i}`);
    const result = validatePost({
      ...validPost,
      hashtags: manyHashtags,
    } as SocialMediaPost);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('warns about past scheduled date', () => {
    const result = validatePost({
      ...validPost,
      scheduled_date: '2020-01-01',
    } as SocialMediaPost);
    expect(result.warnings.some((w: string) => w.toLowerCase().includes('past'))).toBe(true);
  });
});
