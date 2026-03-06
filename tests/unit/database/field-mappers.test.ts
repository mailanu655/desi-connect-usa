/**
 * Field Mapper Tests
 *
 * Comprehensive tests for bidirectional field mapping between
 * TypeScript domain types and Teable's generic field format.
 *
 * Tests cover:
 * - fromFields: Teable fields → domain type (all 8 entities)
 * - toFields: Create input → Teable fields (all 8 entities)
 * - Edge cases: null/undefined handling, type coercion, defaults
 * - Round-trip consistency
 */

import {
  userFromFields, userToFields,
  businessFromFields, businessToFields,
  jobFromFields, jobToFields,
  newsFromFields, newsToFields,
  dealFromFields, dealToFields,
  consultancyFromFields, consultancyToFields,
  eventFromFields, eventToFields,
  reviewFromFields, reviewToFields,
} from '../../../packages/database/src/client/field-mappers';

// ─── User Field Mappers ─────────────────────────────────────────

describe('userFromFields', () => {
  const fullFields = {
    phone_number: '+12125551234',
    email: 'test@example.com',
    display_name: 'Test User',
    identity_linked: true,
    preferred_channel: 'whatsapp',
    city: 'Houston',
    created_via: 'website',
    auth_provider: 'google',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  };

  it('maps all fields correctly from a complete record', () => {
    const user = userFromFields('usr-1', fullFields);
    expect(user.user_id).toBe('usr-1');
    expect(user.phone_number).toBe('+12125551234');
    expect(user.email).toBe('test@example.com');
    expect(user.display_name).toBe('Test User');
    expect(user.identity_linked).toBe(true);
    expect(user.preferred_channel).toBe('whatsapp');
    expect(user.city).toBe('Houston');
    expect(user.created_via).toBe('website');
    expect(user.auth_provider).toBe('google');
    expect(user.created_at).toBe('2025-01-01T00:00:00Z');
    expect(user.updated_at).toBe('2025-01-02T00:00:00Z');
  });

  it('handles null/undefined phone and email', () => {
    const user = userFromFields('usr-2', { ...fullFields, phone_number: null, email: undefined });
    expect(user.phone_number).toBeNull();
    expect(user.email).toBeNull();
  });

  it('defaults preferred_channel to "whatsapp" when empty', () => {
    const user = userFromFields('usr-3', { ...fullFields, preferred_channel: '' });
    expect(user.preferred_channel).toBe('whatsapp');
  });

  it('defaults created_via to "website" when missing', () => {
    const user = userFromFields('usr-4', { ...fullFields, created_via: null });
    expect(user.created_via).toBe('website');
  });

  it('defaults auth_provider to "none" when missing', () => {
    const user = userFromFields('usr-5', { ...fullFields, auth_provider: undefined });
    expect(user.auth_provider).toBe('none');
  });

  it('coerces identity_linked from string "true"', () => {
    const user = userFromFields('usr-6', { ...fullFields, identity_linked: 'true' });
    expect(user.identity_linked).toBe(true);
  });

  it('coerces identity_linked from number 1', () => {
    const user = userFromFields('usr-7', { ...fullFields, identity_linked: 1 });
    expect(user.identity_linked).toBe(true);
  });

  it('returns false for identity_linked on falsy values', () => {
    const user = userFromFields('usr-8', { ...fullFields, identity_linked: 0 });
    expect(user.identity_linked).toBe(false);
  });

  it('handles completely empty fields', () => {
    const user = userFromFields('usr-9', {});
    expect(user.user_id).toBe('usr-9');
    expect(user.display_name).toBe('');
    expect(user.phone_number).toBeNull();
    expect(user.preferred_channel).toBe('whatsapp');
    expect(user.created_via).toBe('website');
    expect(user.auth_provider).toBe('none');
    expect(user.identity_linked).toBe(false);
  });
});

describe('userToFields', () => {
  it('maps required fields', () => {
    const fields = userToFields({
      display_name: 'Test User',
      created_via: 'whatsapp',
    });
    expect(fields.display_name).toBe('Test User');
    expect(fields.created_via).toBe('whatsapp');
  });

  it('includes optional fields when provided', () => {
    const fields = userToFields({
      display_name: 'Test',
      created_via: 'website',
      phone_number: '+12125551234',
      email: 'test@test.com',
      preferred_channel: 'both',
      city: 'Dallas',
      auth_provider: 'email_magic_link',
    });
    expect(fields.phone_number).toBe('+12125551234');
    expect(fields.email).toBe('test@test.com');
    expect(fields.preferred_channel).toBe('both');
    expect(fields.city).toBe('Dallas');
    expect(fields.auth_provider).toBe('email_magic_link');
  });

  it('omits undefined optional fields', () => {
    const fields = userToFields({
      display_name: 'Test',
      created_via: 'website',
    });
    expect(fields).not.toHaveProperty('phone_number');
    expect(fields).not.toHaveProperty('email');
    expect(fields).not.toHaveProperty('city');
    expect(fields).not.toHaveProperty('auth_provider');
  });
});

// ─── Business Field Mappers ─────────────────────────────────────

describe('businessFromFields', () => {
  const fullFields = {
    name: 'Taj Palace',
    category: 'restaurant',
    description: 'Fine Indian dining',
    address: '123 Main St',
    city: 'Houston',
    state: 'TX',
    zip_code: '77001',
    phone: '+17135551234',
    email: 'info@tajpalace.com',
    website_url: 'https://tajpalace.com',
    hours: 'Mon-Fri 11-10',
    photo_urls: ['url1', 'url2'],
    latitude: 29.7604,
    longitude: -95.3698,
    average_rating: 4.5,
    review_count: 120,
    status: 'approved',
    submitted_by: 'usr-1',
    submission_source: 'whatsapp',
    is_verified: true,
    is_premium: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  };

  it('maps all fields correctly', () => {
    const biz = businessFromFields('biz-1', fullFields);
    expect(biz.business_id).toBe('biz-1');
    expect(biz.name).toBe('Taj Palace');
    expect(biz.category).toBe('restaurant');
    expect(biz.latitude).toBe(29.7604);
    expect(biz.longitude).toBe(-95.3698);
    expect(biz.average_rating).toBe(4.5);
    expect(biz.review_count).toBe(120);
    expect(biz.is_verified).toBe(true);
    expect(biz.is_premium).toBe(false);
    expect(biz.photo_urls).toEqual(['url1', 'url2']);
  });

  it('handles null lat/lng', () => {
    const biz = businessFromFields('biz-2', { ...fullFields, latitude: null, longitude: null });
    expect(biz.latitude).toBeNull();
    expect(biz.longitude).toBeNull();
  });

  it('parses comma-separated photo_urls string', () => {
    const biz = businessFromFields('biz-3', { ...fullFields, photo_urls: 'url1, url2, url3' });
    expect(biz.photo_urls).toEqual(['url1', 'url2', 'url3']);
  });

  it('returns empty array for missing photo_urls', () => {
    const biz = businessFromFields('biz-4', { ...fullFields, photo_urls: null });
    expect(biz.photo_urls).toEqual([]);
  });

  it('defaults status to "pending"', () => {
    const biz = businessFromFields('biz-5', { ...fullFields, status: '' });
    expect(biz.status).toBe('pending');
  });

  it('defaults submission_source to "website"', () => {
    const biz = businessFromFields('biz-6', { ...fullFields, submission_source: null });
    expect(biz.submission_source).toBe('website');
  });

  it('defaults average_rating and review_count to 0 for missing values', () => {
    const biz = businessFromFields('biz-7', { ...fullFields, average_rating: null, review_count: undefined });
    expect(biz.average_rating).toBe(0);
    expect(biz.review_count).toBe(0);
  });
});

describe('businessToFields', () => {
  it('maps required fields', () => {
    const fields = businessToFields({
      name: 'Taj Palace',
      category: 'restaurant',
      address: '123 Main',
      city: 'Houston',
      state: 'TX',
      zip_code: '77001',
      submission_source: 'website',
    });
    expect(fields.name).toBe('Taj Palace');
    expect(fields.category).toBe('restaurant');
    expect(fields.zip_code).toBe('77001');
    expect(fields.submission_source).toBe('website');
  });

  it('includes optional fields when provided', () => {
    const fields = businessToFields({
      name: 'Taj Palace',
      category: 'restaurant',
      address: '123 Main',
      city: 'Houston',
      state: 'TX',
      zip_code: '77001',
      submission_source: 'website',
      description: 'Fine dining',
      phone: '+17135551234',
      latitude: 29.76,
      longitude: -95.37,
      photo_urls: ['url1'],
    });
    expect(fields.description).toBe('Fine dining');
    expect(fields.phone).toBe('+17135551234');
    expect(fields.latitude).toBe(29.76);
    expect(fields.photo_urls).toEqual(['url1']);
  });

  it('omits undefined optional fields', () => {
    const fields = businessToFields({
      name: 'Test',
      category: 'grocery',
      address: '456 Oak',
      city: 'Dallas',
      state: 'TX',
      zip_code: '75001',
      submission_source: 'whatsapp',
    });
    expect(fields).not.toHaveProperty('description');
    expect(fields).not.toHaveProperty('phone');
    expect(fields).not.toHaveProperty('website_url');
    expect(fields).not.toHaveProperty('latitude');
    expect(fields).not.toHaveProperty('longitude');
  });
});

// ─── Job Field Mappers ──────────────────────────────────────────

describe('jobFromFields', () => {
  const fullFields = {
    title: 'Senior Engineer',
    company_name: 'TechCorp',
    description: 'Build things',
    requirements: '5+ years experience',
    job_type: 'full_time',
    experience_level: 'senior',
    city: 'Austin',
    state: 'TX',
    is_remote: true,
    salary_min: 120000,
    salary_max: 180000,
    salary_currency: 'USD',
    h1b_sponsor: true,
    opt_friendly: true,
    consultancy_id: 'con-1',
    apply_url: 'https://apply.com/job1',
    apply_email: 'hr@techcorp.com',
    status: 'active',
    posted_by: 'usr-1',
    submission_source: 'website',
    expires_at: '2025-12-31',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  };

  it('maps all fields correctly', () => {
    const job = jobFromFields('job-1', fullFields);
    expect(job.job_id).toBe('job-1');
    expect(job.title).toBe('Senior Engineer');
    expect(job.requirements).toBe('5+ years experience');
    expect(job.salary_currency).toBe('USD');
    expect(job.consultancy_id).toBe('con-1');
    expect(job.posted_by).toBe('usr-1');
    expect(job.h1b_sponsor).toBe(true);
    expect(job.opt_friendly).toBe(true);
    expect(job.salary_min).toBe(120000);
    expect(job.salary_max).toBe(180000);
  });

  it('defaults salary_currency to "USD" when missing', () => {
    const job = jobFromFields('job-2', { ...fullFields, salary_currency: '' });
    expect(job.salary_currency).toBe('USD');
  });

  it('handles null salary range', () => {
    const job = jobFromFields('job-3', { ...fullFields, salary_min: null, salary_max: null });
    expect(job.salary_min).toBeNull();
    expect(job.salary_max).toBeNull();
  });

  it('defaults status to "active"', () => {
    const job = jobFromFields('job-4', { ...fullFields, status: '' });
    expect(job.status).toBe('active');
  });

  it('handles missing consultancy_id', () => {
    const job = jobFromFields('job-5', { ...fullFields, consultancy_id: null });
    expect(job.consultancy_id).toBeNull();
  });
});

describe('jobToFields', () => {
  it('maps required fields', () => {
    const fields = jobToFields({
      title: 'Senior Engineer',
      company_name: 'TechCorp',
      description: 'Build things',
      job_type: 'full_time',
      experience_level: 'senior',
      city: 'Austin',
      state: 'TX',
      submission_source: 'website',
    });
    expect(fields.title).toBe('Senior Engineer');
    expect(fields.company_name).toBe('TechCorp');
    expect(fields.job_type).toBe('full_time');
  });

  it('includes optional fields', () => {
    const fields = jobToFields({
      title: 'Engineer',
      company_name: 'Corp',
      description: 'Work',
      job_type: 'contract',
      experience_level: 'mid',
      city: 'Houston',
      state: 'TX',
      submission_source: 'website',
      requirements: 'Python, TypeScript',
      consultancy_id: 'con-1',
      posted_by: 'usr-1',
      is_remote: true,
      h1b_sponsor: true,
      salary_min: 100000,
    });
    expect(fields.requirements).toBe('Python, TypeScript');
    expect(fields.consultancy_id).toBe('con-1');
    expect(fields.posted_by).toBe('usr-1');
    expect(fields.is_remote).toBe(true);
    expect(fields.h1b_sponsor).toBe(true);
    expect(fields.salary_min).toBe(100000);
  });

  it('omits undefined optional fields', () => {
    const fields = jobToFields({
      title: 'Test',
      company_name: 'Test',
      description: 'Test',
      job_type: 'full_time',
      experience_level: 'entry',
      city: 'Dallas',
      state: 'TX',
      submission_source: 'website',
    });
    expect(fields).not.toHaveProperty('requirements');
    expect(fields).not.toHaveProperty('consultancy_id');
    expect(fields).not.toHaveProperty('posted_by');
    expect(fields).not.toHaveProperty('is_remote');
  });
});

// ─── News Field Mappers ─────────────────────────────────────────

describe('newsFromFields', () => {
  const fullFields = {
    title: 'H-1B Cap Season',
    summary: 'Changes for 2025',
    content: 'Full article content here...',
    source_url: 'https://news.com/h1b',
    source_name: 'Immigration Daily',
    image_url: 'https://img.com/h1b.jpg',
    category: 'immigration',
    tags: ['h1b', 'visa'],
    city: 'Washington',
    state: 'DC',
    source: 'tavily',
    status: 'published',
    author_name: 'Jane Reporter',
    view_count: 1500,
    published_at: '2025-03-15T00:00:00Z',
    fetched_at: '2025-03-15T01:00:00Z',
    created_at: '2025-03-15T01:00:00Z',
    updated_at: '2025-03-15T01:00:00Z',
  };

  it('maps all fields correctly', () => {
    const news = newsFromFields('art-1', fullFields);
    expect(news.article_id).toBe('art-1');
    expect(news.content).toBe('Full article content here...');
    expect(news.source_name).toBe('Immigration Daily');
    expect(news.author_name).toBe('Jane Reporter');
    expect(news.view_count).toBe(1500);
    expect(news.published_at).toBe('2025-03-15T00:00:00Z');
    expect(news.tags).toEqual(['h1b', 'visa']);
  });

  it('content is non-nullable (returns empty string for null)', () => {
    const news = newsFromFields('art-2', { ...fullFields, content: null });
    expect(news.content).toBe('');
  });

  it('published_at is non-nullable (returns empty string for null)', () => {
    const news = newsFromFields('art-3', { ...fullFields, published_at: null });
    expect(news.published_at).toBe('');
  });

  it('handles null author_name and source_name', () => {
    const news = newsFromFields('art-4', { ...fullFields, author_name: null, source_name: null });
    expect(news.author_name).toBeNull();
    expect(news.source_name).toBeNull();
  });

  it('defaults view_count to 0 when missing', () => {
    const news = newsFromFields('art-5', { ...fullFields, view_count: null });
    expect(news.view_count).toBe(0);
  });

  it('parses comma-separated tags string', () => {
    const news = newsFromFields('art-6', { ...fullFields, tags: 'h1b, visa, immigration' });
    expect(news.tags).toEqual(['h1b', 'visa', 'immigration']);
  });

  it('defaults status to "published"', () => {
    const news = newsFromFields('art-7', { ...fullFields, status: '' });
    expect(news.status).toBe('published');
  });
});

describe('newsToFields', () => {
  it('maps required fields', () => {
    const fields = newsToFields({
      title: 'H-1B Updates',
      summary: 'Cap season overview',
      category: 'immigration',
      source: 'tavily',
    });
    expect(fields.title).toBe('H-1B Updates');
    expect(fields.summary).toBe('Cap season overview');
    expect(fields.category).toBe('immigration');
    expect(fields.source).toBe('tavily');
  });

  it('includes optional fields', () => {
    const fields = newsToFields({
      title: 'Test',
      summary: 'Test',
      category: 'community',
      source: 'manual',
      content: 'Full content',
      source_name: 'Test Source',
      author_name: 'Author',
      tags: ['tag1', 'tag2'],
    });
    expect(fields.content).toBe('Full content');
    expect(fields.source_name).toBe('Test Source');
    expect(fields.author_name).toBe('Author');
    expect(fields.tags).toEqual(['tag1', 'tag2']);
  });

  it('omits undefined optional fields', () => {
    const fields = newsToFields({
      title: 'Test',
      summary: 'Test',
      category: 'business',
      source: 'tavily',
    });
    expect(fields).not.toHaveProperty('content');
    expect(fields).not.toHaveProperty('source_name');
    expect(fields).not.toHaveProperty('author_name');
  });
});

// ─── Deal Field Mappers ─────────────────────────────────────────

describe('dealFromFields', () => {
  const fullFields = {
    business_id: 'biz-1',
    business_name: 'Taj Palace',
    title: '20% Off Dinner',
    description: 'Valid weekdays',
    deal_type: 'percentage',
    discount_value: '20%',
    coupon_code: 'TAJ20',
    terms: 'Dine-in only',
    image_url: 'https://img.com/deal.jpg',
    city: 'Houston',
    state: 'TX',
    status: 'active',
    submitted_by: 'usr-1',
    submission_source: 'website',
    starts_at: '2025-01-01',
    expires_at: '2025-12-31',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  };

  it('maps all fields correctly', () => {
    const deal = dealFromFields('deal-1', fullFields);
    expect(deal.deal_id).toBe('deal-1');
    expect(deal.coupon_code).toBe('TAJ20');
    expect(deal.starts_at).toBe('2025-01-01');
    expect(deal.expires_at).toBe('2025-12-31');
    expect(deal.discount_value).toBe('20%');
  });

  it('starts_at and expires_at are non-nullable (empty string for null)', () => {
    const deal = dealFromFields('deal-2', { ...fullFields, starts_at: null, expires_at: null });
    expect(deal.starts_at).toBe('');
    expect(deal.expires_at).toBe('');
  });

  it('coupon_code is nullable', () => {
    const deal = dealFromFields('deal-3', { ...fullFields, coupon_code: null });
    expect(deal.coupon_code).toBeNull();
  });

  it('defaults status to "active"', () => {
    const deal = dealFromFields('deal-4', { ...fullFields, status: '' });
    expect(deal.status).toBe('active');
  });
});

describe('dealToFields', () => {
  it('maps required fields', () => {
    const fields = dealToFields({
      business_id: 'biz-1',
      business_name: 'Taj Palace',
      title: '20% Off',
      description: 'Valid weekdays',
      deal_type: 'percentage_off',
      city: 'Houston',
      state: 'TX',
      submission_source: 'website',
      expires_at: '2025-12-31',
    });
    expect(fields.business_id).toBe('biz-1');
    expect(fields.title).toBe('20% Off');
    expect(fields.deal_type).toBe('percentage_off');
  });

  it('includes coupon_code when provided', () => {
    const fields = dealToFields({
      business_id: 'biz-1',
      business_name: 'Taj Palace',
      title: '20% Off',
      description: 'Valid weekdays',
      deal_type: 'percentage_off',
      city: 'Houston',
      state: 'TX',
      submission_source: 'website',
      expires_at: '2025-12-31',
      coupon_code: 'TAJ20',
    });
    expect(fields.coupon_code).toBe('TAJ20');
  });

  it('omits undefined optional fields', () => {
    const fields = dealToFields({
      business_id: 'biz-1',
      business_name: 'Test',
      title: 'Test',
      description: 'Test',
      deal_type: 'bogo',
      city: 'Houston',
      state: 'TX',
      submission_source: 'website',
      expires_at: '2025-12-31',
    });
    expect(fields).not.toHaveProperty('coupon_code');
    expect(fields).not.toHaveProperty('discount_value');
    expect(fields).not.toHaveProperty('terms');
  });
});

// ─── Consultancy Field Mappers ──────────────────────────────────

describe('consultancyFromFields', () => {
  const fullFields = {
    name: 'Visa Solutions',
    description: 'Immigration consulting',
    specializations: ['h1b_sponsor', 'green_card'],
    website_url: 'https://visasolutions.com',
    phone: '+12125551234',
    email: 'info@visasolutions.com',
    address: '456 Elm St',
    city: 'Houston',
    state: 'TX',
    average_rating: 3.8,
    review_count: 45,
    is_verified: true,
    fraud_alert: false,
    fraud_alert_reason: null,
    status: 'active',
    submitted_by: 'usr-1',
    submission_source: 'website',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  };

  it('maps all fields correctly', () => {
    const con = consultancyFromFields('con-1', fullFields);
    expect(con.consultancy_id).toBe('con-1');
    expect(con.name).toBe('Visa Solutions');
    expect(con.specializations).toEqual(['h1b_sponsor', 'green_card']);
    expect(con.is_verified).toBe(true);
    expect(con.fraud_alert).toBe(false);
    expect(con.fraud_alert_reason).toBeNull();
  });

  it('parses comma-separated specializations', () => {
    const con = consultancyFromFields('con-2', { ...fullFields, specializations: 'h1b_sponsor, green_card' });
    expect(con.specializations).toEqual(['h1b_sponsor', 'green_card']);
  });

  it('defaults status to "active"', () => {
    const con = consultancyFromFields('con-3', { ...fullFields, status: '' });
    expect(con.status).toBe('active');
  });

  it('handles flagged_fraud status', () => {
    const con = consultancyFromFields('con-4', {
      ...fullFields,
      status: 'flagged_fraud',
      fraud_alert: true,
      fraud_alert_reason: 'Multiple complaints',
    });
    expect(con.status).toBe('flagged_fraud');
    expect(con.fraud_alert).toBe(true);
    expect(con.fraud_alert_reason).toBe('Multiple complaints');
  });
});

describe('consultancyToFields', () => {
  it('maps required fields', () => {
    const fields = consultancyToFields({
      name: 'Visa Solutions',
      city: 'Houston',
      state: 'TX',
      submission_source: 'website',
    });
    expect(fields.name).toBe('Visa Solutions');
    expect(fields.city).toBe('Houston');
    expect(fields.submission_source).toBe('website');
  });

  it('includes optional fields when provided', () => {
    const fields = consultancyToFields({
      name: 'Test',
      city: 'Houston',
      state: 'TX',
      submission_source: 'website',
      description: 'Desc',
      specializations: ['h1b_sponsor'],
      phone: '+12125551234',
    });
    expect(fields.description).toBe('Desc');
    expect(fields.specializations).toEqual(['h1b_sponsor']);
    expect(fields.phone).toBe('+12125551234');
  });
});

// ─── Event Field Mappers ────────────────────────────────────────

describe('eventFromFields', () => {
  const fullFields = {
    title: 'Diwali Celebration',
    description: 'Grand celebration',
    category: 'cultural',
    venue_name: 'Convention Center',
    address: '789 Park Ave',
    city: 'Houston',
    state: 'TX',
    is_virtual: false,
    virtual_url: null,
    image_url: 'https://img.com/diwali.jpg',
    organizer_name: 'IAH',
    organizer_contact: 'iah@email.com',
    ticket_url: 'https://tickets.com/diwali',
    is_free: false,
    price: '$25',
    starts_at: '2025-10-20T18:00:00Z',
    ends_at: '2025-10-20T23:00:00Z',
    rsvp_count: 500,
    status: 'upcoming',
    submitted_by: 'usr-1',
    submission_source: 'website',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  };

  it('maps all fields correctly', () => {
    const event = eventFromFields('evt-1', fullFields);
    expect(event.event_id).toBe('evt-1');
    expect(event.title).toBe('Diwali Celebration');
    expect(event.category).toBe('cultural');
    expect(event.is_virtual).toBe(false);
    expect(event.is_free).toBe(false);
    expect(event.price).toBe('$25');
    expect(event.rsvp_count).toBe(500);
    expect(event.starts_at).toBe('2025-10-20T18:00:00Z');
    expect(event.ends_at).toBe('2025-10-20T23:00:00Z');
  });

  it('defaults status to "upcoming"', () => {
    const event = eventFromFields('evt-2', { ...fullFields, status: '' });
    expect(event.status).toBe('upcoming');
  });

  it('handles virtual event', () => {
    const event = eventFromFields('evt-3', {
      ...fullFields,
      is_virtual: true,
      virtual_url: 'https://zoom.us/meeting',
      venue_name: null,
      address: null,
    });
    expect(event.is_virtual).toBe(true);
    expect(event.virtual_url).toBe('https://zoom.us/meeting');
    expect(event.venue_name).toBeNull();
  });

  it('defaults rsvp_count to 0 when missing', () => {
    const event = eventFromFields('evt-4', { ...fullFields, rsvp_count: null });
    expect(event.rsvp_count).toBe(0);
  });
});

describe('eventToFields', () => {
  it('maps required fields', () => {
    const fields = eventToFields({
      title: 'Diwali',
      description: 'Celebration',
      category: 'cultural',
      city: 'Houston',
      state: 'TX',
      starts_at: '2025-10-20T18:00:00Z',
      submission_source: 'website',
    });
    expect(fields.title).toBe('Diwali');
    expect(fields.starts_at).toBe('2025-10-20T18:00:00Z');
    expect(fields.category).toBe('cultural');
  });

  it('includes optional fields when provided', () => {
    const fields = eventToFields({
      title: 'Diwali',
      description: 'Celebration',
      category: 'cultural',
      city: 'Houston',
      state: 'TX',
      starts_at: '2025-10-20T18:00:00Z',
      submission_source: 'website',
      venue_name: 'Convention Center',
      is_virtual: false,
      is_free: true,
      ends_at: '2025-10-20T23:00:00Z',
    });
    expect(fields.venue_name).toBe('Convention Center');
    expect(fields.is_virtual).toBe(false);
    expect(fields.is_free).toBe(true);
    expect(fields.ends_at).toBe('2025-10-20T23:00:00Z');
  });
});

// ─── Review Field Mappers ───────────────────────────────────────

describe('reviewFromFields', () => {
  const fullFields = {
    reviewable_type: 'business',
    reviewable_id: 'biz-1',
    reviewable_name: 'Taj Palace',
    reviewer_id: 'usr-1',
    reviewer_name: 'John Doe',
    rating: 5,
    review_text: 'Excellent food!',
    status: 'published',
    submission_source: 'website',
    is_fraud_report: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  };

  it('maps all fields correctly', () => {
    const review = reviewFromFields('rev-1', fullFields);
    expect(review.review_id).toBe('rev-1');
    expect(review.reviewable_type).toBe('business');
    expect(review.reviewable_id).toBe('biz-1');
    expect(review.rating).toBe(5);
    expect(review.review_text).toBe('Excellent food!');
    expect(review.is_fraud_report).toBe(false);
  });

  it('handles null review_text', () => {
    const review = reviewFromFields('rev-2', { ...fullFields, review_text: null });
    expect(review.review_text).toBeNull();
  });

  it('defaults status to "pending"', () => {
    const review = reviewFromFields('rev-3', { ...fullFields, status: '' });
    expect(review.status).toBe('pending');
  });

  it('handles consultancy review type', () => {
    const review = reviewFromFields('rev-4', {
      ...fullFields,
      reviewable_type: 'consultancy',
      reviewable_id: 'con-1',
      is_fraud_report: true,
    });
    expect(review.reviewable_type).toBe('consultancy');
    expect(review.is_fraud_report).toBe(true);
  });

  it('coerces rating from string', () => {
    const review = reviewFromFields('rev-5', { ...fullFields, rating: '4' });
    expect(review.rating).toBe(4);
  });

  it('defaults rating to 0 for non-numeric value', () => {
    const review = reviewFromFields('rev-6', { ...fullFields, rating: 'abc' });
    expect(review.rating).toBe(0);
  });
});

describe('reviewToFields', () => {
  it('maps required fields', () => {
    const fields = reviewToFields({
      reviewable_type: 'business',
      reviewable_id: 'biz-1',
      reviewable_name: 'Taj Palace',
      reviewer_id: 'usr-1',
      reviewer_name: 'John Doe',
      rating: 5,
      submission_source: 'website',
    });
    expect(fields.reviewable_type).toBe('business');
    expect(fields.rating).toBe(5);
    expect(fields.reviewer_name).toBe('John Doe');
  });

  it('includes optional review_text', () => {
    const fields = reviewToFields({
      reviewable_type: 'business',
      reviewable_id: 'biz-1',
      reviewable_name: 'Taj Palace',
      reviewer_id: 'usr-1',
      reviewer_name: 'John Doe',
      rating: 4,
      submission_source: 'website',
      review_text: 'Great experience',
      is_fraud_report: false,
    });
    expect(fields.review_text).toBe('Great experience');
    expect(fields.is_fraud_report).toBe(false);
  });

  it('omits undefined optional fields', () => {
    const fields = reviewToFields({
      reviewable_type: 'consultancy',
      reviewable_id: 'con-1',
      reviewable_name: 'Visa Solutions',
      reviewer_id: 'usr-1',
      reviewer_name: 'Jane',
      rating: 2,
      submission_source: 'whatsapp',
    });
    expect(fields).not.toHaveProperty('review_text');
    expect(fields).not.toHaveProperty('is_fraud_report');
  });
});

// ─── Round-trip Consistency ─────────────────────────────────────

describe('Round-trip consistency', () => {
  it('user: toFields → fromFields preserves required data', () => {
    const input = { display_name: 'Test User', created_via: 'website' as const };
    const fields = userToFields(input);
    const user = userFromFields('usr-rt', fields);
    expect(user.display_name).toBe(input.display_name);
    expect(user.created_via).toBe(input.created_via);
  });

  it('business: toFields → fromFields preserves required data', () => {
    const input = {
      name: 'Taj Palace',
      category: 'restaurant' as const,
      address: '123 Main',
      city: 'Houston',
      state: 'TX',
      zip_code: '77001',
      submission_source: 'website' as const,
    };
    const fields = businessToFields(input);
    const biz = businessFromFields('biz-rt', fields);
    expect(biz.name).toBe(input.name);
    expect(biz.category).toBe(input.category);
    expect(biz.city).toBe(input.city);
    expect(biz.zip_code).toBe(input.zip_code);
  });

  it('review: toFields → fromFields preserves rating and type', () => {
    const input = {
      reviewable_type: 'business' as const,
      reviewable_id: 'biz-1',
      reviewable_name: 'Taj Palace',
      reviewer_id: 'usr-1',
      reviewer_name: 'John',
      rating: 5,
      submission_source: 'website' as const,
      review_text: 'Great!',
    };
    const fields = reviewToFields(input);
    const review = reviewFromFields('rev-rt', fields);
    expect(review.rating).toBe(input.rating);
    expect(review.review_text).toBe(input.review_text);
    expect(review.reviewable_type).toBe(input.reviewable_type);
  });
});
