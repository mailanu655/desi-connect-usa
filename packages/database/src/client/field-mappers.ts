/**
 * Field Mappers (Section 4.1)
 *
 * Converts between our TypeScript domain types and Teable's
 * generic Record<string, unknown> field format.
 *
 * Teable stores data as { fields: { "Column Name": value } }.
 * These mappers provide type-safe translation in both directions.
 */

import type {
  User,
  CreateUserInput,
  Business,
  CreateBusinessInput,
  Job,
  CreateJobInput,
  NewsArticle,
  CreateNewsInput,
  Deal,
  CreateDealInput,
  Consultancy,
  CreateConsultancyInput,
  Event,
  CreateEventInput,
  Review,
  CreateReviewInput,
} from '@desi-connect/shared';

// ---------- Generic helper ----------

type FieldMap = Record<string, unknown>;

function str(v: unknown): string {
  return v == null ? '' : String(v);
}

function strOrNull(v: unknown): string | null {
  return v == null || v === '' ? null : String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown): boolean {
  return v === true || v === 'true' || v === 1;
}

function strArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string' && v.length > 0) return v.split(',').map((s) => s.trim());
  return [];
}

// ---------- User ----------

export function userFromFields(id: string, f: FieldMap): User {
  return {
    user_id: id,
    phone_number: strOrNull(f.phone_number),
    email: strOrNull(f.email),
    display_name: str(f.display_name),
    identity_linked: bool(f.identity_linked),
    preferred_channel: (str(f.preferred_channel) || 'whatsapp') as User['preferred_channel'],
    city: strOrNull(f.city),
    created_via: (str(f.created_via) || 'website') as User['created_via'],
    auth_provider: (str(f.auth_provider) || 'none') as User['auth_provider'],
    created_at: str(f.created_at),
    updated_at: str(f.updated_at),
  };
}

export function userToFields(input: CreateUserInput): FieldMap {
  const fields: FieldMap = {
    display_name: input.display_name,
    created_via: input.created_via,
  };
  if (input.phone_number !== undefined) fields.phone_number = input.phone_number;
  if (input.email !== undefined) fields.email = input.email;
  if (input.preferred_channel !== undefined) fields.preferred_channel = input.preferred_channel;
  if (input.city !== undefined) fields.city = input.city;
  if (input.auth_provider !== undefined) fields.auth_provider = input.auth_provider;
  return fields;
}

// ---------- Business ----------

export function businessFromFields(id: string, f: FieldMap): Business {
  return {
    business_id: id,
    name: str(f.name),
    category: str(f.category) as Business['category'],
    description: str(f.description),
    address: str(f.address),
    city: str(f.city),
    state: str(f.state),
    zip_code: str(f.zip_code),
    phone: strOrNull(f.phone),
    email: strOrNull(f.email),
    website_url: strOrNull(f.website_url),
    hours: strOrNull(f.hours),
    photo_urls: strArray(f.photo_urls),
    latitude: f.latitude != null ? num(f.latitude) : null,
    longitude: f.longitude != null ? num(f.longitude) : null,
    average_rating: num(f.average_rating),
    review_count: num(f.review_count),
    status: (str(f.status) || 'pending') as Business['status'],
    submitted_by: strOrNull(f.submitted_by),
    submission_source: (str(f.submission_source) || 'website') as Business['submission_source'],
    is_verified: bool(f.is_verified),
    is_premium: bool(f.is_premium),
    created_at: str(f.created_at),
    updated_at: str(f.updated_at),
  };
}

export function businessToFields(input: CreateBusinessInput): FieldMap {
  const fields: FieldMap = {
    name: input.name,
    category: input.category,
    address: input.address,
    city: input.city,
    state: input.state,
    zip_code: input.zip_code,
    submission_source: input.submission_source,
  };
  if (input.description !== undefined) fields.description = input.description;
  if (input.phone !== undefined) fields.phone = input.phone;
  if (input.email !== undefined) fields.email = input.email;
  if (input.website_url !== undefined) fields.website_url = input.website_url;
  if (input.hours !== undefined) fields.hours = input.hours;
  if (input.photo_urls !== undefined) fields.photo_urls = input.photo_urls;
  if (input.latitude !== undefined) fields.latitude = input.latitude;
  if (input.longitude !== undefined) fields.longitude = input.longitude;
  if (input.submitted_by !== undefined) fields.submitted_by = input.submitted_by;
  return fields;
}

// ---------- Job ----------

export function jobFromFields(id: string, f: FieldMap): Job {
  return {
    job_id: id,
    title: str(f.title),
    company_name: str(f.company_name),
    description: str(f.description),
    requirements: str(f.requirements),
    job_type: str(f.job_type) as Job['job_type'],
    experience_level: str(f.experience_level) as Job['experience_level'],
    city: str(f.city),
    state: str(f.state),
    is_remote: bool(f.is_remote),
    salary_min: f.salary_min != null ? num(f.salary_min) : null,
    salary_max: f.salary_max != null ? num(f.salary_max) : null,
    salary_currency: str(f.salary_currency) || 'USD',
    h1b_sponsor: bool(f.h1b_sponsor),
    opt_friendly: bool(f.opt_friendly),
    consultancy_id: strOrNull(f.consultancy_id),
    apply_url: strOrNull(f.apply_url),
    apply_email: strOrNull(f.apply_email),
    status: (str(f.status) || 'active') as Job['status'],
    posted_by: strOrNull(f.posted_by),
    submission_source: (str(f.submission_source) || 'website') as Job['submission_source'],
    expires_at: strOrNull(f.expires_at),
    created_at: str(f.created_at),
    updated_at: str(f.updated_at),
  };
}

export function jobToFields(input: CreateJobInput): FieldMap {
  const fields: FieldMap = {
    title: input.title,
    company_name: input.company_name,
    description: input.description,
    job_type: input.job_type,
    experience_level: input.experience_level,
    city: input.city,
    state: input.state,
    submission_source: input.submission_source,
  };
  if (input.is_remote !== undefined) fields.is_remote = input.is_remote;
  if (input.salary_min !== undefined) fields.salary_min = input.salary_min;
  if (input.salary_max !== undefined) fields.salary_max = input.salary_max;
  if (input.h1b_sponsor !== undefined) fields.h1b_sponsor = input.h1b_sponsor;
  if (input.opt_friendly !== undefined) fields.opt_friendly = input.opt_friendly;
  if (input.requirements !== undefined) fields.requirements = input.requirements;
  if (input.consultancy_id !== undefined) fields.consultancy_id = input.consultancy_id;
  if (input.apply_url !== undefined) fields.apply_url = input.apply_url;
  if (input.apply_email !== undefined) fields.apply_email = input.apply_email;
  if (input.posted_by !== undefined) fields.posted_by = input.posted_by;
  if (input.expires_at !== undefined) fields.expires_at = input.expires_at;
  return fields;
}

// ---------- News ----------

export function newsFromFields(id: string, f: FieldMap): NewsArticle {
  return {
    article_id: id,
    title: str(f.title),
    summary: str(f.summary),
    content: str(f.content),
    source_url: strOrNull(f.source_url),
    source_name: strOrNull(f.source_name),
    image_url: strOrNull(f.image_url),
    category: str(f.category) as NewsArticle['category'],
    tags: strArray(f.tags),
    city: strOrNull(f.city),
    state: strOrNull(f.state),
    source: str(f.source) as NewsArticle['source'],
    status: (str(f.status) || 'published') as NewsArticle['status'],
    author_name: strOrNull(f.author_name),
    view_count: num(f.view_count),
    published_at: str(f.published_at),
    fetched_at: strOrNull(f.fetched_at),
    created_at: str(f.created_at),
    updated_at: str(f.updated_at),
  };
}

export function newsToFields(input: CreateNewsInput): FieldMap {
  const fields: FieldMap = {
    title: input.title,
    summary: input.summary,
    category: input.category,
    source: input.source,
  };
  if (input.content !== undefined) fields.content = input.content;
  if (input.source_url !== undefined) fields.source_url = input.source_url;
  if (input.source_name !== undefined) fields.source_name = input.source_name;
  if (input.image_url !== undefined) fields.image_url = input.image_url;
  if (input.author_name !== undefined) fields.author_name = input.author_name;
  if (input.tags !== undefined) fields.tags = input.tags;
  if (input.city !== undefined) fields.city = input.city;
  if (input.state !== undefined) fields.state = input.state;
  if (input.published_at !== undefined) fields.published_at = input.published_at;
  return fields;
}

// ---------- Deal ----------

export function dealFromFields(id: string, f: FieldMap): Deal {
  return {
    deal_id: id,
    business_id: str(f.business_id),
    business_name: str(f.business_name),
    title: str(f.title),
    description: str(f.description),
    deal_type: str(f.deal_type) as Deal['deal_type'],
    discount_value: strOrNull(f.discount_value),
    coupon_code: strOrNull(f.coupon_code),
    terms: strOrNull(f.terms),
    image_url: strOrNull(f.image_url),
    city: str(f.city),
    state: str(f.state),
    status: (str(f.status) || 'active') as Deal['status'],
    submitted_by: strOrNull(f.submitted_by),
    submission_source: (str(f.submission_source) || 'website') as Deal['submission_source'],
    starts_at: str(f.starts_at),
    expires_at: str(f.expires_at),
    created_at: str(f.created_at),
    updated_at: str(f.updated_at),
  };
}

export function dealToFields(input: CreateDealInput): FieldMap {
  const fields: FieldMap = {
    business_id: input.business_id,
    business_name: input.business_name,
    title: input.title,
    description: input.description,
    deal_type: input.deal_type,
    city: input.city,
    state: input.state,
    submission_source: input.submission_source,
  };
  if (input.discount_value !== undefined) fields.discount_value = input.discount_value;
  if (input.coupon_code !== undefined) fields.coupon_code = input.coupon_code;
  if (input.terms !== undefined) fields.terms = input.terms;
  if (input.image_url !== undefined) fields.image_url = input.image_url;
  if (input.submitted_by !== undefined) fields.submitted_by = input.submitted_by;
  if (input.starts_at !== undefined) fields.starts_at = input.starts_at;
  if (input.expires_at !== undefined) fields.expires_at = input.expires_at;
  return fields;
}

// ---------- Consultancy ----------

export function consultancyFromFields(id: string, f: FieldMap): Consultancy {
  return {
    consultancy_id: id,
    name: str(f.name),
    description: str(f.description),
    specializations: strArray(f.specializations) as Consultancy['specializations'],
    website_url: strOrNull(f.website_url),
    phone: strOrNull(f.phone),
    email: strOrNull(f.email),
    address: strOrNull(f.address),
    city: str(f.city),
    state: str(f.state),
    average_rating: num(f.average_rating),
    review_count: num(f.review_count),
    is_verified: bool(f.is_verified),
    fraud_alert: bool(f.fraud_alert),
    fraud_alert_reason: strOrNull(f.fraud_alert_reason),
    status: (str(f.status) || 'active') as Consultancy['status'],
    submitted_by: strOrNull(f.submitted_by),
    submission_source: (str(f.submission_source) || 'website') as Consultancy['submission_source'],
    created_at: str(f.created_at),
    updated_at: str(f.updated_at),
  };
}

export function consultancyToFields(input: CreateConsultancyInput): FieldMap {
  const fields: FieldMap = {
    name: input.name,
    city: input.city,
    state: input.state,
    submission_source: input.submission_source,
  };
  if (input.description !== undefined) fields.description = input.description;
  if (input.specializations !== undefined) fields.specializations = input.specializations;
  if (input.website_url !== undefined) fields.website_url = input.website_url;
  if (input.phone !== undefined) fields.phone = input.phone;
  if (input.email !== undefined) fields.email = input.email;
  if (input.address !== undefined) fields.address = input.address;
  if (input.submitted_by !== undefined) fields.submitted_by = input.submitted_by;
  return fields;
}

// ---------- Event ----------

export function eventFromFields(id: string, f: FieldMap): Event {
  return {
    event_id: id,
    title: str(f.title),
    description: str(f.description),
    category: str(f.category) as Event['category'],
    venue_name: strOrNull(f.venue_name),
    address: strOrNull(f.address),
    city: str(f.city),
    state: str(f.state),
    is_virtual: bool(f.is_virtual),
    virtual_url: strOrNull(f.virtual_url),
    image_url: strOrNull(f.image_url),
    organizer_name: strOrNull(f.organizer_name),
    organizer_contact: strOrNull(f.organizer_contact),
    ticket_url: strOrNull(f.ticket_url),
    is_free: bool(f.is_free),
    price: strOrNull(f.price),
    starts_at: str(f.starts_at),
    ends_at: strOrNull(f.ends_at),
    rsvp_count: num(f.rsvp_count),
    status: (str(f.status) || 'upcoming') as Event['status'],
    submitted_by: strOrNull(f.submitted_by),
    submission_source: (str(f.submission_source) || 'website') as Event['submission_source'],
    created_at: str(f.created_at),
    updated_at: str(f.updated_at),
  };
}

export function eventToFields(input: CreateEventInput): FieldMap {
  const fields: FieldMap = {
    title: input.title,
    description: input.description,
    category: input.category,
    city: input.city,
    state: input.state,
    starts_at: input.starts_at,
    submission_source: input.submission_source,
  };
  if (input.venue_name !== undefined) fields.venue_name = input.venue_name;
  if (input.address !== undefined) fields.address = input.address;
  if (input.is_virtual !== undefined) fields.is_virtual = input.is_virtual;
  if (input.virtual_url !== undefined) fields.virtual_url = input.virtual_url;
  if (input.image_url !== undefined) fields.image_url = input.image_url;
  if (input.organizer_name !== undefined) fields.organizer_name = input.organizer_name;
  if (input.organizer_contact !== undefined) fields.organizer_contact = input.organizer_contact;
  if (input.ticket_url !== undefined) fields.ticket_url = input.ticket_url;
  if (input.is_free !== undefined) fields.is_free = input.is_free;
  if (input.price !== undefined) fields.price = input.price;
  if (input.ends_at !== undefined) fields.ends_at = input.ends_at;
  if (input.submitted_by !== undefined) fields.submitted_by = input.submitted_by;
  return fields;
}

// ---------- Review ----------

export function reviewFromFields(id: string, f: FieldMap): Review {
  return {
    review_id: id,
    reviewable_type: str(f.reviewable_type) as Review['reviewable_type'],
    reviewable_id: str(f.reviewable_id),
    reviewable_name: str(f.reviewable_name),
    reviewer_id: str(f.reviewer_id),
    reviewer_name: str(f.reviewer_name),
    rating: num(f.rating),
    review_text: strOrNull(f.review_text),
    status: (str(f.status) || 'pending') as Review['status'],
    submission_source: (str(f.submission_source) || 'website') as Review['submission_source'],
    is_fraud_report: bool(f.is_fraud_report),
    created_at: str(f.created_at),
    updated_at: str(f.updated_at),
  };
}

export function reviewToFields(input: CreateReviewInput): FieldMap {
  const fields: FieldMap = {
    reviewable_type: input.reviewable_type,
    reviewable_id: input.reviewable_id,
    reviewable_name: input.reviewable_name,
    reviewer_id: input.reviewer_id,
    reviewer_name: input.reviewer_name,
    rating: input.rating,
    submission_source: input.submission_source,
  };
  if (input.review_text !== undefined) fields.review_text = input.review_text;
  if (input.is_fraud_report !== undefined) fields.is_fraud_report = input.is_fraud_report;
  return fields;
}
