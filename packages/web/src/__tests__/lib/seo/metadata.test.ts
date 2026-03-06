/**
 * Tests for SEO Metadata Generators
 *
 * Comprehensive tests for all metadata generation functions covering:
 * - Shared utility helpers (truncateDescription, canonicalUrl)
 * - Base page metadata generation
 * - Entity-specific metadata generators (businesses, jobs, deals, events, etc.)
 * - City and directory landing page metadata
 * - Edge cases and SEO best practices validation
 */

import {
  truncateDescription,
  canonicalUrl,
  generatePageMetadata,
  generateBusinessMetadata,
  generateBusinessDirectoryMetadata,
  generateJobMetadata,
  generateJobBoardMetadata,
  generateDealMetadata,
  generateDealsPageMetadata,
  generateEventMetadata,
  generateEventsPageMetadata,
  generateImmigrationMetadata,
  generateConsultancyMetadata,
  generateConsultancyDirectoryMetadata,
  generateCityMetadata,
  generateCitiesIndexMetadata,
  type PageMetaInput,
  type BusinessMetaInput,
  type JobMetaInput,
  type DealMetaInput,
  type EventMetaInput,
  type ConsultancyMetaInput,
  type CityMetaInput,
} from '@/lib/seo/metadata';

// ─── Mock Constants ──────────────────────────────────────────

jest.mock('@/lib/constants', () => ({
  SITE_NAME: 'Desi Connect USA',
  SITE_URL: 'https://desiconnectusa.com',
}));

// ─── truncateDescription ─────────────────────────────────────

describe('truncateDescription', () => {
  it('returns empty string for empty input', () => {
    expect(truncateDescription('')).toBe('');
  });

  it('returns empty string for falsy input', () => {
    expect(truncateDescription(null as unknown as string)).toBe('');
    expect(truncateDescription(undefined as unknown as string)).toBe('');
  });

  it('returns text as-is when under max length', () => {
    const text = 'Short description.';
    expect(truncateDescription(text)).toBe(text);
  });

  it('returns text as-is when exactly at max length', () => {
    const text = 'A'.repeat(160);
    expect(truncateDescription(text)).toBe(text);
  });

  it('truncates at word boundary with ellipsis when over 160 chars', () => {
    const words = 'This is a really long description that goes on and on. ';
    // Repeat to exceed 160 chars
    const text = words.repeat(5);
    expect(text.length).toBeGreaterThan(160);

    const result = truncateDescription(text);
    expect(result.length).toBeLessThanOrEqual(161); // 160 + ellipsis char
    expect(result).toMatch(/…$/);
    // Should not cut in the middle of a word — the text before the ellipsis
    // must end at a complete word (lastIndexOf(' ') logic)
    const withoutEllipsis = result.slice(0, -1);
    // Verify it's shorter than original and ends cleanly
    expect(withoutEllipsis.length).toBeLessThanOrEqual(160);
    // The last word should be complete (not a fragment)
    const lastWord = withoutEllipsis.trim().split(' ').pop() || '';
    expect(text).toContain(lastWord);
  });

  it('supports custom max length', () => {
    const text = 'This is a test description for custom length truncation.';
    const result = truncateDescription(text, 20);
    expect(result.length).toBeLessThanOrEqual(21); // 20 + ellipsis
    expect(result).toMatch(/…$/);
  });

  it('trims whitespace before processing', () => {
    const text = '   Short description.   ';
    expect(truncateDescription(text)).toBe('Short description.');
  });

  it('handles text with no spaces (single long word)', () => {
    const text = 'A'.repeat(200);
    const result = truncateDescription(text);
    // No spaces to break at, so truncates at maxLength and adds ellipsis
    expect(result).toBe('A'.repeat(160) + '…');
  });

  it('handles text with only one space before max length', () => {
    const text = 'Word ' + 'A'.repeat(200);
    const result = truncateDescription(text);
    expect(result).toBe('Word…');
  });
});

// ─── canonicalUrl ────────────────────────────────────────────

describe('canonicalUrl', () => {
  it('builds canonical URL with leading slash', () => {
    expect(canonicalUrl('/businesses')).toBe('https://desiconnectusa.com/businesses');
  });

  it('adds leading slash if missing', () => {
    expect(canonicalUrl('businesses')).toBe('https://desiconnectusa.com/businesses');
  });

  it('handles nested paths', () => {
    expect(canonicalUrl('/cities/ca/bay-area')).toBe(
      'https://desiconnectusa.com/cities/ca/bay-area'
    );
  });

  it('handles root path', () => {
    expect(canonicalUrl('/')).toBe('https://desiconnectusa.com/');
  });

  it('handles path with query params', () => {
    expect(canonicalUrl('/businesses?category=restaurant')).toBe(
      'https://desiconnectusa.com/businesses?category=restaurant'
    );
  });

  it('strips trailing slash from base URL', () => {
    // The mock URL doesn't have a trailing slash, but the function handles it
    expect(canonicalUrl('/test')).toBe('https://desiconnectusa.com/test');
  });
});

// ─── generatePageMetadata (base) ─────────────────────────────

describe('generatePageMetadata', () => {
  const baseInput: PageMetaInput = {
    title: 'Test Page',
    description: 'A test page description.',
    path: '/test',
  };

  it('generates metadata with required fields', () => {
    const meta = generatePageMetadata(baseInput);

    expect(meta.title).toBe('Test Page');
    expect(meta.description).toBe('A test page description.');
    expect(meta.alternates).toEqual({
      canonical: 'https://desiconnectusa.com/test',
    });
  });

  it('includes OpenGraph metadata', () => {
    const meta = generatePageMetadata(baseInput);
    const og = meta.openGraph as Record<string, unknown>;

    expect(og.type).toBe('website');
    expect(og.locale).toBe('en_US');
    expect(og.url).toBe('https://desiconnectusa.com/test');
    expect(og.title).toBe('Test Page');
    expect(og.description).toBe('A test page description.');
    expect(og.siteName).toBe('Desi Connect USA');
  });

  it('includes Twitter card metadata', () => {
    const meta = generatePageMetadata(baseInput);
    const twitter = meta.twitter as Record<string, unknown>;

    expect(twitter.card).toBe('summary_large_image');
    expect(twitter.title).toBe('Test Page');
    expect(twitter.description).toBe('A test page description.');
  });

  it('includes keywords when provided', () => {
    const meta = generatePageMetadata({
      ...baseInput,
      keywords: ['test', 'seo', 'metadata'],
    });

    expect(meta.keywords).toEqual(['test', 'seo', 'metadata']);
  });

  it('does not include keywords when empty array', () => {
    const meta = generatePageMetadata({
      ...baseInput,
      keywords: [],
    });

    expect(meta.keywords).toBeUndefined();
  });

  it('does not include keywords when not provided', () => {
    const meta = generatePageMetadata(baseInput);
    expect(meta.keywords).toBeUndefined();
  });

  it('sets noIndex robots directive when specified', () => {
    const meta = generatePageMetadata({
      ...baseInput,
      noIndex: true,
    });

    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it('does not set robots when noIndex is false', () => {
    const meta = generatePageMetadata({
      ...baseInput,
      noIndex: false,
    });

    expect(meta.robots).toBeUndefined();
  });

  it('does not set robots when noIndex is not provided', () => {
    const meta = generatePageMetadata(baseInput);
    expect(meta.robots).toBeUndefined();
  });

  it('includes OG image when provided', () => {
    const meta = generatePageMetadata({
      ...baseInput,
      image: 'https://example.com/image.jpg',
    });

    const og = meta.openGraph as Record<string, unknown>;
    expect(og.images).toEqual([
      {
        url: 'https://example.com/image.jpg',
        width: 1200,
        height: 630,
        alt: 'Test Page',
      },
    ]);
  });

  it('includes Twitter image when provided', () => {
    const meta = generatePageMetadata({
      ...baseInput,
      image: 'https://example.com/image.jpg',
    });

    const twitter = meta.twitter as Record<string, unknown>;
    expect(twitter.images).toEqual(['https://example.com/image.jpg']);
  });

  it('does not include images when not provided', () => {
    const meta = generatePageMetadata(baseInput);
    const og = meta.openGraph as Record<string, unknown>;
    const twitter = meta.twitter as Record<string, unknown>;

    expect(og.images).toBeUndefined();
    expect(twitter.images).toBeUndefined();
  });

  it('truncates long descriptions to 160 chars', () => {
    const longDesc = 'A'.repeat(10) + ' ' + 'B'.repeat(160);
    const meta = generatePageMetadata({
      ...baseInput,
      description: longDesc,
    });

    const desc = meta.description as string;
    expect(desc.length).toBeLessThanOrEqual(161);
    expect(desc).toMatch(/…$/);

    // OG and Twitter should also have truncated description
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.description).toBe(desc);
    const twitter = meta.twitter as Record<string, unknown>;
    expect(twitter.description).toBe(desc);
  });
});

// ─── Business Metadata ───────────────────────────────────────

describe('generateBusinessMetadata', () => {
  const baseInput: BusinessMetaInput = {
    name: 'Taj Mahal Restaurant',
    category: 'Restaurant',
    city: 'Edison',
    state: 'NJ',
    businessId: 'biz-123',
  };

  it('generates correct title format', () => {
    const meta = generateBusinessMetadata(baseInput);
    expect(meta.title).toBe('Taj Mahal Restaurant — Restaurant in Edison, NJ');
  });

  it('generates fallback description when none provided', () => {
    const meta = generateBusinessMetadata(baseInput);
    const desc = meta.description as string;
    expect(desc).toContain('Taj Mahal Restaurant');
    expect(desc).toContain('restaurant');
    expect(desc).toContain('Edison');
    expect(desc).toContain('NJ');
    expect(desc).toContain('Desi Connect USA');
  });

  it('uses custom description when provided', () => {
    const meta = generateBusinessMetadata({
      ...baseInput,
      description: 'The best Indian food in Edison.',
    });
    expect(meta.description).toBe('The best Indian food in Edison.');
  });

  it('sets correct canonical URL', () => {
    const meta = generateBusinessMetadata(baseInput);
    expect((meta.alternates as Record<string, unknown>).canonical).toBe(
      'https://desiconnectusa.com/businesses/biz-123'
    );
  });

  it('includes relevant keywords', () => {
    const meta = generateBusinessMetadata(baseInput);
    const keywords = meta.keywords as string[];
    expect(keywords).toContain('Taj Mahal Restaurant');
    expect(keywords).toContain('Restaurant');
    expect(keywords).toContain('Edison');
    expect(keywords).toContain('NJ');
    expect(keywords.some((k) => k.includes('Indian'))).toBe(true);
    expect(keywords.some((k) => k.includes('desi'))).toBe(true);
  });

  it('includes image when provided', () => {
    const meta = generateBusinessMetadata({
      ...baseInput,
      image: 'https://example.com/biz.jpg',
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.images).toBeDefined();
  });
});

describe('generateBusinessDirectoryMetadata', () => {
  it('generates directory listing metadata', () => {
    const meta = generateBusinessDirectoryMetadata();

    expect(meta.title).toBe('Indian Business Directory');
    expect(meta.description).toBeTruthy();
    expect((meta.alternates as Record<string, unknown>).canonical).toBe(
      'https://desiconnectusa.com/businesses'
    );
    expect((meta.keywords as string[]).length).toBeGreaterThan(0);
  });

  it('includes relevant directory keywords', () => {
    const meta = generateBusinessDirectoryMetadata();
    const keywords = meta.keywords as string[];
    expect(keywords.some((k) => k.includes('Indian'))).toBe(true);
    expect(keywords.some((k) => k.includes('desi'))).toBe(true);
  });
});

// ─── Job Metadata ────────────────────────────────────────────

describe('generateJobMetadata', () => {
  const baseInput: JobMetaInput = {
    title: 'Software Engineer',
    company: 'TechCorp',
    city: 'San Jose',
    state: 'CA',
    employmentType: 'Full-Time',
    jobId: 'job-456',
  };

  it('generates correct title without tags', () => {
    const meta = generateJobMetadata(baseInput);
    expect(meta.title).toBe('Software Engineer at TechCorp — San Jose, CA');
  });

  it('appends H-1B tag to title', () => {
    const meta = generateJobMetadata({ ...baseInput, isH1bSponsor: true });
    expect(meta.title).toBe('Software Engineer at TechCorp — San Jose, CA (H-1B Sponsor)');
  });

  it('appends OPT-Friendly tag to title', () => {
    const meta = generateJobMetadata({ ...baseInput, isOptFriendly: true });
    expect(meta.title).toBe('Software Engineer at TechCorp — San Jose, CA (OPT-Friendly)');
  });

  it('appends both H-1B and OPT tags to title', () => {
    const meta = generateJobMetadata({
      ...baseInput,
      isH1bSponsor: true,
      isOptFriendly: true,
    });
    expect(meta.title).toBe(
      'Software Engineer at TechCorp — San Jose, CA (H-1B Sponsor, OPT-Friendly)'
    );
  });

  it('includes employment type in description', () => {
    const meta = generateJobMetadata(baseInput);
    expect(meta.description).toContain('Full-Time');
  });

  it('includes H-1B keyword when sponsor', () => {
    const meta = generateJobMetadata({ ...baseInput, isH1bSponsor: true });
    const keywords = meta.keywords as string[];
    expect(keywords).toContain('H-1B sponsor jobs');
  });

  it('does not include H-1B keyword when not sponsor', () => {
    const meta = generateJobMetadata(baseInput);
    const keywords = meta.keywords as string[];
    expect(keywords).not.toContain('H-1B sponsor jobs');
  });

  it('includes OPT keyword when OPT-friendly', () => {
    const meta = generateJobMetadata({ ...baseInput, isOptFriendly: true });
    const keywords = meta.keywords as string[];
    expect(keywords).toContain('OPT jobs');
  });

  it('sets correct canonical URL', () => {
    const meta = generateJobMetadata(baseInput);
    expect((meta.alternates as Record<string, unknown>).canonical).toBe(
      'https://desiconnectusa.com/jobs/job-456'
    );
  });
});

describe('generateJobBoardMetadata', () => {
  it('generates job board listing metadata', () => {
    const meta = generateJobBoardMetadata();

    expect(meta.title).toBe('Jobs for the Indian Diaspora');
    expect(meta.description).toBeTruthy();
    expect((meta.alternates as Record<string, unknown>).canonical).toBe(
      'https://desiconnectusa.com/jobs'
    );
  });

  it('includes H-1B and OPT in keywords', () => {
    const meta = generateJobBoardMetadata();
    const keywords = meta.keywords as string[];
    expect(keywords.some((k) => k.includes('H-1B'))).toBe(true);
    expect(keywords.some((k) => k.includes('OPT'))).toBe(true);
  });
});

// ─── Deal Metadata ───────────────────────────────────────────

describe('generateDealMetadata', () => {
  const baseInput: DealMetaInput = {
    title: 'Lunch Special',
    businessName: 'Spice Garden',
    city: 'Irving',
    state: 'TX',
    dealId: 'deal-789',
  };

  it('generates title without discount', () => {
    const meta = generateDealMetadata(baseInput);
    expect(meta.title).toBe('Lunch Special at Spice Garden');
  });

  it('includes percentage discount in title', () => {
    const meta = generateDealMetadata({
      ...baseInput,
      discountType: 'percentage',
      discountValue: 20,
    });
    expect(meta.title).toBe('Lunch Special — 20% off at Spice Garden');
  });

  it('includes dollar discount in title', () => {
    const meta = generateDealMetadata({
      ...baseInput,
      discountType: 'fixed',
      discountValue: 10,
    });
    expect(meta.title).toBe('Lunch Special — $10 off at Spice Garden');
  });

  it('includes discount in description', () => {
    const meta = generateDealMetadata({
      ...baseInput,
      discountType: 'percentage',
      discountValue: 15,
    });
    expect(meta.description).toContain('15% off');
  });

  it('sets correct canonical URL', () => {
    const meta = generateDealMetadata(baseInput);
    expect((meta.alternates as Record<string, unknown>).canonical).toBe(
      'https://desiconnectusa.com/deals/deal-789'
    );
  });

  it('includes deal-related keywords', () => {
    const meta = generateDealMetadata(baseInput);
    const keywords = meta.keywords as string[];
    expect(keywords).toContain('Lunch Special');
    expect(keywords).toContain('Spice Garden');
    expect(keywords.some((k) => k.includes('desi'))).toBe(true);
  });
});

describe('generateDealsPageMetadata', () => {
  it('generates deals listing metadata', () => {
    const meta = generateDealsPageMetadata();

    expect(meta.title).toBe('Deals & Coupons for the Indian Community');
    expect(meta.description).toBeTruthy();
    expect((meta.alternates as Record<string, unknown>).canonical).toBe(
      'https://desiconnectusa.com/deals'
    );
  });
});

// ─── Event Metadata ──────────────────────────────────────────

describe('generateEventMetadata', () => {
  const baseInput: EventMetaInput = {
    title: 'Diwali Celebration',
    category: 'Cultural',
    city: 'Houston',
    state: 'TX',
    startDate: '2026-10-20T18:00:00Z',
    eventId: 'evt-101',
  };

  it('generates title with formatted date', () => {
    const meta = generateEventMetadata(baseInput);
    // Date formatting may vary by locale, but should include the key parts
    expect(meta.title).toContain('Diwali Celebration');
    expect(meta.title).toContain('Houston, TX');
    expect(meta.title).toContain('2026');
  });

  it('generates fallback description when none provided', () => {
    const meta = generateEventMetadata(baseInput);
    const desc = meta.description as string;
    expect(desc).toContain('Diwali Celebration');
    expect(desc).toContain('cultural');
    expect(desc).toContain('Houston');
    expect(desc).toContain('Desi Connect USA');
  });

  it('uses custom description when provided', () => {
    const meta = generateEventMetadata({
      ...baseInput,
      description: 'Join us for the biggest Diwali event!',
    });
    expect(meta.description).toBe('Join us for the biggest Diwali event!');
  });

  it('sets correct canonical URL', () => {
    const meta = generateEventMetadata(baseInput);
    expect((meta.alternates as Record<string, unknown>).canonical).toBe(
      'https://desiconnectusa.com/events/evt-101'
    );
  });

  it('includes event-related keywords', () => {
    const meta = generateEventMetadata(baseInput);
    const keywords = meta.keywords as string[];
    expect(keywords).toContain('Diwali Celebration');
    expect(keywords.some((k) => k.includes('Indian events'))).toBe(true);
    expect(keywords.some((k) => k.includes('cultural'))).toBe(true);
  });

  it('includes image when provided', () => {
    const meta = generateEventMetadata({
      ...baseInput,
      image: 'https://example.com/diwali.jpg',
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.images).toBeDefined();
  });
});

describe('generateEventsPageMetadata', () => {
  it('generates events listing metadata', () => {
    const meta = generateEventsPageMetadata();

    expect(meta.title).toBe('Indian Community Events');
    expect(meta.description).toBeTruthy();
    expect((meta.alternates as Record<string, unknown>).canonical).toBe(
      'https://desiconnectusa.com/events'
    );
  });
});

// ─── Immigration Metadata ────────────────────────────────────

describe('generateImmigrationMetadata', () => {
  it('generates immigration page metadata', () => {
    const meta = generateImmigrationMetadata();

    expect(meta.title).toBe('Immigration Updates & Resources');
    expect(meta.description).toBeTruthy();
    expect((meta.alternates as Record<string, unknown>).canonical).toBe(
      'https://desiconnectusa.com/immigration'
    );
  });

  it('includes visa-related keywords', () => {
    const meta = generateImmigrationMetadata();
    const keywords = meta.keywords as string[];
    expect(keywords.some((k) => k.includes('H-1B'))).toBe(true);
    expect(keywords.some((k) => k.includes('EB-2'))).toBe(true);
    expect(keywords.some((k) => k.includes('OPT'))).toBe(true);
    expect(keywords.some((k) => k.includes('USCIS'))).toBe(true);
  });

  it('includes description with immigration topics', () => {
    const meta = generateImmigrationMetadata();
    const desc = meta.description as string;
    expect(desc).toContain('H-1B');
    expect(desc).toContain('green card');
  });
});

// ─── Consultancy Metadata ────────────────────────────────────

describe('generateConsultancyMetadata', () => {
  const baseInput: ConsultancyMetaInput = {
    name: 'Visa Experts LLC',
    specialization: 'H-1B Processing',
    city: 'Chicago',
    state: 'IL',
    isVerified: false,
    consultancyId: 'cons-202',
  };

  it('generates title without verified badge', () => {
    const meta = generateConsultancyMetadata(baseInput);
    expect(meta.title).toBe('Visa Experts LLC — H-1B Processing in Chicago, IL');
  });

  it('includes verified badge in title', () => {
    const meta = generateConsultancyMetadata({ ...baseInput, isVerified: true });
    expect(meta.title).toBe('Visa Experts LLC (Verified) — H-1B Processing in Chicago, IL');
  });

  it('generates description with specialization', () => {
    const meta = generateConsultancyMetadata(baseInput);
    const desc = meta.description as string;
    expect(desc).toContain('Visa Experts LLC');
    expect(desc).toContain('h-1b processing');
    expect(desc).toContain('Chicago');
  });

  it('sets correct canonical URL', () => {
    const meta = generateConsultancyMetadata(baseInput);
    expect((meta.alternates as Record<string, unknown>).canonical).toBe(
      'https://desiconnectusa.com/consultancies/cons-202'
    );
  });

  it('includes consultancy-related keywords', () => {
    const meta = generateConsultancyMetadata(baseInput);
    const keywords = meta.keywords as string[];
    expect(keywords).toContain('Visa Experts LLC');
    expect(keywords).toContain('H-1B Processing');
    expect(keywords.some((k) => k.includes('desi consultancy'))).toBe(true);
  });
});

describe('generateConsultancyDirectoryMetadata', () => {
  it('generates consultancy directory metadata', () => {
    const meta = generateConsultancyDirectoryMetadata();

    expect(meta.title).toBe('Immigration Consultancy Reviews');
    expect(meta.description).toBeTruthy();
    expect((meta.alternates as Record<string, unknown>).canonical).toBe(
      'https://desiconnectusa.com/consultancies'
    );
  });

  it('includes fraud alert keyword', () => {
    const meta = generateConsultancyDirectoryMetadata();
    const keywords = meta.keywords as string[];
    expect(keywords.some((k) => k.includes('fraud'))).toBe(true);
  });
});

// ─── City Metadata ───────────────────────────────────────────

describe('generateCityMetadata', () => {
  const baseInput: CityMetaInput = {
    city: 'Edison',
    state: 'NJ',
    slug: 'edison',
    stateSlug: 'nj',
  };

  it('generates title with city and state', () => {
    const meta = generateCityMetadata(baseInput);
    expect(meta.title).toBe('Indian Community in Edison, NJ');
  });

  it('generates base description without stats', () => {
    const meta = generateCityMetadata(baseInput);
    const desc = meta.description as string;
    expect(desc).toContain('Edison');
    expect(desc).toContain('NJ');
    expect(desc).not.toContain('Explore');
  });

  it('includes business count in description', () => {
    const meta = generateCityMetadata({ ...baseInput, businessCount: 42 });
    const desc = meta.description as string;
    expect(desc).toContain('42 businesses');
  });

  it('includes event count in description', () => {
    const meta = generateCityMetadata({ ...baseInput, eventCount: 8 });
    const desc = meta.description as string;
    expect(desc).toContain('8 events');
  });

  it('includes both stats in description', () => {
    const meta = generateCityMetadata({
      ...baseInput,
      businessCount: 42,
      eventCount: 8,
    });
    const desc = meta.description as string;
    expect(desc).toContain('42 businesses');
    expect(desc).toContain('8 events');
    expect(desc).toContain('and');
  });

  it('sets correct canonical URL with state and city slugs', () => {
    const meta = generateCityMetadata(baseInput);
    expect((meta.alternates as Record<string, unknown>).canonical).toBe(
      'https://desiconnectusa.com/cities/nj/edison'
    );
  });

  it('includes city-specific keywords', () => {
    const meta = generateCityMetadata(baseInput);
    const keywords = meta.keywords as string[];
    expect(keywords.some((k) => k.includes('Edison'))).toBe(true);
    expect(keywords.some((k) => k.includes('Indian community'))).toBe(true);
    expect(keywords.some((k) => k.includes('desi'))).toBe(true);
  });

  it('does not show stats when counts are zero', () => {
    const meta = generateCityMetadata({
      ...baseInput,
      businessCount: 0,
      eventCount: 0,
    });
    const desc = meta.description as string;
    // Zero counts should not trigger the "Explore N businesses and N events" suffix
    expect(desc).not.toContain('Explore');
    expect(desc).not.toMatch(/\d+ businesses/);
    expect(desc).not.toMatch(/\d+ events/);
  });
});

describe('generateCitiesIndexMetadata', () => {
  it('generates cities index metadata', () => {
    const meta = generateCitiesIndexMetadata();

    expect(meta.title).toBe('Indian Communities by City');
    expect(meta.description).toBeTruthy();
    expect((meta.alternates as Record<string, unknown>).canonical).toBe(
      'https://desiconnectusa.com/cities'
    );
  });

  it('includes diaspora-related keywords', () => {
    const meta = generateCitiesIndexMetadata();
    const keywords = meta.keywords as string[];
    expect(keywords.some((k) => k.includes('diaspora'))).toBe(true);
    expect(keywords.some((k) => k.includes('Indian community'))).toBe(true);
  });
});

// ─── SEO Best Practices Validation ──────────────────────────

describe('SEO Best Practices', () => {
  it('all page generators produce non-empty titles', () => {
    const generators = [
      generateBusinessDirectoryMetadata,
      generateJobBoardMetadata,
      generateDealsPageMetadata,
      generateEventsPageMetadata,
      generateImmigrationMetadata,
      generateConsultancyDirectoryMetadata,
      generateCitiesIndexMetadata,
    ];

    generators.forEach((gen) => {
      const meta = gen();
      expect(meta.title).toBeTruthy();
      expect(typeof meta.title).toBe('string');
      expect((meta.title as string).length).toBeGreaterThan(0);
    });
  });

  it('all page generators produce non-empty descriptions', () => {
    const generators = [
      generateBusinessDirectoryMetadata,
      generateJobBoardMetadata,
      generateDealsPageMetadata,
      generateEventsPageMetadata,
      generateImmigrationMetadata,
      generateConsultancyDirectoryMetadata,
      generateCitiesIndexMetadata,
    ];

    generators.forEach((gen) => {
      const meta = gen();
      expect(meta.description).toBeTruthy();
      expect((meta.description as string).length).toBeGreaterThan(0);
    });
  });

  it('all page generators produce descriptions under 160 chars', () => {
    const generators = [
      generateBusinessDirectoryMetadata,
      generateJobBoardMetadata,
      generateDealsPageMetadata,
      generateEventsPageMetadata,
      generateImmigrationMetadata,
      generateConsultancyDirectoryMetadata,
      generateCitiesIndexMetadata,
    ];

    generators.forEach((gen) => {
      const meta = gen();
      const desc = meta.description as string;
      expect(desc.length).toBeLessThanOrEqual(160);
    });
  });

  it('all page generators include canonical URLs', () => {
    const generators = [
      generateBusinessDirectoryMetadata,
      generateJobBoardMetadata,
      generateDealsPageMetadata,
      generateEventsPageMetadata,
      generateImmigrationMetadata,
      generateConsultancyDirectoryMetadata,
      generateCitiesIndexMetadata,
    ];

    generators.forEach((gen) => {
      const meta = gen();
      const canonical = (meta.alternates as Record<string, unknown>).canonical as string;
      expect(canonical).toMatch(/^https:\/\/desiconnectusa\.com\//);
    });
  });

  it('all page generators include OpenGraph data', () => {
    const generators = [
      generateBusinessDirectoryMetadata,
      generateJobBoardMetadata,
      generateDealsPageMetadata,
      generateEventsPageMetadata,
      generateImmigrationMetadata,
      generateConsultancyDirectoryMetadata,
      generateCitiesIndexMetadata,
    ];

    generators.forEach((gen) => {
      const meta = gen();
      const og = meta.openGraph as Record<string, unknown>;
      expect(og).toBeDefined();
      expect(og.type).toBe('website');
      expect(og.locale).toBe('en_US');
      expect(og.siteName).toBe('Desi Connect USA');
    });
  });

  it('all page generators include Twitter card data', () => {
    const generators = [
      generateBusinessDirectoryMetadata,
      generateJobBoardMetadata,
      generateDealsPageMetadata,
      generateEventsPageMetadata,
      generateImmigrationMetadata,
      generateConsultancyDirectoryMetadata,
      generateCitiesIndexMetadata,
    ];

    generators.forEach((gen) => {
      const meta = gen();
      const twitter = meta.twitter as Record<string, unknown>;
      expect(twitter).toBeDefined();
      expect(twitter.card).toBe('summary_large_image');
    });
  });

  it('all page generators include at least 3 keywords', () => {
    const generators = [
      generateBusinessDirectoryMetadata,
      generateJobBoardMetadata,
      generateDealsPageMetadata,
      generateEventsPageMetadata,
      generateImmigrationMetadata,
      generateConsultancyDirectoryMetadata,
      generateCitiesIndexMetadata,
    ];

    generators.forEach((gen) => {
      const meta = gen();
      const keywords = meta.keywords as string[];
      expect(keywords.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('entity generators produce titles under 70 chars for SEO', () => {
    // Check entity generators with short inputs
    const businessMeta = generateBusinessMetadata({
      name: 'Spice',
      category: 'Food',
      city: 'NYC',
      state: 'NY',
      businessId: 'b1',
    });
    expect((businessMeta.title as string).length).toBeLessThanOrEqual(70);

    const jobMeta = generateJobMetadata({
      title: 'Dev',
      company: 'Corp',
      city: 'SF',
      state: 'CA',
      employmentType: 'FT',
      jobId: 'j1',
    });
    expect((jobMeta.title as string).length).toBeLessThanOrEqual(70);
  });

  it('OG description matches meta description across all generators', () => {
    const generators = [
      generateBusinessDirectoryMetadata,
      generateJobBoardMetadata,
      generateDealsPageMetadata,
      generateEventsPageMetadata,
      generateImmigrationMetadata,
      generateConsultancyDirectoryMetadata,
      generateCitiesIndexMetadata,
    ];

    generators.forEach((gen) => {
      const meta = gen();
      const og = meta.openGraph as Record<string, unknown>;
      expect(og.description).toBe(meta.description);
    });
  });

  it('Twitter title matches meta title across all generators', () => {
    const generators = [
      generateBusinessDirectoryMetadata,
      generateJobBoardMetadata,
      generateDealsPageMetadata,
      generateEventsPageMetadata,
      generateImmigrationMetadata,
      generateConsultancyDirectoryMetadata,
      generateCitiesIndexMetadata,
    ];

    generators.forEach((gen) => {
      const meta = gen();
      const twitter = meta.twitter as Record<string, unknown>;
      expect(twitter.title).toBe(meta.title);
    });
  });
});

// ─── Edge Cases ──────────────────────────────────────────────

describe('Edge Cases', () => {
  it('handles special characters in business names', () => {
    const meta = generateBusinessMetadata({
      name: "Ravi's Kitchen & Bar",
      category: 'Restaurant',
      city: 'New York',
      state: 'NY',
      businessId: 'biz-special',
    });
    expect(meta.title).toContain("Ravi's Kitchen & Bar");
  });

  it('handles unicode characters in event names', () => {
    const meta = generateEventMetadata({
      title: 'नवरात्रि Festival',
      category: 'Religious',
      city: 'Houston',
      state: 'TX',
      startDate: '2026-10-01',
      eventId: 'evt-unicode',
    });
    expect(meta.title).toContain('नवरात्रि Festival');
  });

  it('handles very long business names gracefully', () => {
    const meta = generateBusinessMetadata({
      name: 'The Incredibly Long Named Indian Restaurant and Catering Service',
      category: 'Restaurant',
      city: 'Los Angeles',
      state: 'CA',
      businessId: 'biz-long',
    });
    // Title will be long but description should be truncated
    expect(meta.title).toBeTruthy();
    const desc = meta.description as string;
    expect(desc.length).toBeLessThanOrEqual(161); // 160 + possible ellipsis
  });

  it('handles zero discount value (no discount shown)', () => {
    const meta = generateDealMetadata({
      title: 'Free Appetizer',
      businessName: 'Curry House',
      city: 'Dallas',
      state: 'TX',
      discountType: 'percentage',
      discountValue: 0,
      dealId: 'deal-zero',
    });
    // discountValue is 0, which is falsy, so no discount string
    expect(meta.title).toBe('Free Appetizer at Curry House');
  });

  it('handles job with no visa sponsorship flags', () => {
    const meta = generateJobMetadata({
      title: 'Data Scientist',
      company: 'Analytics Inc',
      city: 'Seattle',
      state: 'WA',
      employmentType: 'Contract',
      isH1bSponsor: false,
      isOptFriendly: false,
      jobId: 'job-no-visa',
    });
    expect(meta.title).not.toContain('H-1B');
    expect(meta.title).not.toContain('OPT');
    const keywords = meta.keywords as string[];
    expect(keywords).not.toContain('H-1B sponsor jobs');
    expect(keywords).not.toContain('OPT jobs');
  });

  it('handles city with no stats', () => {
    const meta = generateCityMetadata({
      city: 'Small Town',
      state: 'KS',
      slug: 'small-town',
      stateSlug: 'ks',
    });
    const desc = meta.description as string;
    expect(desc).not.toContain('Explore');
  });

  it('handles consultancy with special chars in name', () => {
    const meta = generateConsultancyMetadata({
      name: 'A+ Immigration & Visa Services, LLC',
      specialization: 'EB-1/EB-2 Processing',
      city: 'Atlanta',
      state: 'GA',
      isVerified: true,
      consultancyId: 'cons-special',
    });
    expect(meta.title).toContain('A+ Immigration & Visa Services, LLC');
    expect(meta.title).toContain('(Verified)');
  });
});
