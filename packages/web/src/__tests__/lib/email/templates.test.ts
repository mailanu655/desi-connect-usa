/**
 * Email Templates Tests
 * Tests for all email template generators and utilities
 */

import {
  escapeHtml,
  generateWelcomeEmail,
  generateWeeklyDigestEmail,
  generateImmigrationAlertEmail,
  type WelcomeEmailData,
  type WeeklyDigestData,
  type ImmigrationAlertData,
  type DigestItem,
  type EmailTemplate,
} from '@/lib/email/templates';

// ── Test Data Factories ──────────────────────────────────────────────

function createWelcomeData(overrides?: Partial<WelcomeEmailData>): WelcomeEmailData {
  return {
    name: 'Rajesh Kumar',
    digestTypes: ['community', 'immigration'],
    frequency: 'weekly',
    preferencesUrl: 'https://desiconnectusa.com/email-preferences?email=test@example.com',
    unsubscribeUrl: 'https://desiconnectusa.com/unsubscribe?email=test@example.com',
    ...overrides,
  };
}

function createDigestItem(overrides?: Partial<DigestItem>): DigestItem {
  return {
    title: 'Test Article',
    summary: 'A brief summary of the article',
    url: 'https://example.com/article',
    category: 'community',
    ...overrides,
  };
}

function createWeeklyDigestData(overrides?: Partial<WeeklyDigestData>): WeeklyDigestData {
  return {
    name: 'Priya Sharma',
    date: 'March 3, 2026',
    items: [
      createDigestItem({
        title: 'Desi Food Festival in Houston',
        summary: 'Annual Indian food festival returns with 50+ vendors',
        url: 'https://example.com/food-festival',
        category: 'events',
      }),
      createDigestItem({
        title: 'New H-1B Lottery Results',
        summary: 'USCIS announces FY2027 H-1B lottery selections',
        url: 'https://example.com/h1b-lottery',
        category: 'immigration',
      }),
      createDigestItem({
        title: 'Community Meetup in Dallas',
        summary: 'Monthly networking event for professionals',
        url: 'https://example.com/meetup',
        category: 'community',
      }),
    ],
    preferencesUrl: 'https://desiconnectusa.com/email-preferences?email=test@example.com',
    unsubscribeUrl: 'https://desiconnectusa.com/unsubscribe?email=test@example.com',
    ...overrides,
  };
}

function createImmigrationAlertData(
  overrides?: Partial<ImmigrationAlertData>,
): ImmigrationAlertData {
  return {
    name: 'Anil Patel',
    alertTitle: 'H-1B Cap Season Filing Deadline Approaching',
    category: 'H-1B Visa',
    summary: 'USCIS has announced the filing window for H-1B cap-subject petitions.',
    details:
      'The filing period opens April 1 and employers must submit petitions by April 30.\nEnsure your employer has completed the LCA process.',
    sourceUrl: 'https://uscis.gov/h1b-update',
    actionRequired: 'Confirm with your employer that your petition will be filed before the deadline.',
    deadline: 'April 30, 2026',
    preferencesUrl: 'https://desiconnectusa.com/email-preferences?email=test@example.com',
    unsubscribeUrl: 'https://desiconnectusa.com/unsubscribe?email=test@example.com',
    ...overrides,
  };
}

// ── escapeHtml Tests ─────────────────────────────────────────────────

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes less-than sign', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes greater-than sign', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('She said "hello"')).toBe('She said &quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("It's fine")).toBe('It&#039;s fine');
  });

  it('escapes multiple special characters together', () => {
    expect(escapeHtml('<b>"Hello" & \'World\'</b>')).toBe(
      '&lt;b&gt;&quot;Hello&quot; &amp; &#039;World&#039;&lt;/b&gt;',
    );
  });

  it('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns plain text unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('handles text with no special characters', () => {
    expect(escapeHtml('Namaste Rajesh Kumar 123')).toBe('Namaste Rajesh Kumar 123');
  });

  it('handles already-escaped content (double-escapes)', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
});

// ── generateWelcomeEmail Tests ───────────────────────────────────────

describe('generateWelcomeEmail', () => {
  // ── Subject Line ───────────────────────────────────────────────

  describe('Subject Line', () => {
    it('contains brand name', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.subject).toContain('Desi Connect USA');
    });

    it('contains welcome emoji', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.subject).toContain('🙏');
    });

    it('starts with welcome message', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.subject).toBe('🙏 Welcome to Desi Connect USA!');
    });
  });

  // ── Return Shape ───────────────────────────────────────────────

  describe('Return Shape', () => {
    it('returns object with subject, html, and text', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
    });

    it('returns non-empty strings for all fields', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.subject.length).toBeGreaterThan(0);
      expect(result.html.length).toBeGreaterThan(0);
      expect(result.text.length).toBeGreaterThan(0);
    });
  });

  // ── HTML Content ───────────────────────────────────────────────

  describe('HTML Content', () => {
    it('contains DOCTYPE declaration', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.html).toContain('<!DOCTYPE html>');
    });

    it('contains brand name in header', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.html).toContain('Desi Connect USA');
    });

    it('contains brand tagline', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.html).toContain('Connecting the Indian diaspora in America');
    });

    it('contains brand color in header', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.html).toContain('#E65100');
    });

    it('contains personalized greeting with name', () => {
      const result = generateWelcomeEmail(createWelcomeData({ name: 'Rajesh Kumar' }));
      expect(result.html).toContain('Namaste Rajesh Kumar');
    });

    it('contains generic greeting without name', () => {
      const result = generateWelcomeEmail(createWelcomeData({ name: undefined }));
      expect(result.html).toContain('Namaste!');
      expect(result.html).not.toContain('Namaste undefined');
    });

    it('renders digest type badges for selected topics', () => {
      const result = generateWelcomeEmail(
        createWelcomeData({ digestTypes: ['community', 'immigration'] }),
      );
      expect(result.html).toContain('Community');
      expect(result.html).toContain('Immigration');
    });

    it('renders all five digest types when provided', () => {
      const result = generateWelcomeEmail(
        createWelcomeData({
          digestTypes: ['community', 'immigration', 'deals', 'jobs', 'events'],
        }),
      );
      expect(result.html).toContain('Community');
      expect(result.html).toContain('Immigration');
      expect(result.html).toContain('Deals');
      expect(result.html).toContain('Jobs');
      expect(result.html).toContain('Events');
    });

    it('shows default text when no digest types provided', () => {
      const result = generateWelcomeEmail(createWelcomeData({ digestTypes: [] }));
      expect(result.html).toContain('Default (Community)');
    });

    it('capitalizes frequency in subscription details', () => {
      const result = generateWelcomeEmail(createWelcomeData({ frequency: 'weekly' }));
      expect(result.html).toContain('Weekly');
    });

    it('capitalizes daily frequency', () => {
      const result = generateWelcomeEmail(createWelcomeData({ frequency: 'daily' }));
      expect(result.html).toContain('Daily');
    });

    it('contains preferences URL in CTA button', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.html).toContain('Customize Your Preferences');
      expect(result.html).toContain(
        'https://desiconnectusa.com/email-preferences?email=test@example.com',
      );
    });

    it('contains What to Expect section', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.html).toContain('What to Expect');
      expect(result.html).toContain('Curated Digests');
      expect(result.html).toContain('Immigration Alerts');
      expect(result.html).toContain('Job Listings');
    });

    it('contains Manage Preferences link in footer', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.html).toContain('Manage Preferences');
    });

    it('contains Unsubscribe link in footer', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.html).toContain('Unsubscribe');
      expect(result.html).toContain(
        'https://desiconnectusa.com/unsubscribe?email=test@example.com',
      );
    });

    it('contains copyright notice with current year', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.html).toContain(`&copy; ${new Date().getFullYear()} Desi Connect USA`);
    });

    it('escapes HTML in name', () => {
      const result = generateWelcomeEmail(
        createWelcomeData({ name: '<script>alert("xss")</script>' }),
      );
      expect(result.html).not.toContain('<script>alert');
      expect(result.html).toContain('&lt;script&gt;');
    });

    it('trims whitespace from name', () => {
      const result = generateWelcomeEmail(createWelcomeData({ name: '  Rajesh  ' }));
      expect(result.html).toContain('Namaste Rajesh');
      expect(result.html).not.toContain('Namaste  Rajesh');
    });
  });

  // ── Plaintext Content ──────────────────────────────────────────

  describe('Plaintext Content', () => {
    it('contains personalized greeting', () => {
      const result = generateWelcomeEmail(createWelcomeData({ name: 'Rajesh Kumar' }));
      expect(result.text).toContain('Namaste Rajesh Kumar');
    });

    it('contains generic greeting without name', () => {
      const result = generateWelcomeEmail(createWelcomeData({ name: undefined }));
      expect(result.text).toMatch(/^Namaste!/);
    });

    it('contains brand name', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.text).toContain('Desi Connect USA');
    });

    it('contains digest type labels', () => {
      const result = generateWelcomeEmail(
        createWelcomeData({ digestTypes: ['community', 'immigration'] }),
      );
      expect(result.text).toContain('Community');
      expect(result.text).toContain('Immigration');
    });

    it('shows Default (Community) when no digest types', () => {
      const result = generateWelcomeEmail(createWelcomeData({ digestTypes: [] }));
      expect(result.text).toContain('Default (Community)');
    });

    it('contains capitalized frequency', () => {
      const result = generateWelcomeEmail(createWelcomeData({ frequency: 'daily' }));
      expect(result.text).toContain('Daily');
    });

    it('contains What to Expect items', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.text).toContain('Curated Digests');
      expect(result.text).toContain('Immigration Alerts');
      expect(result.text).toContain('Job Listings');
    });

    it('contains preferences URL', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.text).toContain(
        'https://desiconnectusa.com/email-preferences?email=test@example.com',
      );
    });

    it('contains unsubscribe URL', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.text).toContain(
        'https://desiconnectusa.com/unsubscribe?email=test@example.com',
      );
    });

    it('contains copyright notice', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.text).toContain(`© ${new Date().getFullYear()} Desi Connect USA`);
    });

    it('does not contain HTML tags', () => {
      const result = generateWelcomeEmail(createWelcomeData());
      expect(result.text).not.toMatch(/<[a-z][^>]*>/i);
    });
  });
});

// ── generateWeeklyDigestEmail Tests ──────────────────────────────────

describe('generateWeeklyDigestEmail', () => {
  // ── Subject Line ───────────────────────────────────────────────

  describe('Subject Line', () => {
    it('contains brand name', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.subject).toContain('Desi Connect USA');
    });

    it('contains date', () => {
      const result = generateWeeklyDigestEmail(
        createWeeklyDigestData({ date: 'March 3, 2026' }),
      );
      expect(result.subject).toContain('March 3, 2026');
    });

    it('contains weekly digest label', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.subject).toContain('Weekly Digest');
    });

    it('contains digest emoji', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.subject).toContain('📰');
    });
  });

  // ── Return Shape ───────────────────────────────────────────────

  describe('Return Shape', () => {
    it('returns subject, html, and text', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
    });
  });

  // ── HTML Content — Item Grouping ───────────────────────────────

  describe('HTML Content — Item Grouping', () => {
    it('groups items by category', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      // Should have separate section headers for events, immigration, community
      expect(result.html).toContain('Events');
      expect(result.html).toContain('Immigration');
      expect(result.html).toContain('Community');
    });

    it('renders item titles', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.html).toContain('Desi Food Festival in Houston');
      expect(result.html).toContain('New H-1B Lottery Results');
      expect(result.html).toContain('Community Meetup in Dallas');
    });

    it('renders item summaries', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.html).toContain('Annual Indian food festival returns with 50+ vendors');
      expect(result.html).toContain('USCIS announces FY2027 H-1B lottery selections');
    });

    it('renders item URLs as links', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.html).toContain('https://example.com/food-festival');
      expect(result.html).toContain('https://example.com/h1b-lottery');
      expect(result.html).toContain('https://example.com/meetup');
    });

    it('renders correct category colors', () => {
      const result = generateWeeklyDigestEmail(
        createWeeklyDigestData({
          items: [
            createDigestItem({ category: 'events', title: 'Event Item' }),
            createDigestItem({ category: 'jobs', title: 'Job Item' }),
          ],
        }),
      );
      // Events color
      expect(result.html).toContain('#AD1457');
      // Jobs color
      expect(result.html).toContain('#6A1B9A');
    });
  });

  // ── HTML Content — Count & Greeting ────────────────────────────

  describe('HTML Content — Count & Greeting', () => {
    it('shows correct item count with plural', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.html).toContain('3 updates');
    });

    it('shows singular "update" for single item', () => {
      const result = generateWeeklyDigestEmail(
        createWeeklyDigestData({
          items: [createDigestItem()],
        }),
      );
      expect(result.html).toContain('1 update');
      expect(result.html).not.toContain('1 updates');
    });

    it('contains personalized greeting', () => {
      const result = generateWeeklyDigestEmail(
        createWeeklyDigestData({ name: 'Priya Sharma' }),
      );
      expect(result.html).toContain('Namaste Priya Sharma');
    });

    it('contains generic greeting without name', () => {
      const result = generateWeeklyDigestEmail(
        createWeeklyDigestData({ name: undefined }),
      );
      expect(result.html).toContain('Namaste!');
    });

    it('displays the date', () => {
      const result = generateWeeklyDigestEmail(
        createWeeklyDigestData({ date: 'March 3, 2026' }),
      );
      expect(result.html).toContain('March 3, 2026');
    });
  });

  // ── HTML Content — Empty & Edge Cases ──────────────────────────

  describe('HTML Content — Edge Cases', () => {
    it('handles empty items array', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData({ items: [] }));
      expect(result.html).toContain('0 updates');
      expect(result.subject).toContain('Weekly Digest');
    });

    it('handles single category with multiple items', () => {
      const items = [
        createDigestItem({ title: 'Article 1', category: 'community' }),
        createDigestItem({ title: 'Article 2', category: 'community' }),
        createDigestItem({ title: 'Article 3', category: 'community' }),
      ];
      const result = generateWeeklyDigestEmail(createWeeklyDigestData({ items }));
      expect(result.html).toContain('Article 1');
      expect(result.html).toContain('Article 2');
      expect(result.html).toContain('Article 3');
      expect(result.html).toContain('3 updates');
    });

    it('escapes HTML in item title', () => {
      const items = [createDigestItem({ title: '<img src=x onerror=alert(1)>' })];
      const result = generateWeeklyDigestEmail(createWeeklyDigestData({ items }));
      expect(result.html).not.toContain('<img src=x');
      expect(result.html).toContain('&lt;img');
    });

    it('escapes HTML in item summary', () => {
      const items = [createDigestItem({ summary: '<b>Bold & "quoted"</b>' })];
      const result = generateWeeklyDigestEmail(createWeeklyDigestData({ items }));
      expect(result.html).toContain('&lt;b&gt;');
      expect(result.html).toContain('&amp;');
    });

    it('handles all five digest categories', () => {
      const items: DigestItem[] = [
        createDigestItem({ category: 'community', title: 'Community Item' }),
        createDigestItem({ category: 'immigration', title: 'Immigration Item' }),
        createDigestItem({ category: 'deals', title: 'Deals Item' }),
        createDigestItem({ category: 'jobs', title: 'Jobs Item' }),
        createDigestItem({ category: 'events', title: 'Events Item' }),
      ];
      const result = generateWeeklyDigestEmail(createWeeklyDigestData({ items }));
      expect(result.html).toContain('Community Item');
      expect(result.html).toContain('Immigration Item');
      expect(result.html).toContain('Deals Item');
      expect(result.html).toContain('Jobs Item');
      expect(result.html).toContain('Events Item');
    });
  });

  // ── HTML Content — Footer & Links ──────────────────────────────

  describe('HTML Content — Footer & Links', () => {
    it('contains Update Preferences CTA', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.html).toContain('Update Preferences');
    });

    it('contains Manage Preferences link in footer', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.html).toContain('Manage Preferences');
    });

    it('contains Unsubscribe link in footer', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.html).toContain('Unsubscribe');
    });

    it('contains copyright notice', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.html).toContain(`&copy; ${new Date().getFullYear()} Desi Connect USA`);
    });
  });

  // ── Plaintext Content ──────────────────────────────────────────

  describe('Plaintext Content', () => {
    it('contains date in header', () => {
      const result = generateWeeklyDigestEmail(
        createWeeklyDigestData({ date: 'March 3, 2026' }),
      );
      expect(result.text).toContain('March 3, 2026');
    });

    it('contains personalized greeting', () => {
      const result = generateWeeklyDigestEmail(
        createWeeklyDigestData({ name: 'Priya Sharma' }),
      );
      expect(result.text).toContain('Namaste Priya Sharma');
    });

    it('contains item count', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.text).toContain('3 updates');
    });

    it('contains item titles', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.text).toContain('Desi Food Festival in Houston');
      expect(result.text).toContain('New H-1B Lottery Results');
    });

    it('contains item URLs', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.text).toContain('https://example.com/food-festival');
    });

    it('contains category separators', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.text).toContain('---');
    });

    it('contains preferences URL', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.text).toContain(
        'https://desiconnectusa.com/email-preferences?email=test@example.com',
      );
    });

    it('contains unsubscribe URL', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.text).toContain(
        'https://desiconnectusa.com/unsubscribe?email=test@example.com',
      );
    });

    it('contains copyright notice', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.text).toContain(`© ${new Date().getFullYear()} Desi Connect USA`);
    });

    it('does not contain HTML tags', () => {
      const result = generateWeeklyDigestEmail(createWeeklyDigestData());
      expect(result.text).not.toMatch(/<[a-z][^>]*>/i);
    });
  });
});

// ── generateImmigrationAlertEmail Tests ──────────────────────────────

describe('generateImmigrationAlertEmail', () => {
  // ── Subject Line ───────────────────────────────────────────────

  describe('Subject Line', () => {
    it('contains immigration alert prefix', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.subject).toContain('🇺🇸 Immigration Alert');
    });

    it('contains the alert title', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.subject).toContain('H-1B Cap Season Filing Deadline Approaching');
    });

    it('matches expected format', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.subject).toBe(
        '🇺🇸 Immigration Alert: H-1B Cap Season Filing Deadline Approaching',
      );
    });
  });

  // ── Return Shape ───────────────────────────────────────────────

  describe('Return Shape', () => {
    it('returns subject, html, and text', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
    });
  });

  // ── HTML Content — Core ────────────────────────────────────────

  describe('HTML Content — Core', () => {
    it('contains alert title', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.html).toContain('H-1B Cap Season Filing Deadline Approaching');
    });

    it('contains category badge', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.html).toContain('H-1B Visa');
    });

    it('contains Immigration Alert badge', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.html).toContain('Immigration Alert');
    });

    it('contains personalized greeting', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ name: 'Anil Patel' }),
      );
      expect(result.html).toContain('Namaste Anil Patel');
    });

    it('contains generic greeting without name', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ name: undefined }),
      );
      expect(result.html).toContain('Namaste,');
    });

    it('contains summary text', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.html).toContain(
        'USCIS has announced the filing window for H-1B cap-subject petitions.',
      );
    });

    it('contains details text', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.html).toContain('The filing period opens April 1');
    });

    it('converts newlines in details to <br /> tags', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.html).toContain('<br />');
    });
  });

  // ── HTML Content — Action Required / Deadline ──────────────────

  describe('HTML Content — Action Required', () => {
    it('shows action required box when actionRequired is provided', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.html).toContain('Action Required');
      expect(result.html).toContain(
        'Confirm with your employer that your petition will be filed before the deadline.',
      );
    });

    it('shows deadline when provided', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.html).toContain('Deadline');
      expect(result.html).toContain('April 30, 2026');
    });

    it('shows action required without deadline', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ deadline: undefined }),
      );
      expect(result.html).toContain('Action Required');
      expect(result.html).not.toContain('📅 Deadline:');
    });

    it('shows deadline without action required text', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ actionRequired: undefined }),
      );
      expect(result.html).toContain('Action Required');
      expect(result.html).toContain('April 30, 2026');
    });

    it('hides urgency box when neither actionRequired nor deadline', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ actionRequired: undefined, deadline: undefined }),
      );
      expect(result.html).not.toContain('Action Required');
      expect(result.html).not.toContain('FFEBEE'); // urgency box background color
    });
  });

  // ── HTML Content — Source URL ───────────────────────────────────

  describe('HTML Content — Source URL', () => {
    it('shows Read Full Details button when sourceUrl provided', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.html).toContain('Read Full Details');
      expect(result.html).toContain('https://uscis.gov/h1b-update');
    });

    it('hides Read Full Details button when sourceUrl is undefined', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ sourceUrl: undefined }),
      );
      expect(result.html).not.toContain('Read Full Details');
    });
  });

  // ── HTML Content — Legal Disclaimer ────────────────────────────

  describe('HTML Content — Legal Disclaimer', () => {
    it('contains disclaimer text', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.html).toContain('Disclaimer');
      expect(result.html).toContain('informational purposes only');
      expect(result.html).toContain('constitute legal advice');
    });

    it('mentions consulting an immigration attorney', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.html).toContain('qualified immigration attorney');
    });
  });

  // ── HTML Content — Footer ──────────────────────────────────────

  describe('HTML Content — Footer', () => {
    it('contains Manage Preferences link', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.html).toContain('Manage Preferences');
    });

    it('contains Unsubscribe link', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.html).toContain('Unsubscribe');
    });

    it('contains copyright notice', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.html).toContain(`&copy; ${new Date().getFullYear()} Desi Connect USA`);
    });
  });

  // ── HTML Content — XSS Protection ──────────────────────────────

  describe('HTML Content — XSS Protection', () => {
    it('escapes HTML in alertTitle', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ alertTitle: '<script>alert("xss")</script>' }),
      );
      expect(result.html).not.toContain('<script>alert');
      expect(result.html).toContain('&lt;script&gt;');
    });

    it('escapes HTML in category', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ category: '<b>Visa</b>' }),
      );
      expect(result.html).toContain('&lt;b&gt;');
    });

    it('escapes HTML in summary', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ summary: 'Important & "urgent" <update>' }),
      );
      expect(result.html).toContain('&amp;');
      expect(result.html).toContain('&quot;urgent&quot;');
      expect(result.html).toContain('&lt;update&gt;');
    });

    it('escapes HTML in actionRequired', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ actionRequired: 'Act <now>' }),
      );
      expect(result.html).toContain('Act &lt;now&gt;');
    });

    it('escapes HTML in deadline', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ deadline: 'April <30>' }),
      );
      expect(result.html).toContain('April &lt;30&gt;');
    });

    it('escapes HTML in name', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ name: '<img src=x>' }),
      );
      expect(result.html).not.toContain('<img src=x>');
      expect(result.html).toContain('&lt;img');
    });

    it('escapes HTML in sourceUrl', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ sourceUrl: 'https://example.com/page?a=1&b=2' }),
      );
      expect(result.html).toContain('https://example.com/page?a=1&amp;b=2');
    });
  });

  // ── Plaintext Content ──────────────────────────────────────────

  describe('Plaintext Content', () => {
    it('contains immigration alert header with category', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.text).toContain('IMMIGRATION ALERT');
      expect(result.text).toContain('H-1B Visa');
    });

    it('contains alert title', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.text).toContain('H-1B Cap Season Filing Deadline Approaching');
    });

    it('contains personalized greeting', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ name: 'Anil Patel' }),
      );
      expect(result.text).toContain('Namaste Anil Patel');
    });

    it('contains summary', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.text).toContain(
        'USCIS has announced the filing window for H-1B cap-subject petitions.',
      );
    });

    it('contains details', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.text).toContain('The filing period opens April 1');
    });

    it('contains action required text', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.text).toContain('ACTION REQUIRED');
      expect(result.text).toContain('Confirm with your employer');
    });

    it('contains deadline', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.text).toContain('Deadline: April 30, 2026');
    });

    it('contains source URL', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.text).toContain('https://uscis.gov/h1b-update');
    });

    it('omits source URL when not provided', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ sourceUrl: undefined }),
      );
      expect(result.text).not.toContain('Read full details');
    });

    it('omits action required section when not provided', () => {
      const result = generateImmigrationAlertEmail(
        createImmigrationAlertData({ actionRequired: undefined, deadline: undefined }),
      );
      expect(result.text).not.toContain('ACTION REQUIRED');
    });

    it('contains disclaimer', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.text).toContain('DISCLAIMER');
      expect(result.text).toContain('informational purposes only');
      expect(result.text).toContain('qualified immigration attorney');
    });

    it('contains preferences URL', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.text).toContain(
        'https://desiconnectusa.com/email-preferences?email=test@example.com',
      );
    });

    it('contains unsubscribe URL', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.text).toContain(
        'https://desiconnectusa.com/unsubscribe?email=test@example.com',
      );
    });

    it('contains copyright notice', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.text).toContain(`© ${new Date().getFullYear()} Desi Connect USA`);
    });

    it('does not contain HTML tags', () => {
      const result = generateImmigrationAlertEmail(createImmigrationAlertData());
      expect(result.text).not.toMatch(/<[a-z][^>]*>/i);
    });
  });
});

// ── Cross-Template Tests ─────────────────────────────────────────────

describe('Cross-Template Consistency', () => {
  const templates: { name: string; generate: () => EmailTemplate }[] = [
    { name: 'Welcome', generate: () => generateWelcomeEmail(createWelcomeData()) },
    { name: 'Weekly Digest', generate: () => generateWeeklyDigestEmail(createWeeklyDigestData()) },
    {
      name: 'Immigration Alert',
      generate: () => generateImmigrationAlertEmail(createImmigrationAlertData()),
    },
  ];

  for (const { name, generate } of templates) {
    describe(`${name} Email`, () => {
      it('HTML starts with DOCTYPE', () => {
        expect(generate().html).toMatch(/^<!DOCTYPE html>/);
      });

      it('HTML contains <html lang="en">', () => {
        expect(generate().html).toContain('<html lang="en">');
      });

      it('HTML contains viewport meta tag', () => {
        expect(generate().html).toContain('width=device-width');
      });

      it('HTML contains brand name', () => {
        expect(generate().html).toContain('Desi Connect USA');
      });

      it('HTML contains brand color', () => {
        expect(generate().html).toContain('#E65100');
      });

      it('HTML contains Unsubscribe link', () => {
        expect(generate().html).toContain('Unsubscribe');
      });

      it('HTML contains Manage Preferences link', () => {
        expect(generate().html).toContain('Manage Preferences');
      });

      it('HTML contains copyright', () => {
        expect(generate().html).toContain(`&copy; ${new Date().getFullYear()}`);
      });

      it('plaintext contains brand name', () => {
        expect(generate().text).toContain('Desi Connect USA');
      });

      it('plaintext contains unsubscribe URL', () => {
        expect(generate().text).toContain('unsubscribe');
      });

      it('plaintext contains copyright', () => {
        expect(generate().text).toContain(`© ${new Date().getFullYear()}`);
      });

      it('subject is a non-empty string', () => {
        const subject = generate().subject;
        expect(typeof subject).toBe('string');
        expect(subject.length).toBeGreaterThan(0);
      });
    });
  }
});
