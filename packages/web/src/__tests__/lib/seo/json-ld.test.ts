/**
 * Tests for JSON-LD Structured Data Builders
 *
 * @jest-environment jsdom
 */

jest.mock('@/lib/constants', () => ({
  SITE_NAME: 'Desi Connect USA',
  SITE_URL: 'https://desiconnectusa.com',
}));

import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  buildBreadcrumbJsonLd,
  buildLocalBusinessJsonLd,
  buildJobPostingJsonLd,
  buildEventJsonLd,
  buildAggregateReviewJsonLd,
  buildItemListJsonLd,
  buildFaqJsonLd,
  jsonLdScriptContent,
  type WithContext,
  type BreadcrumbItem,
  type LocalBusinessJsonLdInput,
  type JobPostingJsonLdInput,
  type EventJsonLdInput,
  type ReviewJsonLdInput,
  type ItemListJsonLdInput,
  type FaqItem,
} from '@/lib/seo/json-ld';

// ─── Organization ──────────────────────────────────────────

describe('buildOrganizationJsonLd', () => {
  it('returns Organization schema with correct context', () => {
    const result = buildOrganizationJsonLd();
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('Organization');
  });

  it('includes site name and URL', () => {
    const result = buildOrganizationJsonLd();
    expect(result.name).toBe('Desi Connect USA');
    expect(result.url).toBe('https://desiconnectusa.com');
  });

  it('includes logo URL', () => {
    const result = buildOrganizationJsonLd();
    expect(result.logo).toBe('https://desiconnectusa.com/logo.png');
  });
});

// ─── WebSite ───────────────────────────────────────────────

describe('buildWebSiteJsonLd', () => {
  it('returns WebSite schema', () => {
    const result = buildWebSiteJsonLd();
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('WebSite');
  });

  it('includes search action', () => {
    const result = buildWebSiteJsonLd();
    const action = result.potentialAction as Record<string, unknown>;
    expect(action['@type']).toBe('SearchAction');
    expect(action['query-input']).toBe('required name=search_term_string');
  });

  it('includes correct search URL template', () => {
    const result = buildWebSiteJsonLd();
    const action = result.potentialAction as Record<string, unknown>;
    const target = action.target as Record<string, unknown>;
    expect(target.urlTemplate).toContain('/search?q={search_term_string}');
  });
});

// ─── Breadcrumb ────────────────────────────────────────────

describe('buildBreadcrumbJsonLd', () => {
  const items: BreadcrumbItem[] = [
    { name: 'Home', path: '/' },
    { name: 'Businesses', path: '/businesses' },
    { name: 'Spice Kitchen', path: '/businesses/123' },
  ];

  it('returns BreadcrumbList schema', () => {
    const result = buildBreadcrumbJsonLd(items);
    expect(result['@type']).toBe('BreadcrumbList');
  });

  it('creates correct number of list items', () => {
    const result = buildBreadcrumbJsonLd(items);
    const elements = result.itemListElement as Array<Record<string, unknown>>;
    expect(elements).toHaveLength(3);
  });

  it('assigns sequential positions starting at 1', () => {
    const result = buildBreadcrumbJsonLd(items);
    const elements = result.itemListElement as Array<Record<string, unknown>>;
    expect(elements[0].position).toBe(1);
    expect(elements[1].position).toBe(2);
    expect(elements[2].position).toBe(3);
  });

  it('builds full canonical URLs for each item', () => {
    const result = buildBreadcrumbJsonLd(items);
    const elements = result.itemListElement as Array<Record<string, unknown>>;
    expect(elements[0].item).toBe('https://desiconnectusa.com/');
    expect(elements[1].item).toBe('https://desiconnectusa.com/businesses');
  });

  it('handles empty breadcrumb list', () => {
    const result = buildBreadcrumbJsonLd([]);
    const elements = result.itemListElement as Array<Record<string, unknown>>;
    expect(elements).toHaveLength(0);
  });
});

// ─── LocalBusiness ─────────────────────────────────────────

describe('buildLocalBusinessJsonLd', () => {
  const baseInput: LocalBusinessJsonLdInput = {
    name: 'Spice Kitchen',
    category: 'Restaurant',
    address: {
      city: 'Edison',
      state: 'NJ',
    },
    businessId: 'biz-123',
  };

  it('returns LocalBusiness schema', () => {
    const result = buildLocalBusinessJsonLd(baseInput);
    expect(result['@type']).toBe('LocalBusiness');
    expect(result['@context']).toBe('https://schema.org');
  });

  it('includes business name and canonical URL', () => {
    const result = buildLocalBusinessJsonLd(baseInput);
    expect(result.name).toBe('Spice Kitchen');
    expect(result.url).toBe('https://desiconnectusa.com/businesses/biz-123');
  });

  it('generates fallback description when none provided', () => {
    const result = buildLocalBusinessJsonLd(baseInput);
    expect(result.description).toContain('Spice Kitchen');
    expect(result.description).toContain('Restaurant');
    expect(result.description).toContain('Edison');
  });

  it('uses custom description when provided', () => {
    const result = buildLocalBusinessJsonLd({
      ...baseInput,
      description: 'Authentic North Indian cuisine',
    });
    expect(result.description).toBe('Authentic North Indian cuisine');
  });

  it('includes postal address with city and state', () => {
    const result = buildLocalBusinessJsonLd(baseInput);
    const addr = result.address as Record<string, unknown>;
    expect(addr['@type']).toBe('PostalAddress');
    expect(addr.addressLocality).toBe('Edison');
    expect(addr.addressRegion).toBe('NJ');
    expect(addr.addressCountry).toBe('US');
  });

  it('includes street and zip when provided', () => {
    const result = buildLocalBusinessJsonLd({
      ...baseInput,
      address: { ...baseInput.address, street: '123 Oak Ave', zipCode: '08817' },
    });
    const addr = result.address as Record<string, unknown>;
    expect(addr.streetAddress).toBe('123 Oak Ave');
    expect(addr.postalCode).toBe('08817');
  });

  it('does not include street/zip when not provided', () => {
    const result = buildLocalBusinessJsonLd(baseInput);
    const addr = result.address as Record<string, unknown>;
    expect(addr.streetAddress).toBeUndefined();
    expect(addr.postalCode).toBeUndefined();
  });

  it('includes phone when provided', () => {
    const result = buildLocalBusinessJsonLd({ ...baseInput, phone: '732-555-1234' });
    expect(result.telephone).toBe('732-555-1234');
  });

  it('does not include phone when not provided', () => {
    const result = buildLocalBusinessJsonLd(baseInput);
    expect(result.telephone).toBeUndefined();
  });

  it('includes website as sameAs', () => {
    const result = buildLocalBusinessJsonLd({ ...baseInput, website: 'https://spicekitchen.com' });
    expect(result.sameAs).toEqual(['https://spicekitchen.com']);
  });

  it('includes image when provided', () => {
    const result = buildLocalBusinessJsonLd({ ...baseInput, image: 'https://img.com/biz.jpg' });
    expect(result.image).toBe('https://img.com/biz.jpg');
  });

  it('includes priceRange when provided', () => {
    const result = buildLocalBusinessJsonLd({ ...baseInput, priceRange: '$$' });
    expect(result.priceRange).toBe('$$');
  });

  it('includes openingHours when provided', () => {
    const result = buildLocalBusinessJsonLd({
      ...baseInput,
      openingHours: ['Mo-Fr 09:00-21:00', 'Sa-Su 10:00-22:00'],
    });
    expect(result.openingHours).toEqual(['Mo-Fr 09:00-21:00', 'Sa-Su 10:00-22:00']);
  });

  it('includes aggregateRating when rating and reviewCount provided', () => {
    const result = buildLocalBusinessJsonLd({
      ...baseInput,
      rating: 4.5,
      reviewCount: 120,
    });
    const agg = result.aggregateRating as Record<string, unknown>;
    expect(agg['@type']).toBe('AggregateRating');
    expect(agg.ratingValue).toBe(4.5);
    expect(agg.reviewCount).toBe(120);
    expect(agg.bestRating).toBe(5);
    expect(agg.worstRating).toBe(1);
  });

  it('does not include aggregateRating when reviewCount is zero', () => {
    const result = buildLocalBusinessJsonLd({
      ...baseInput,
      rating: 4.5,
      reviewCount: 0,
    });
    expect(result.aggregateRating).toBeUndefined();
  });

  it('does not include aggregateRating when rating missing', () => {
    const result = buildLocalBusinessJsonLd({
      ...baseInput,
      reviewCount: 10,
    });
    expect(result.aggregateRating).toBeUndefined();
  });
});

// ─── JobPosting ────────────────────────────────────────────

describe('buildJobPostingJsonLd', () => {
  const baseInput: JobPostingJsonLdInput = {
    title: 'Software Engineer',
    company: 'TechCorp',
    description: 'Build awesome products with React and Node.js.',
    city: 'San Jose',
    state: 'CA',
    employmentType: 'Full-Time',
    datePosted: '2026-03-01',
    jobId: 'job-456',
  };

  it('returns JobPosting schema', () => {
    const result = buildJobPostingJsonLd(baseInput);
    expect(result['@type']).toBe('JobPosting');
  });

  it('includes title, description, and URL', () => {
    const result = buildJobPostingJsonLd(baseInput);
    expect(result.title).toBe('Software Engineer');
    expect(result.description).toContain('React and Node.js');
    expect(result.url).toBe('https://desiconnectusa.com/jobs/job-456');
  });

  it('includes hiring organization', () => {
    const result = buildJobPostingJsonLd(baseInput);
    const org = result.hiringOrganization as Record<string, unknown>;
    expect(org.name).toBe('TechCorp');
  });

  it('includes job location', () => {
    const result = buildJobPostingJsonLd(baseInput);
    const loc = result.jobLocation as Record<string, unknown>;
    const addr = (loc.address as Record<string, unknown>);
    expect(addr.addressLocality).toBe('San Jose');
    expect(addr.addressRegion).toBe('CA');
  });

  it('maps Full-Time to FULL_TIME', () => {
    const result = buildJobPostingJsonLd(baseInput);
    expect(result.employmentType).toBe('FULL_TIME');
  });

  it('maps part-time to PART_TIME', () => {
    const result = buildJobPostingJsonLd({ ...baseInput, employmentType: 'part-time' });
    expect(result.employmentType).toBe('PART_TIME');
  });

  it('maps contract to CONTRACTOR', () => {
    const result = buildJobPostingJsonLd({ ...baseInput, employmentType: 'contract' });
    expect(result.employmentType).toBe('CONTRACTOR');
  });

  it('maps internship to INTERN', () => {
    const result = buildJobPostingJsonLd({ ...baseInput, employmentType: 'internship' });
    expect(result.employmentType).toBe('INTERN');
  });

  it('defaults unknown type to FULL_TIME', () => {
    const result = buildJobPostingJsonLd({ ...baseInput, employmentType: 'freelance' });
    expect(result.employmentType).toBe('FULL_TIME');
  });

  it('includes TELECOMMUTE when remote', () => {
    const result = buildJobPostingJsonLd({ ...baseInput, isRemote: true });
    expect(result.jobLocationType).toBe('TELECOMMUTE');
  });

  it('does not include TELECOMMUTE when not remote', () => {
    const result = buildJobPostingJsonLd(baseInput);
    expect(result.jobLocationType).toBeUndefined();
  });

  it('includes salary when provided', () => {
    const result = buildJobPostingJsonLd({ ...baseInput, salaryRange: '120000-160000' });
    const salary = result.baseSalary as Record<string, unknown>;
    expect(salary['@type']).toBe('MonetaryAmount');
    expect(salary.currency).toBe('USD');
  });

  it('does not include salary when not provided', () => {
    const result = buildJobPostingJsonLd(baseInput);
    expect(result.baseSalary).toBeUndefined();
  });

  it('includes datePosted', () => {
    const result = buildJobPostingJsonLd(baseInput);
    expect(result.datePosted).toBe('2026-03-01');
  });
});

// ─── Event ─────────────────────────────────────────────────

describe('buildEventJsonLd', () => {
  const baseInput: EventJsonLdInput = {
    title: 'Diwali Celebration 2026',
    startDate: '2026-11-01T18:00:00',
    city: 'Edison',
    state: 'NJ',
    eventId: 'evt-789',
  };

  it('returns Event schema', () => {
    const result = buildEventJsonLd(baseInput);
    expect(result['@type']).toBe('Event');
  });

  it('includes event name and URL', () => {
    const result = buildEventJsonLd(baseInput);
    expect(result.name).toBe('Diwali Celebration 2026');
    expect(result.url).toBe('https://desiconnectusa.com/events/evt-789');
  });

  it('sets offline attendance mode by default', () => {
    const result = buildEventJsonLd(baseInput);
    expect(result.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode');
  });

  it('sets online attendance mode when isOnline', () => {
    const result = buildEventJsonLd({ ...baseInput, isOnline: true });
    expect(result.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
  });

  it('uses physical location for offline events', () => {
    const result = buildEventJsonLd({ ...baseInput, venue: 'Convention Center' });
    const loc = result.location as Record<string, unknown>;
    expect(loc['@type']).toBe('Place');
    expect(loc.name).toBe('Convention Center');
  });

  it('uses city/state as venue name when no venue provided', () => {
    const result = buildEventJsonLd(baseInput);
    const loc = result.location as Record<string, unknown>;
    expect(loc.name).toBe('Edison, NJ');
  });

  it('uses virtual location for online events', () => {
    const result = buildEventJsonLd({ ...baseInput, isOnline: true });
    const loc = result.location as Record<string, unknown>;
    expect(loc['@type']).toBe('VirtualLocation');
  });

  it('includes description when provided', () => {
    const result = buildEventJsonLd({ ...baseInput, description: 'Celebrate Diwali together!' });
    expect(result.description).toBe('Celebrate Diwali together!');
  });

  it('does not include description when not provided', () => {
    const result = buildEventJsonLd(baseInput);
    expect(result.description).toBeUndefined();
  });

  it('includes endDate when provided', () => {
    const result = buildEventJsonLd({ ...baseInput, endDate: '2026-11-01T22:00:00' });
    expect(result.endDate).toBe('2026-11-01T22:00:00');
  });

  it('includes image when provided', () => {
    const result = buildEventJsonLd({ ...baseInput, image: 'https://img.com/diwali.jpg' });
    expect(result.image).toBe('https://img.com/diwali.jpg');
  });

  it('includes offers with ticket URL', () => {
    const result = buildEventJsonLd({ ...baseInput, ticketUrl: 'https://tickets.com/evt-789' });
    const offers = result.offers as Record<string, unknown>;
    expect(offers['@type']).toBe('Offer');
    expect(offers.url).toBe('https://tickets.com/evt-789');
  });

  it('includes offers with price', () => {
    const result = buildEventJsonLd({ ...baseInput, price: 25 });
    const offers = result.offers as Record<string, unknown>;
    expect(offers.price).toBe('25');
    expect(offers.priceCurrency).toBe('USD');
  });

  it('includes offers for free events (price=0)', () => {
    const result = buildEventJsonLd({ ...baseInput, price: 0 });
    const offers = result.offers as Record<string, unknown>;
    expect(offers.price).toBe('0');
  });

  it('does not include offers when no ticket/price info', () => {
    const result = buildEventJsonLd(baseInput);
    expect(result.offers).toBeUndefined();
  });

  it('includes organizer', () => {
    const result = buildEventJsonLd(baseInput);
    const org = result.organizer as Record<string, unknown>;
    expect(org.name).toBe('Desi Connect USA');
  });
});

// ─── AggregateReview ───────────────────────────────────────

describe('buildAggregateReviewJsonLd', () => {
  const input: ReviewJsonLdInput = {
    consultancyName: 'Visa Experts Inc',
    consultancyId: 'con-001',
    rating: 4.2,
    reviewCount: 85,
  };

  it('returns LocalBusiness schema with aggregateRating', () => {
    const result = buildAggregateReviewJsonLd(input);
    expect(result['@type']).toBe('LocalBusiness');
    expect(result.name).toBe('Visa Experts Inc');
  });

  it('includes correct URL', () => {
    const result = buildAggregateReviewJsonLd(input);
    expect(result.url).toBe('https://desiconnectusa.com/consultancies/con-001');
  });

  it('includes rating details', () => {
    const result = buildAggregateReviewJsonLd(input);
    const agg = result.aggregateRating as Record<string, unknown>;
    expect(agg.ratingValue).toBe(4.2);
    expect(agg.reviewCount).toBe(85);
    expect(agg.bestRating).toBe(5);
  });
});

// ─── ItemList ──────────────────────────────────────────────

describe('buildItemListJsonLd', () => {
  const input: ItemListJsonLdInput = {
    name: 'Top Businesses in Edison',
    description: 'Popular Indian businesses',
    items: [
      { name: 'Spice Kitchen', url: 'https://desiconnectusa.com/businesses/1' },
      { name: 'Patel Bros', url: 'https://desiconnectusa.com/businesses/2' },
    ],
  };

  it('returns ItemList schema', () => {
    const result = buildItemListJsonLd(input);
    expect(result['@type']).toBe('ItemList');
  });

  it('includes correct number of items', () => {
    const result = buildItemListJsonLd(input);
    expect(result.numberOfItems).toBe(2);
  });

  it('creates list items with sequential positions', () => {
    const result = buildItemListJsonLd(input);
    const elements = result.itemListElement as Array<Record<string, unknown>>;
    expect(elements[0].position).toBe(1);
    expect(elements[0].name).toBe('Spice Kitchen');
    expect(elements[1].position).toBe(2);
  });

  it('handles empty list', () => {
    const result = buildItemListJsonLd({ ...input, items: [] });
    expect(result.numberOfItems).toBe(0);
    expect(result.itemListElement).toHaveLength(0);
  });
});

// ─── FAQ ───────────────────────────────────────────────────

describe('buildFaqJsonLd', () => {
  const items: FaqItem[] = [
    { question: 'What is H-1B?', answer: 'A work visa for specialty occupations.' },
    { question: 'How long is OPT?', answer: 'Typically 12 months, with 24-month STEM extension.' },
  ];

  it('returns FAQPage schema', () => {
    const result = buildFaqJsonLd(items);
    expect(result['@type']).toBe('FAQPage');
  });

  it('includes correct number of questions', () => {
    const result = buildFaqJsonLd(items);
    const entities = result.mainEntity as Array<Record<string, unknown>>;
    expect(entities).toHaveLength(2);
  });

  it('formats questions correctly', () => {
    const result = buildFaqJsonLd(items);
    const entities = result.mainEntity as Array<Record<string, unknown>>;
    expect(entities[0]['@type']).toBe('Question');
    expect(entities[0].name).toBe('What is H-1B?');
  });

  it('formats answers correctly', () => {
    const result = buildFaqJsonLd(items);
    const entities = result.mainEntity as Array<Record<string, unknown>>;
    const answer = entities[0].acceptedAnswer as Record<string, unknown>;
    expect(answer['@type']).toBe('Answer');
    expect(answer.text).toContain('specialty occupations');
  });

  it('handles empty FAQ list', () => {
    const result = buildFaqJsonLd([]);
    const entities = result.mainEntity as Array<Record<string, unknown>>;
    expect(entities).toHaveLength(0);
  });
});

// ─── jsonLdScriptContent ───────────────────────────────────

describe('jsonLdScriptContent', () => {
  it('serialises single object into an array', () => {
    const obj = buildOrganizationJsonLd();
    const content = jsonLdScriptContent(obj);
    const parsed = JSON.parse(content);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]['@type']).toBe('Organization');
  });

  it('serialises multiple objects into an array', () => {
    const objs = [buildOrganizationJsonLd(), buildWebSiteJsonLd()];
    const content = jsonLdScriptContent(objs);
    const parsed = JSON.parse(content);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]['@type']).toBe('Organization');
    expect(parsed[1]['@type']).toBe('WebSite');
  });

  it('produces valid JSON', () => {
    const obj = buildLocalBusinessJsonLd({
      name: 'Test "Quotes" & Specials',
      category: 'Restaurant',
      address: { city: 'Edison', state: 'NJ' },
      businessId: 'test',
    });
    const content = jsonLdScriptContent(obj);
    expect(() => JSON.parse(content)).not.toThrow();
  });
});

// ─── Schema.org Compliance ─────────────────────────────────

describe('Schema.org Compliance', () => {
  it('all builders include @context and @type', () => {
    const schemas: WithContext[] = [
      buildOrganizationJsonLd(),
      buildWebSiteJsonLd(),
      buildBreadcrumbJsonLd([{ name: 'Home', path: '/' }]),
      buildLocalBusinessJsonLd({
        name: 'Test', category: 'Cat', address: { city: 'C', state: 'S' }, businessId: 'b1',
      }),
      buildJobPostingJsonLd({
        title: 'T', company: 'C', description: 'D', city: 'C', state: 'S',
        employmentType: 'Full-Time', datePosted: '2026-01-01', jobId: 'j1',
      }),
      buildEventJsonLd({
        title: 'E', startDate: '2026-01-01', city: 'C', state: 'S', eventId: 'e1',
      }),
      buildAggregateReviewJsonLd({
        consultancyName: 'R', consultancyId: 'r1', rating: 4, reviewCount: 10,
      }),
      buildItemListJsonLd({
        name: 'L', description: 'D', items: [],
      }),
      buildFaqJsonLd([{ question: 'Q?', answer: 'A' }]),
    ];

    for (const schema of schemas) {
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBeTruthy();
    }
  });

  it('all URLs are absolute', () => {
    const biz = buildLocalBusinessJsonLd({
      name: 'T', category: 'C', address: { city: 'C', state: 'S' }, businessId: 'b1',
    });
    expect(biz.url).toMatch(/^https?:\/\//);

    const job = buildJobPostingJsonLd({
      title: 'T', company: 'C', description: 'D', city: 'C', state: 'S',
      employmentType: 'Full-Time', datePosted: '2026-01-01', jobId: 'j1',
    });
    expect(job.url).toMatch(/^https?:\/\//);

    const event = buildEventJsonLd({
      title: 'E', startDate: '2026-01-01', city: 'C', state: 'S', eventId: 'e1',
    });
    expect(event.url).toMatch(/^https?:\/\//);
  });
});
