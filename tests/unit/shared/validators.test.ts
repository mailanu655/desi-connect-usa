/**
 * Comprehensive tests for all 8 input validators + 5 utility validators.
 *
 * Maps to Implementation Plan:
 *   - Section 5.2: User Identity Model (validateCreateUser)
 *   - Section 6.1: Website Features (validateCreateBusiness, validateCreateJob,
 *                  validateCreateNews, validateCreateDeal, validateCreateConsultancy,
 *                  validateCreateEvent)
 *   - Section 7.1: WhatsApp Bot intents (validateCreateReview)
 *   - Utility validators used across middleware + website form validation
 */

import {
  validateCreateUser,
  validateCreateBusiness,
  validateCreateJob,
  validateCreateNews,
  validateCreateDeal,
  validateCreateConsultancy,
  validateCreateEvent,
  validateCreateReview,
  isValidUUID,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isValidISODate,
  ValidationResult,
} from '../../../packages/shared/src/validators';

// ═══════════════════════════════════════════════════════════════════
// UTILITY VALIDATORS
// ═══════════════════════════════════════════════════════════════════

describe('Utility Validators', () => {
  describe('isValidUUID', () => {
    it('accepts valid v4 UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('accepts uppercase UUIDs', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('rejects malformed UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false); // no dashes
      expect(isValidUUID('gggggggg-gggg-gggg-gggg-gggggggggggg')).toBe(false); // non-hex
    });
  });

  describe('isValidEmail', () => {
    it('accepts valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.in')).toBe(true);
      expect(isValidEmail('user+tag@gmail.com')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('user')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user @domain.com')).toBe(false); // space
    });
  });

  describe('isValidPhone', () => {
    it('accepts valid E.164 phone numbers', () => {
      expect(isValidPhone('+14695551234')).toBe(true);
      expect(isValidPhone('+919876543210')).toBe(true);
      expect(isValidPhone('+1234')).toBe(true); // minimum valid
    });

    it('accepts numbers without + prefix', () => {
      expect(isValidPhone('14695551234')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone('abc')).toBe(false);
      expect(isValidPhone('+0123456789')).toBe(false); // starts with 0
      expect(isValidPhone('+')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('accepts valid HTTP/HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://desi-connect.com/businesses?page=1')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false); // no protocol
      expect(isValidUrl('not a url')).toBe(false);
    });
  });

  describe('isValidISODate', () => {
    it('accepts valid ISO date strings', () => {
      expect(isValidISODate('2026-03-01')).toBe(true);
      expect(isValidISODate('2026-03-01T10:30:00Z')).toBe(true);
      expect(isValidISODate('2026-03-01T10:30:00.000Z')).toBe(true);
      expect(isValidISODate('2026-03-01T10:30:00+05:30')).toBe(true);
      expect(isValidISODate('2026-03-01T10:30:00-06:00')).toBe(true);
    });

    it('rejects invalid date strings', () => {
      expect(isValidISODate('')).toBe(false);
      expect(isValidISODate('March 1, 2026')).toBe(false);
      expect(isValidISODate('01/03/2026')).toBe(false);
      expect(isValidISODate('not-a-date')).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// validateCreateUser — Section 5.2: Unified User Identity
// ═══════════════════════════════════════════════════════════════════

describe('validateCreateUser', () => {
  const validUserViaWhatsApp = {
    display_name: 'Ravi Kumar',
    phone_number: '+14695551234',
    created_via: 'whatsapp' as const,
  };

  const validUserViaWebsite = {
    display_name: 'Priya Sharma',
    email: 'priya@example.com',
    created_via: 'website' as const,
    auth_provider: 'google' as const,
  };

  it('accepts valid WhatsApp user (phone-based identity)', () => {
    const result = validateCreateUser(validUserViaWhatsApp);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts valid website user (email-based identity)', () => {
    const result = validateCreateUser(validUserViaWebsite);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts user with both phone and email (linked identity)', () => {
    const result = validateCreateUser({
      display_name: 'Linked User',
      phone_number: '+14695551234',
      email: 'linked@example.com',
      created_via: 'website',
      preferred_channel: 'both',
    });
    expect(result.valid).toBe(true);
  });

  it('requires display_name', () => {
    const result = validateCreateUser({ created_via: 'whatsapp', phone_number: '+14695551234' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('display_name is required');
  });

  it('rejects empty display_name', () => {
    const result = validateCreateUser({ display_name: '   ', created_via: 'whatsapp', phone_number: '+1469' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('display_name is required');
  });

  it('requires created_via', () => {
    const result = validateCreateUser({ display_name: 'Test', phone_number: '+14695551234' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('created_via'))).toBe(true);
  });

  it('rejects invalid created_via value', () => {
    const result = validateCreateUser({ display_name: 'Test', phone_number: '+14695551234', created_via: 'sms' as any });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('created_via'))).toBe(true);
  });

  it('requires at least one identifier (phone or email)', () => {
    const result = validateCreateUser({ display_name: 'Test', created_via: 'website' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one of phone_number or email is required');
  });

  it('rejects invalid phone_number format', () => {
    const result = validateCreateUser({ ...validUserViaWhatsApp, phone_number: '555-1234' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('E.164'))).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = validateCreateUser({ ...validUserViaWebsite, email: 'not-an-email' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('email'))).toBe(true);
  });

  it('rejects invalid preferred_channel', () => {
    const result = validateCreateUser({ ...validUserViaWhatsApp, preferred_channel: 'sms' as any });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('preferred_channel'))).toBe(true);
  });

  it('rejects invalid auth_provider', () => {
    const result = validateCreateUser({ ...validUserViaWebsite, auth_provider: 'facebook' as any });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('auth_provider'))).toBe(true);
  });

  it('accepts all valid auth_provider values', () => {
    for (const provider of ['google', 'email_magic_link', 'phone_otp', 'none'] as const) {
      const result = validateCreateUser({ ...validUserViaWebsite, auth_provider: provider });
      expect(result.valid).toBe(true);
    }
  });

  it('allows null phone_number and email without validation error on format', () => {
    const result = validateCreateUser({
      display_name: 'Test',
      phone_number: null,
      email: 'test@test.com',
      created_via: 'website',
    });
    expect(result.valid).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// validateCreateBusiness — Section 6.1: Business Directory
// ═══════════════════════════════════════════════════════════════════

describe('validateCreateBusiness', () => {
  const validBusiness = {
    name: 'Curry House',
    category: 'restaurant' as const,
    address: '123 Main St',
    city: 'Dallas',
    state: 'TX',
    zip_code: '75001',
    submission_source: 'website' as const,
  };

  it('accepts valid business input', () => {
    const result = validateCreateBusiness(validBusiness);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts valid business with all optional fields', () => {
    const result = validateCreateBusiness({
      ...validBusiness,
      description: 'Authentic South Indian cuisine',
      phone: '+14695551234',
      email: 'info@curryhouse.com',
      website_url: 'https://curryhouse.com',
      hours: 'Mon-Sat 11am-10pm',
      photo_urls: ['https://img.example.com/1.jpg'],
      latitude: 32.7767,
      longitude: -96.797,
      submitted_by: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.valid).toBe(true);
  });

  it('validates all 13 business categories', () => {
    const categories = [
      'restaurant', 'grocery', 'temple', 'salon', 'clothing', 'jewelry',
      'medical', 'legal', 'tax_accounting', 'real_estate', 'travel', 'education', 'other',
    ];
    for (const category of categories) {
      const result = validateCreateBusiness({ ...validBusiness, category: category as any });
      expect(result.valid).toBe(true);
    }
  });

  it('rejects invalid category', () => {
    const result = validateCreateBusiness({ ...validBusiness, category: 'bar' as any });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('category'))).toBe(true);
  });

  it('requires all mandatory fields', () => {
    const result = validateCreateBusiness({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('name is required');
    expect(result.errors.some(e => e.includes('category'))).toBe(true);
    expect(result.errors).toContain('address is required');
    expect(result.errors).toContain('city is required');
    expect(result.errors).toContain('state is required');
    expect(result.errors).toContain('zip_code is required');
    expect(result.errors.some(e => e.includes('submission_source'))).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = validateCreateBusiness({ ...validBusiness, email: 'bad-email' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('email'))).toBe(true);
  });

  it('rejects invalid website_url', () => {
    const result = validateCreateBusiness({ ...validBusiness, website_url: 'not-a-url' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('website_url'))).toBe(true);
  });

  it('validates all 4 submission sources', () => {
    for (const source of ['website', 'whatsapp', 'admin', 'seed'] as const) {
      const result = validateCreateBusiness({ ...validBusiness, submission_source: source });
      expect(result.valid).toBe(true);
    }
  });

  it('rejects WhatsApp submission from website-only context', () => {
    const result = validateCreateBusiness({ ...validBusiness, submission_source: 'telegram' as any });
    expect(result.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// validateCreateJob — Section 6.1: Job Board with H-1B / OPT filters
// ═══════════════════════════════════════════════════════════════════

describe('validateCreateJob', () => {
  const validJob = {
    title: 'Senior Software Engineer',
    company_name: 'TCS',
    description: 'Building scalable backend services',
    city: 'Dallas',
    state: 'TX',
    job_type: 'full_time' as const,
    submission_source: 'website' as const,
  };

  it('accepts valid job input', () => {
    const result = validateCreateJob(validJob);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts job with H-1B sponsor and OPT-friendly flags', () => {
    const result = validateCreateJob({
      ...validJob,
      h1b_sponsor: true,
      opt_friendly: true,
      salary_min: 80000,
      salary_max: 120000,
    });
    expect(result.valid).toBe(true);
  });

  it('validates all 5 job types', () => {
    for (const type of ['full_time', 'part_time', 'contract', 'internship', 'freelance'] as const) {
      const result = validateCreateJob({ ...validJob, job_type: type });
      expect(result.valid).toBe(true);
    }
  });

  it('requires all mandatory fields', () => {
    const result = validateCreateJob({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('title is required');
    expect(result.errors).toContain('company_name is required');
    expect(result.errors).toContain('description is required');
    expect(result.errors).toContain('city is required');
    expect(result.errors).toContain('state is required');
    expect(result.errors.some(e => e.includes('job_type'))).toBe(true);
    expect(result.errors.some(e => e.includes('submission_source'))).toBe(true);
  });

  it('rejects negative salary_min', () => {
    const result = validateCreateJob({ ...validJob, salary_min: -1000 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('salary_min cannot be negative');
  });

  it('rejects negative salary_max', () => {
    const result = validateCreateJob({ ...validJob, salary_max: -500 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('salary_max cannot be negative');
  });

  it('rejects salary_min > salary_max', () => {
    const result = validateCreateJob({ ...validJob, salary_min: 150000, salary_max: 100000 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('salary_min cannot exceed salary_max');
  });

  it('accepts salary_min === salary_max (exact salary)', () => {
    const result = validateCreateJob({ ...validJob, salary_min: 100000, salary_max: 100000 });
    expect(result.valid).toBe(true);
  });

  it('rejects invalid apply_url', () => {
    const result = validateCreateJob({ ...validJob, apply_url: 'not-url' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('apply_url'))).toBe(true);
  });

  it('rejects invalid apply_email', () => {
    const result = validateCreateJob({ ...validJob, apply_email: 'bad-email' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('apply_email'))).toBe(true);
  });

  it('rejects invalid expires_at', () => {
    const result = validateCreateJob({ ...validJob, expires_at: 'next-week' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('expires_at'))).toBe(true);
  });

  it('accepts valid expires_at ISO date', () => {
    const result = validateCreateJob({ ...validJob, expires_at: '2026-06-01T00:00:00Z' });
    expect(result.valid).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// validateCreateNews — Section 6.1: Immigration Hub + Tavily (Section 4.3)
// ═══════════════════════════════════════════════════════════════════

describe('validateCreateNews', () => {
  const validNews = {
    title: 'USCIS Announces New H-1B Lottery Rules',
    summary: 'Major changes to the H-1B visa lottery process for FY2027',
    category: 'immigration' as const,
    source: 'tavily' as const,
  };

  it('accepts valid news input', () => {
    const result = validateCreateNews(validNews);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates all 9 news categories', () => {
    const categories = [
      'immigration', 'community', 'business', 'technology',
      'lifestyle', 'events', 'deals', 'politics', 'other',
    ];
    for (const category of categories) {
      const result = validateCreateNews({ ...validNews, category: category as any });
      expect(result.valid).toBe(true);
    }
  });

  it('validates all 4 news sources', () => {
    for (const source of ['tavily', 'manual', 'admin', 'rss'] as const) {
      const result = validateCreateNews({ ...validNews, source });
      expect(result.valid).toBe(true);
    }
  });

  it('requires all mandatory fields', () => {
    const result = validateCreateNews({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('title is required');
    expect(result.errors).toContain('summary is required');
    expect(result.errors.some(e => e.includes('category'))).toBe(true);
    expect(result.errors.some(e => e.includes('source'))).toBe(true);
  });

  it('rejects invalid source_url', () => {
    const result = validateCreateNews({ ...validNews, source_url: 'not-a-url' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('source_url'))).toBe(true);
  });

  it('rejects invalid image_url', () => {
    const result = validateCreateNews({ ...validNews, image_url: 'bad' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('image_url'))).toBe(true);
  });

  it('accepts valid URLs', () => {
    const result = validateCreateNews({
      ...validNews,
      source_url: 'https://uscis.gov/news/h1b-lottery',
      image_url: 'https://img.example.com/news.jpg',
    });
    expect(result.valid).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// validateCreateDeal — Section 6.1: Deals & Coupons
// ═══════════════════════════════════════════════════════════════════

describe('validateCreateDeal', () => {
  const validDeal = {
    business_id: '550e8400-e29b-41d4-a716-446655440000',
    business_name: 'India Bazaar',
    title: '20% off all groceries',
    description: 'Weekend special on all grocery items',
    deal_type: 'percentage_off' as const,
    city: 'Dallas',
    state: 'TX',
    expires_at: '2026-04-01',
    submission_source: 'website' as const,
  };

  it('accepts valid deal input', () => {
    const result = validateCreateDeal(validDeal);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates all 5 deal types', () => {
    for (const type of ['percentage_off', 'fixed_amount', 'bogo', 'free_item', 'other'] as const) {
      const result = validateCreateDeal({ ...validDeal, deal_type: type });
      expect(result.valid).toBe(true);
    }
  });

  it('requires all mandatory fields', () => {
    const result = validateCreateDeal({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('business_id is required');
    expect(result.errors).toContain('business_name is required');
    expect(result.errors).toContain('title is required');
    expect(result.errors).toContain('description is required');
    expect(result.errors.some(e => e.includes('deal_type'))).toBe(true);
    expect(result.errors).toContain('city is required');
    expect(result.errors).toContain('state is required');
    expect(result.errors).toContain('expires_at is required');
    expect(result.errors.some(e => e.includes('submission_source'))).toBe(true);
  });

  it('rejects invalid expires_at format', () => {
    const result = validateCreateDeal({ ...validDeal, expires_at: 'next-month' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('expires_at') && e.includes('ISO date'))).toBe(true);
  });

  it('accepts deal submitted via WhatsApp bot', () => {
    const result = validateCreateDeal({ ...validDeal, submission_source: 'whatsapp' });
    expect(result.valid).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// validateCreateConsultancy — Section 6.1: Consultancy Ratings
// ═══════════════════════════════════════════════════════════════════

describe('validateCreateConsultancy', () => {
  const validConsultancy = {
    name: 'TechBridge Consulting',
    city: 'Dallas',
    state: 'TX',
    submission_source: 'website' as const,
  };

  it('accepts valid consultancy input', () => {
    const result = validateCreateConsultancy(validConsultancy);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts consultancy with all optional fields', () => {
    const result = validateCreateConsultancy({
      ...validConsultancy,
      description: 'IT staffing and H-1B processing',
      specializations: ['it_staffing', 'h1b_sponsor'],
      website_url: 'https://techbridge.com',
      email: 'info@techbridge.com',
    });
    expect(result.valid).toBe(true);
  });

  it('validates all 7 specializations', () => {
    const specs = [
      'it_staffing', 'h1b_sponsor', 'opt_cpt', 'gc_processing',
      'immigration_legal', 'tax_accounting', 'general',
    ];
    for (const spec of specs) {
      const result = validateCreateConsultancy({
        ...validConsultancy,
        specializations: [spec as any],
      });
      expect(result.valid).toBe(true);
    }
  });

  it('rejects invalid specialization', () => {
    const result = validateCreateConsultancy({
      ...validConsultancy,
      specializations: ['it_staffing', 'fake_spec' as any],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('fake_spec'))).toBe(true);
  });

  it('requires all mandatory fields', () => {
    const result = validateCreateConsultancy({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('name is required');
    expect(result.errors).toContain('city is required');
    expect(result.errors).toContain('state is required');
    expect(result.errors.some(e => e.includes('submission_source'))).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = validateCreateConsultancy({ ...validConsultancy, email: 'bad' });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid website_url', () => {
    const result = validateCreateConsultancy({ ...validConsultancy, website_url: 'no-protocol.com' });
    expect(result.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// validateCreateEvent — Section 6.1: Events
// ═══════════════════════════════════════════════════════════════════

describe('validateCreateEvent', () => {
  const validEvent = {
    title: 'Dallas Holi Festival 2026',
    description: 'Celebrate the festival of colors with the DFW community',
    category: 'cultural' as const,
    city: 'Dallas',
    state: 'TX',
    starts_at: '2026-03-15T10:00:00Z',
    submission_source: 'website' as const,
  };

  it('accepts valid event input', () => {
    const result = validateCreateEvent(validEvent);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates all 9 event categories', () => {
    const categories = [
      'cultural', 'religious', 'networking', 'educational',
      'food_festival', 'sports', 'charity', 'business', 'other',
    ];
    for (const category of categories) {
      const result = validateCreateEvent({ ...validEvent, category: category as any });
      expect(result.valid).toBe(true);
    }
  });

  it('requires all mandatory fields', () => {
    const result = validateCreateEvent({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('title is required');
    expect(result.errors).toContain('description is required');
    expect(result.errors.some(e => e.includes('category'))).toBe(true);
    expect(result.errors).toContain('city is required');
    expect(result.errors).toContain('state is required');
    expect(result.errors).toContain('starts_at is required');
    expect(result.errors.some(e => e.includes('submission_source'))).toBe(true);
  });

  it('rejects invalid starts_at format', () => {
    const result = validateCreateEvent({ ...validEvent, starts_at: 'tomorrow' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('starts_at') && e.includes('ISO date'))).toBe(true);
  });

  it('rejects invalid ends_at format', () => {
    const result = validateCreateEvent({ ...validEvent, ends_at: 'later' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('ends_at'))).toBe(true);
  });

  it('accepts event with tavily as submission_source', () => {
    const result = validateCreateEvent({ ...validEvent, submission_source: 'tavily' as any });
    expect(result.valid).toBe(true);
  });

  it('accepts virtual event with valid URL', () => {
    const result = validateCreateEvent({
      ...validEvent,
      is_virtual: true,
      virtual_url: 'https://zoom.us/meeting/123',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects virtual event with invalid URL', () => {
    const result = validateCreateEvent({
      ...validEvent,
      is_virtual: true,
      virtual_url: 'not-a-url',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('virtual_url'))).toBe(true);
  });

  it('rejects invalid ticket_url', () => {
    const result = validateCreateEvent({ ...validEvent, ticket_url: 'bad' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('ticket_url'))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// validateCreateReview — Section 7.1: WhatsApp Bot (consultancy_rating intent)
// ═══════════════════════════════════════════════════════════════════

describe('validateCreateReview', () => {
  const validReview = {
    reviewable_type: 'consultancy' as const,
    reviewable_id: '550e8400-e29b-41d4-a716-446655440000',
    reviewable_name: 'TechBridge Consulting',
    reviewer_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    reviewer_name: 'Ravi Kumar',
    rating: 3,
    submission_source: 'whatsapp' as const,
  };

  it('accepts valid review input', () => {
    const result = validateCreateReview(validReview);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts review for business type', () => {
    const result = validateCreateReview({ ...validReview, reviewable_type: 'business' });
    expect(result.valid).toBe(true);
  });

  it('accepts review via website', () => {
    const result = validateCreateReview({ ...validReview, submission_source: 'website' });
    expect(result.valid).toBe(true);
  });

  it('requires all mandatory fields', () => {
    const result = validateCreateReview({});
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('reviewable_type'))).toBe(true);
    expect(result.errors).toContain('reviewable_id is required');
    expect(result.errors).toContain('reviewable_name is required');
    expect(result.errors).toContain('reviewer_id is required');
    expect(result.errors).toContain('reviewer_name is required');
    expect(result.errors.some(e => e.includes('rating'))).toBe(true);
    expect(result.errors.some(e => e.includes('submission_source'))).toBe(true);
  });

  it('enforces rating between 1 and 5 (integer)', () => {
    // Valid ratings
    for (let r = 1; r <= 5; r++) {
      const result = validateCreateReview({ ...validReview, rating: r });
      expect(result.valid).toBe(true);
    }

    // Invalid ratings
    const tooLow = validateCreateReview({ ...validReview, rating: 0 });
    expect(tooLow.valid).toBe(false);
    expect(tooLow.errors.some(e => e.includes('rating'))).toBe(true);

    const tooHigh = validateCreateReview({ ...validReview, rating: 6 });
    expect(tooHigh.valid).toBe(false);

    const decimal = validateCreateReview({ ...validReview, rating: 3.5 });
    expect(decimal.valid).toBe(false);
    expect(decimal.errors.some(e => e.includes('integer'))).toBe(true);

    const negative = validateCreateReview({ ...validReview, rating: -1 });
    expect(negative.valid).toBe(false);
  });

  it('rejects invalid reviewable_type', () => {
    const result = validateCreateReview({ ...validReview, reviewable_type: 'event' as any });
    expect(result.valid).toBe(false);
  });

  it('only allows website or whatsapp as submission_source', () => {
    const admin = validateCreateReview({ ...validReview, submission_source: 'admin' as any });
    expect(admin.valid).toBe(false);

    const seed = validateCreateReview({ ...validReview, submission_source: 'seed' as any });
    expect(seed.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Cross-Cutting: Multiple Errors Accumulation
// ═══════════════════════════════════════════════════════════════════

describe('Error Accumulation', () => {
  it('collects all errors in a single validation pass (not short-circuit)', () => {
    const result = validateCreateBusiness({
      email: 'bad-email',
      website_url: 'bad-url',
    });
    // Should have errors for: name, category, address, city, state, zip_code,
    // submission_source, email, website_url
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(7);
  });

  it('returns empty errors array when valid', () => {
    const result = validateCreateUser({
      display_name: 'Valid User',
      phone_number: '+14695551234',
      created_via: 'whatsapp',
    });
    expect(result.errors).toEqual([]);
  });
});
