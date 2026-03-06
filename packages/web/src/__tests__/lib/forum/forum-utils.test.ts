import {
  generateSlug,
  getDefaultCategories,
  formatRelativeTime,
  getReputationLevel,
  truncateBody,
  validateThreadInput,
  validateReplyInput,
  sortThreads,
} from '@/lib/forum/forum-utils';
import type {
  ForumThread,
  CreateThreadInput,
  CreateReplyInput,
} from '@desi-connect/shared';

describe('Forum Utils', () => {
  // ────────────────────────────────────────────────────────────
  // generateSlug Tests
  // ────────────────────────────────────────────────────────────

  describe('generateSlug', () => {
    it('should convert title to lowercase', () => {
      expect(generateSlug('Hello World')).toMatch(/^[a-z0-9-]+$/);
      expect(generateSlug('UPPERCASE')).toBe('uppercase');
    });

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('Hello World Test')).toBe('hello-world-test');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Hello! @World #Test')).toBe('hello-world-test');
      expect(generateSlug('C++ Programming')).toBe('c-programming');
      expect(generateSlug('What\'s up?')).toBe('whats-up');
    });

    it('should replace multiple spaces with single hyphen', () => {
      expect(generateSlug('Hello    World   Test')).toBe('hello-world-test');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(generateSlug('  Hello World  ')).toBe('hello-world');
      expect(generateSlug('-Hello World-')).toBe('hello-world');
    });

    it('should handle multiple consecutive hyphens', () => {
      expect(generateSlug('Hello---World')).toBe('hello-world');
    });

    it('should handle edge cases', () => {
      expect(generateSlug('')).toBe('');
      expect(generateSlug('   ')).toBe('');
      expect(generateSlug('---')).toBe('');
      expect(generateSlug('123')).toBe('123');
    });

    it('should handle real-world examples', () => {
      expect(generateSlug('Best Immigration Lawyers in California')).toBe(
        'best-immigration-lawyers-in-california'
      );
      expect(generateSlug('How to Start a Business?')).toBe('how-to-start-a-business');
      expect(generateSlug('H1B Visa FAQ & Tips')).toBe('h1b-visa-faq-tips');
    });
  });

  // ────────────────────────────────────────────────────────────
  // getDefaultCategories Tests
  // ────────────────────────────────────────────────────────────

  describe('getDefaultCategories', () => {
    it('should return exactly 8 categories', () => {
      const categories = getDefaultCategories();
      expect(categories).toHaveLength(8);
    });

    it('should return categories with required properties', () => {
      const categories = getDefaultCategories();
      categories.forEach((cat) => {
        expect(cat).toHaveProperty('category_id');
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('slug');
        expect(cat).toHaveProperty('description');
        expect(cat).toHaveProperty('icon');
        expect(cat).toHaveProperty('post_count');
        expect(cat).toHaveProperty('last_post_at');
        expect(cat).toHaveProperty('sort_order');
      });
    });

    it('should have categories with correct initial values', () => {
      const categories = getDefaultCategories();
      categories.forEach((cat) => {
        expect(cat.post_count).toBe(0);
        expect(cat.last_post_at).toBeNull();
        expect(typeof cat.sort_order).toBe('number');
      });
    });

    it('should include all expected categories', () => {
      const categories = getDefaultCategories();
      const categoryIds = categories.map((c) => c.category_id);

      expect(categoryIds).toContain('immigration');
      expect(categoryIds).toContain('jobs');
      expect(categoryIds).toContain('business');
      expect(categoryIds).toContain('food');
      expect(categoryIds).toContain('events');
      expect(categoryIds).toContain('housing');
      expect(categoryIds).toContain('general');
      expect(categoryIds).toContain('feedback');
    });

    it('should have categories in correct sort order', () => {
      const categories = getDefaultCategories();
      for (let i = 0; i < categories.length; i++) {
        expect(categories[i].sort_order).toBe(i + 1);
      }
    });

    it('should have unique category IDs and slugs', () => {
      const categories = getDefaultCategories();
      const ids = categories.map((c) => c.category_id);
      const slugs = categories.map((c) => c.slug);

      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it('should have valid icon names', () => {
      const categories = getDefaultCategories();
      const validIcons = ['passport', 'briefcase', 'building', 'utensils', 'calendar', 'home', 'message-circle', 'lightbulb'];
      categories.forEach((cat) => {
        expect(validIcons).toContain(cat.icon);
      });
    });

    it('should return new array on each call', () => {
      const cat1 = getDefaultCategories();
      const cat2 = getDefaultCategories();
      expect(cat1).not.toBe(cat2);
    });
  });

  // ────────────────────────────────────────────────────────────
  // formatRelativeTime Tests
  // ────────────────────────────────────────────────────────────

  describe('formatRelativeTime', () => {
    it('should return "just now" for recent dates (< 60 seconds)', () => {
      const now = new Date();
      const secondsAgo = new Date(now.getTime() - 30 * 1000);
      expect(formatRelativeTime(secondsAgo.toISOString())).toBe('just now');
    });

    it('should return "X minute(s) ago" for dates within 60 minutes', () => {
      const now = new Date();
      const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatRelativeTime(minutesAgo.toISOString())).toBe('5 minutes ago');

      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
      expect(formatRelativeTime(oneMinuteAgo.toISOString())).toBe('1 minute ago');
    });

    it('should return "X hour(s) ago" for dates within 24 hours', () => {
      const now = new Date();
      const hoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(hoursAgo.toISOString())).toBe('2 hours ago');

      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneHourAgo.toISOString())).toBe('1 hour ago');
    });

    it('should return "X day(s) ago" for dates within 7 days', () => {
      const now = new Date();
      const daysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(daysAgo.toISOString())).toBe('3 days ago');

      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneDayAgo.toISOString())).toBe('1 day ago');
    });

    it('should return "X week(s) ago" for dates within 4 weeks', () => {
      const now = new Date();
      const weeksAgo = new Date(now.getTime() - 2 * 7 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(weeksAgo.toISOString())).toBe('2 weeks ago');

      const oneWeekAgo = new Date(now.getTime() - 1 * 7 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneWeekAgo.toISOString())).toBe('1 week ago');
    });

    it('should return "X month(s) ago" for dates within 12 months', () => {
      const now = new Date();
      const monthsAgo = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(monthsAgo.toISOString())).toBe('3 months ago');

      const oneMonthAgo = new Date(now.getTime() - 1 * 30 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneMonthAgo.toISOString())).toBe('1 month ago');
    });

    it('should return "X year(s) ago" for dates older than 12 months', () => {
      const now = new Date();
      const yearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(yearsAgo.toISOString())).toBe('2 years ago');

      const oneYearAgo = new Date(now.getTime() - 1 * 365 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneYearAgo.toISOString())).toBe('1 year ago');
    });

    it('should use singular form for single unit', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
      const text = formatRelativeTime(oneMinuteAgo.toISOString());
      expect(text).toContain('1 minute ago');
      expect(text).not.toContain('minutes');
    });

    it('should use plural form for multiple units', () => {
      const now = new Date();
      const minutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
      const text = formatRelativeTime(minutesAgo.toISOString());
      expect(text).toContain('2 minutes ago');
    });
  });

  // ────────────────────────────────────────────────────────────
  // getReputationLevel Tests
  // ────────────────────────────────────────────────────────────

  describe('getReputationLevel', () => {
    it('should return "newbie" for score < 10', () => {
      const result = getReputationLevel(5);
      expect(result.level).toBe('newbie');
      expect(result.title).toBe('Newbie');
      expect(result.color).toBe('#6B7280');
    });

    it('should return "newbie" for score = 9', () => {
      const result = getReputationLevel(9);
      expect(result.level).toBe('newbie');
    });

    it('should return "contributor" for score 10-49', () => {
      const result = getReputationLevel(25);
      expect(result.level).toBe('contributor');
      expect(result.title).toBe('Contributor');
      expect(result.color).toBe('#3B82F6');
    });

    it('should return "contributor" for score = 10', () => {
      const result = getReputationLevel(10);
      expect(result.level).toBe('contributor');
    });

    it('should return "contributor" for score = 49', () => {
      const result = getReputationLevel(49);
      expect(result.level).toBe('contributor');
    });

    it('should return "member" for score 50-99', () => {
      const result = getReputationLevel(75);
      expect(result.level).toBe('member');
      expect(result.title).toBe('Member');
      expect(result.color).toBe('#10B981');
    });

    it('should return "member" for score = 50', () => {
      const result = getReputationLevel(50);
      expect(result.level).toBe('member');
    });

    it('should return "member" for score = 99', () => {
      const result = getReputationLevel(99);
      expect(result.level).toBe('member');
    });

    it('should return "trusted" for score 100-249', () => {
      const result = getReputationLevel(150);
      expect(result.level).toBe('trusted');
      expect(result.title).toBe('Trusted Member');
      expect(result.color).toBe('#F59E0B');
    });

    it('should return "trusted" for score = 100', () => {
      const result = getReputationLevel(100);
      expect(result.level).toBe('trusted');
    });

    it('should return "trusted" for score = 249', () => {
      const result = getReputationLevel(249);
      expect(result.level).toBe('trusted');
    });

    it('should return "expert" for score 250-499', () => {
      const result = getReputationLevel(350);
      expect(result.level).toBe('expert');
      expect(result.title).toBe('Expert');
      expect(result.color).toBe('#8B5CF6');
    });

    it('should return "expert" for score = 250', () => {
      const result = getReputationLevel(250);
      expect(result.level).toBe('expert');
    });

    it('should return "expert" for score = 499', () => {
      const result = getReputationLevel(499);
      expect(result.level).toBe('expert');
    });

    it('should return "moderator" for score 500-999', () => {
      const result = getReputationLevel(750);
      expect(result.level).toBe('moderator');
      expect(result.title).toBe('Moderator');
      expect(result.color).toBe('#DC2626');
    });

    it('should return "moderator" for score = 500', () => {
      const result = getReputationLevel(500);
      expect(result.level).toBe('moderator');
    });

    it('should return "moderator" for score = 999', () => {
      const result = getReputationLevel(999);
      expect(result.level).toBe('moderator');
    });

    it('should return "admin" for score >= 1000', () => {
      const result = getReputationLevel(1000);
      expect(result.level).toBe('admin');
      expect(result.title).toBe('Administrator');
      expect(result.color).toBe('#1F2937');
    });

    it('should return "admin" for high scores', () => {
      const result = getReputationLevel(9999);
      expect(result.level).toBe('admin');
      expect(result.title).toBe('Administrator');
    });

    it('should return "newbie" for zero score', () => {
      const result = getReputationLevel(0);
      expect(result.level).toBe('newbie');
    });

    it('should always return all required properties', () => {
      const levels = [0, 10, 50, 100, 250, 500, 1000];
      levels.forEach((score) => {
        const result = getReputationLevel(score);
        expect(result).toHaveProperty('level');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('color');
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  // truncateBody Tests
  // ────────────────────────────────────────────────────────────

  describe('truncateBody', () => {
    it('should return text as-is if under default limit (200)', () => {
      const text = 'This is a short text';
      expect(truncateBody(text)).toBe(text);
    });

    it('should return text as-is if exactly at default limit', () => {
      const text = 'a'.repeat(200);
      expect(truncateBody(text)).toBe(text);
    });

    it('should truncate text over default limit with ellipsis', () => {
      const text = 'a'.repeat(250);
      const result = truncateBody(text);
      expect(result.endsWith('...')).toBe(true);
      expect(result.length).toBeLessThan(text.length);
    });

    it('should respect custom maxLength parameter', () => {
      const text = 'This is a longer text for testing custom max length';
      const result = truncateBody(text, 10);
      expect(result.endsWith('...')).toBe(true);
      expect(result).toContain('This');
    });

    it('should trim whitespace before adding ellipsis', () => {
      const text = 'This is a text with lots of spaces          and more content';
      const result = truncateBody(text, 20);
      expect(result.endsWith('...')).toBe(true);
      expect(result.endsWith('   ...')).toBe(false);
    });

    it('should handle very small maxLength', () => {
      const text = 'Hello World';
      const result = truncateBody(text, 3);
      expect(result).toBe('Hel...');
    });

    it('should handle single character truncation', () => {
      const text = 'ab';
      const result = truncateBody(text, 1);
      expect(result).toBe('a...');
    });

    it('should preserve text under custom limit', () => {
      const text = 'Short';
      expect(truncateBody(text, 100)).toBe(text);
    });

    it('should handle empty string', () => {
      expect(truncateBody('')).toBe('');
    });

    it('should handle only spaces', () => {
      const text = '     ';
      const result = truncateBody(text, 3);
      expect(result).toBeTruthy();
    });

    it('should handle real-world forum content', () => {
      const longContent =
        'This is a forum post about immigration laws and how they affect the Indian diaspora. This is a long discussion that covers multiple aspects of immigration policy...';
      const result = truncateBody(longContent, 100);
      expect(result.endsWith('...')).toBe(true);
      expect(result.length).toBeLessThanOrEqual(103);
    });
  });

  // ────────────────────────────────────────────────────────────
  // validateThreadInput Tests
  // ────────────────────────────────────────────────────────────

  describe('validateThreadInput', () => {
    const validInput: CreateThreadInput = {
      category_id: 'immigration',
      title: 'How to apply for H1B visa?',
      body: 'This is a detailed question about the H1B visa application process.',
      tags: ['visa', 'immigration'],
    };

    it('should validate correct input', () => {
      const result = validateThreadInput(validInput);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require category_id', () => {
      const input = { ...validInput, category_id: '' };
      const result = validateThreadInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Category is required');
    });

    it('should require title', () => {
      const input = { ...validInput, title: '' };
      const result = validateThreadInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('should enforce minimum title length (5 characters)', () => {
      const input = { ...validInput, title: 'Help' };
      const result = validateThreadInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title must be at least 5 characters');
    });

    it('should allow title with exactly 5 characters', () => {
      const input = { ...validInput, title: 'Hello' };
      const result = validateThreadInput(input);
      expect(result.errors).not.toContain('Title must be at least 5 characters');
    });

    it('should enforce maximum title length (200 characters)', () => {
      const input = { ...validInput, title: 'a'.repeat(201) };
      const result = validateThreadInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title must be less than 200 characters');
    });

    it('should allow title with exactly 200 characters', () => {
      const input = { ...validInput, title: 'a'.repeat(200) };
      const result = validateThreadInput(input);
      expect(result.errors).not.toContain('Title must be less than 200 characters');
    });

    it('should require body', () => {
      const input = { ...validInput, body: '' };
      const result = validateThreadInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description is required');
    });

    it('should enforce minimum body length (10 characters)', () => {
      const input = { ...validInput, body: 'Short' };
      const result = validateThreadInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description must be at least 10 characters');
    });

    it('should allow body with exactly 10 characters', () => {
      const input = { ...validInput, body: 'a'.repeat(10) };
      const result = validateThreadInput(input);
      expect(result.errors).not.toContain('Description must be at least 10 characters');
    });

    it('should enforce maximum body length (5000 characters)', () => {
      const input = { ...validInput, body: 'a'.repeat(5001) };
      const result = validateThreadInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description must be less than 5000 characters');
    });

    it('should allow body with exactly 5000 characters', () => {
      const input = { ...validInput, body: 'a'.repeat(5000) };
      const result = validateThreadInput(input);
      expect(result.errors).not.toContain('Description must be less than 5000 characters');
    });

    it('should enforce maximum tag count (5 tags)', () => {
      const input = {
        ...validInput,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],
      };
      const result = validateThreadInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Maximum 5 tags allowed');
    });

    it('should allow exactly 5 tags', () => {
      const input = {
        ...validInput,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      };
      const result = validateThreadInput(input);
      expect(result.errors).not.toContain('Maximum 5 tags allowed');
    });

    it('should enforce maximum tag length (30 characters)', () => {
      const input = {
        ...validInput,
        tags: ['a'.repeat(31)],
      };
      const result = validateThreadInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Each tag must be less than 30 characters');
    });

    it('should allow tag with exactly 30 characters', () => {
      const input = {
        ...validInput,
        tags: ['a'.repeat(30)],
      };
      const result = validateThreadInput(input);
      expect(result.errors).not.toContain('Each tag must be less than 30 characters');
    });

    it('should allow empty tags array', () => {
      const input = { ...validInput, tags: [] };
      const result = validateThreadInput(input);
      expect(result.valid).toBe(true);
    });

    it('should return multiple errors', () => {
      const input = {
        ...validInput,
        title: 'Hi',
        body: 'Short',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],
      };
      const result = validateThreadInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  // ────────────────────────────────────────────────────────────
  // validateReplyInput Tests
  // ────────────────────────────────────────────────────────────

  describe('validateReplyInput', () => {
    const validInput: CreateReplyInput = {
      thread_id: 'thread-123',
      body: 'This is a helpful reply to the forum thread.',
    };

    it('should validate correct input', () => {
      const result = validateReplyInput(validInput);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require thread_id', () => {
      const input = { ...validInput, thread_id: '' };
      const result = validateReplyInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Thread ID is required');
    });

    it('should require body', () => {
      const input = { ...validInput, body: '' };
      const result = validateReplyInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Reply text is required');
    });

    it('should enforce minimum body length (3 characters)', () => {
      const input = { ...validInput, body: 'Hi' };
      const result = validateReplyInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Reply must be at least 3 characters');
    });

    it('should allow body with exactly 3 characters', () => {
      const input = { ...validInput, body: 'Yes' };
      const result = validateReplyInput(input);
      expect(result.errors).not.toContain('Reply must be at least 3 characters');
    });

    it('should enforce maximum body length (3000 characters)', () => {
      const input = { ...validInput, body: 'a'.repeat(3001) };
      const result = validateReplyInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Reply must be less than 3000 characters');
    });

    it('should allow body with exactly 3000 characters', () => {
      const input = { ...validInput, body: 'a'.repeat(3000) };
      const result = validateReplyInput(input);
      expect(result.errors).not.toContain('Reply must be less than 3000 characters');
    });

    it('should return multiple errors', () => {
      const input = {
        thread_id: '',
        body: 'Hi',
      };
      const result = validateReplyInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should trim whitespace in validation', () => {
      const input = { ...validInput, thread_id: '  ' };
      const result = validateReplyInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Thread ID is required');
    });
  });

  // ────────────────────────────────────────────────────────────
  // sortThreads Tests
  // ────────────────────────────────────────────────────────────

  describe('sortThreads', () => {
    const createThread = (
      overrides?: Partial<ForumThread>
    ): ForumThread => ({
      thread_id: 'thread-1',
      category_id: 'general',
      title: 'Test Thread',
      body: 'Test body',
      author_id: 'user-1',
      author_name: 'Test User',
      author_avatar: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_reply_at: null,
      reply_count: 0,
      view_count: 0,
      like_count: 0,
      is_pinned: false,
      tags: [],
      city: null,
      state: null,
      ...overrides,
    });

    describe('recent sort', () => {
      it('should sort by last_reply_at descending', () => {
        const now = new Date();
        const threads = [
          createThread({
            thread_id: 'thread-1',
            created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
            last_reply_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
          }),
          createThread({
            thread_id: 'thread-2',
            created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
            last_reply_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
          }),
          createThread({
            thread_id: 'thread-3',
            created_at: new Date(now.getTime() - 1 * 60 * 1000).toISOString(),
            last_reply_at: new Date(now.getTime() - 1 * 60 * 1000).toISOString(),
          }),
        ];

        const sorted = sortThreads(threads, 'recent');
        expect(sorted[0].thread_id).toBe('thread-3');
        expect(sorted[1].thread_id).toBe('thread-1');
        expect(sorted[2].thread_id).toBe('thread-2');
      });

      it('should use created_at as fallback if no last_reply_at', () => {
        const now = new Date();
        const threads = [
          createThread({
            thread_id: 'thread-1',
            created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
            last_reply_at: null,
          }),
          createThread({
            thread_id: 'thread-2',
            created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
            last_reply_at: null,
          }),
        ];

        const sorted = sortThreads(threads, 'recent');
        expect(sorted[0].thread_id).toBe('thread-2');
        expect(sorted[1].thread_id).toBe('thread-1');
      });
    });

    describe('popular sort', () => {
      it('should sort by weighted popularity formula', () => {
        const threads = [
          createThread({
            thread_id: 'thread-1',
            view_count: 100,
            reply_count: 5,
            like_count: 10,
          }),
          createThread({
            thread_id: 'thread-2',
            view_count: 50,
            reply_count: 20,
            like_count: 5,
          }),
        ];

        const sorted = sortThreads(threads, 'popular');
        expect(sorted[0].thread_id).toBe('thread-1');
        expect(sorted[1].thread_id).toBe('thread-2');
      });

      it('should weight likes higher than replies, replies higher than views', () => {
        const threads = [
          createThread({
            thread_id: 'thread-1',
            view_count: 1000,
            reply_count: 0,
            like_count: 0,
          }),
          createThread({
            thread_id: 'thread-2',
            view_count: 0,
            reply_count: 100,
            like_count: 0,
          }),
          createThread({
            thread_id: 'thread-3',
            view_count: 0,
            reply_count: 0,
            like_count: 50,
          }),
        ];

        const sorted = sortThreads(threads, 'popular');
        expect(sorted[0].thread_id).toBe('thread-1');
        expect(sorted[1].thread_id).toBe('thread-2');
        expect(sorted[2].thread_id).toBe('thread-3');
      });

      it('should handle all zeros', () => {
        const threads = [
          createThread({
            thread_id: 'thread-1',
            view_count: 0,
            reply_count: 0,
            like_count: 0,
          }),
          createThread({
            thread_id: 'thread-2',
            view_count: 0,
            reply_count: 0,
            like_count: 0,
          }),
        ];

        const sorted = sortThreads(threads, 'popular');
        expect(sorted).toHaveLength(2);
      });
    });

    describe('unanswered sort', () => {
      it('should filter threads with reply_count === 0', () => {
        const threads = [
          createThread({ thread_id: 'thread-1', reply_count: 0 }),
          createThread({ thread_id: 'thread-2', reply_count: 5 }),
          createThread({ thread_id: 'thread-3', reply_count: 0 }),
          createThread({ thread_id: 'thread-4', reply_count: 3 }),
        ];

        const sorted = sortThreads(threads, 'unanswered');
        expect(sorted).toHaveLength(2);
        expect(sorted.every((t) => t.reply_count === 0)).toBe(true);
      });

      it('should sort unanswered threads by created_at descending', () => {
        const now = new Date();
        const threads = [
          createThread({
            thread_id: 'thread-1',
            reply_count: 0,
            created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
          }),
          createThread({
            thread_id: 'thread-2',
            reply_count: 0,
            created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
          }),
          createThread({
            thread_id: 'thread-3',
            reply_count: 0,
            created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
          }),
        ];

        const sorted = sortThreads(threads, 'unanswered');
        expect(sorted[0].thread_id).toBe('thread-2');
        expect(sorted[1].thread_id).toBe('thread-1');
        expect(sorted[2].thread_id).toBe('thread-3');
      });

      it('should return empty array if no unanswered threads', () => {
        const threads = [
          createThread({ thread_id: 'thread-1', reply_count: 5 }),
          createThread({ thread_id: 'thread-2', reply_count: 3 }),
        ];

        const sorted = sortThreads(threads, 'unanswered');
        expect(sorted).toHaveLength(0);
      });
    });

    it('should not mutate original array', () => {
      const threads = [
        createThread({ thread_id: 'thread-1' }),
        createThread({ thread_id: 'thread-2' }),
      ];
      const original = [...threads];

      sortThreads(threads, 'recent');
      expect(threads).toEqual(original);
    });

    it('should handle empty array', () => {
      const result = sortThreads([], 'recent');
      expect(result).toHaveLength(0);
    });

    it('should handle single thread', () => {
      const threads = [createThread({ thread_id: 'thread-1' })];
      const result = sortThreads(threads, 'recent');
      expect(result).toHaveLength(1);
      expect(result[0].thread_id).toBe('thread-1');
    });
  });
});
