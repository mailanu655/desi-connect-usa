/**
 * Input Validators for all data models.
 *
 * Each validator returns { valid: boolean, errors: string[] }.
 * Used by both the middleware (WhatsApp submissions) and website (form submissions).
 */

import {
  CreateUserInput, CreateBusinessInput, CreateJobInput,
  CreateNewsInput, CreateDealInput, CreateConsultancyInput,
  CreateEventInput, CreateReviewInput, BusinessCategory,
  JobType, NewsCategory, EventCategory, ConsultancySpecialization,
  ReviewableType, DealType, PreferredChannel, CreatedVia, AuthProvider,
} from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ── Utility Helpers ──────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/; // E.164 format
const URL_REGEX = /^https?:\/\/.+/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

const VALID_BUSINESS_CATEGORIES: BusinessCategory[] = [
  'restaurant', 'grocery', 'temple', 'salon', 'clothing', 'jewelry',
  'medical', 'legal', 'tax_accounting', 'real_estate', 'travel', 'education', 'other'
];

const VALID_JOB_TYPES: JobType[] = ['full_time', 'part_time', 'contract', 'internship', 'freelance'];

const VALID_NEWS_CATEGORIES: NewsCategory[] = [
  'immigration', 'community', 'business', 'technology', 'lifestyle',
  'events', 'deals', 'politics', 'other'
];

const VALID_EVENT_CATEGORIES: EventCategory[] = [
  'cultural', 'religious', 'networking', 'educational', 'food_festival',
  'sports', 'charity', 'business', 'other'
];

const VALID_CONSULTANCY_SPECIALIZATIONS: ConsultancySpecialization[] = [
  'it_staffing', 'h1b_sponsor', 'opt_cpt', 'gc_processing',
  'immigration_legal', 'tax_accounting', 'general'
];

const VALID_DEAL_TYPES: DealType[] = ['percentage_off', 'fixed_amount', 'bogo', 'free_item', 'other'];
const VALID_REVIEWABLE_TYPES: ReviewableType[] = ['business', 'consultancy'];
const VALID_SUBMISSION_SOURCES = ['website', 'whatsapp', 'admin', 'seed'] as const;
const VALID_PREFERRED_CHANNELS: PreferredChannel[] = ['whatsapp', 'web', 'both'];
const VALID_CREATED_VIA: CreatedVia[] = ['whatsapp', 'website'];
const VALID_AUTH_PROVIDERS: AuthProvider[] = ['google', 'email_magic_link', 'phone_otp', 'none'];

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

function isValidEnum<T extends string>(val: unknown, values: readonly T[]): val is T {
  return typeof val === 'string' && (values as readonly string[]).includes(val);
}

// ── Validators ──────────────────────────────────────────────────

export function validateCreateUser(input: Partial<CreateUserInput>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.display_name)) errors.push('display_name is required');
  if (!isValidEnum(input.created_via, VALID_CREATED_VIA)) errors.push(`created_via must be one of: ${VALID_CREATED_VIA.join(', ')}`);

  if (input.phone_number !== undefined && input.phone_number !== null) {
    if (!PHONE_REGEX.test(input.phone_number)) errors.push('phone_number must be in E.164 format (e.g., +14695551234)');
  }
  if (input.email !== undefined && input.email !== null) {
    if (!EMAIL_REGEX.test(input.email)) errors.push('email must be a valid email address');
  }
  if (input.preferred_channel !== undefined) {
    if (!isValidEnum(input.preferred_channel, VALID_PREFERRED_CHANNELS)) errors.push(`preferred_channel must be one of: ${VALID_PREFERRED_CHANNELS.join(', ')}`);
  }
  if (input.auth_provider !== undefined) {
    if (!isValidEnum(input.auth_provider, VALID_AUTH_PROVIDERS)) errors.push(`auth_provider must be one of: ${VALID_AUTH_PROVIDERS.join(', ')}`);
  }

  // At least one identifier required
  if (!input.phone_number && !input.email) {
    errors.push('At least one of phone_number or email is required');
  }

  return { valid: errors.length === 0, errors };
}

export function validateCreateBusiness(input: Partial<CreateBusinessInput>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.name)) errors.push('name is required');
  if (!isValidEnum(input.category, VALID_BUSINESS_CATEGORIES)) errors.push(`category must be one of: ${VALID_BUSINESS_CATEGORIES.join(', ')}`);
  if (!isNonEmptyString(input.address)) errors.push('address is required');
  if (!isNonEmptyString(input.city)) errors.push('city is required');
  if (!isNonEmptyString(input.state)) errors.push('state is required');
  if (!isNonEmptyString(input.zip_code)) errors.push('zip_code is required');
  if (!isValidEnum(input.submission_source, VALID_SUBMISSION_SOURCES)) errors.push(`submission_source must be one of: ${VALID_SUBMISSION_SOURCES.join(', ')}`);

  if (input.email && !EMAIL_REGEX.test(input.email)) errors.push('email must be a valid email address');
  if (input.website_url && !URL_REGEX.test(input.website_url)) errors.push('website_url must be a valid URL');
  if (input.phone && !PHONE_REGEX.test(input.phone.replace(/[\s()-]/g, ''))) errors.push('phone must be a valid phone number');

  return { valid: errors.length === 0, errors };
}

export function validateCreateJob(input: Partial<CreateJobInput>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.title)) errors.push('title is required');
  if (!isNonEmptyString(input.company_name)) errors.push('company_name is required');
  if (!isNonEmptyString(input.description)) errors.push('description is required');
  if (!isNonEmptyString(input.city)) errors.push('city is required');
  if (!isNonEmptyString(input.state)) errors.push('state is required');
  if (!isValidEnum(input.job_type, VALID_JOB_TYPES)) errors.push(`job_type must be one of: ${VALID_JOB_TYPES.join(', ')}`);
  if (!isValidEnum(input.submission_source, VALID_SUBMISSION_SOURCES)) errors.push(`submission_source must be one of: ${VALID_SUBMISSION_SOURCES.join(', ')}`);

  if (input.salary_min !== undefined && input.salary_min !== null && input.salary_min < 0) errors.push('salary_min cannot be negative');
  if (input.salary_max !== undefined && input.salary_max !== null && input.salary_max < 0) errors.push('salary_max cannot be negative');
  if (input.salary_min && input.salary_max && input.salary_min > input.salary_max) errors.push('salary_min cannot exceed salary_max');
  if (input.apply_url && !URL_REGEX.test(input.apply_url)) errors.push('apply_url must be a valid URL');
  if (input.apply_email && !EMAIL_REGEX.test(input.apply_email)) errors.push('apply_email must be a valid email address');
  if (input.expires_at && !ISO_DATE_REGEX.test(input.expires_at)) errors.push('expires_at must be a valid ISO date');

  return { valid: errors.length === 0, errors };
}

export function validateCreateNews(input: Partial<CreateNewsInput>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.title)) errors.push('title is required');
  if (!isNonEmptyString(input.summary)) errors.push('summary is required');
  if (!isValidEnum(input.category, VALID_NEWS_CATEGORIES)) errors.push(`category must be one of: ${VALID_NEWS_CATEGORIES.join(', ')}`);
  if (!isValidEnum(input.source, ['tavily', 'manual', 'admin', 'rss'])) errors.push('source must be one of: tavily, manual, admin, rss');

  if (input.source_url && !URL_REGEX.test(input.source_url)) errors.push('source_url must be a valid URL');
  if (input.image_url && !URL_REGEX.test(input.image_url)) errors.push('image_url must be a valid URL');

  return { valid: errors.length === 0, errors };
}

export function validateCreateDeal(input: Partial<CreateDealInput>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.business_id)) errors.push('business_id is required');
  if (!isNonEmptyString(input.business_name)) errors.push('business_name is required');
  if (!isNonEmptyString(input.title)) errors.push('title is required');
  if (!isNonEmptyString(input.description)) errors.push('description is required');
  if (!isValidEnum(input.deal_type, VALID_DEAL_TYPES)) errors.push(`deal_type must be one of: ${VALID_DEAL_TYPES.join(', ')}`);
  if (!isNonEmptyString(input.city)) errors.push('city is required');
  if (!isNonEmptyString(input.state)) errors.push('state is required');
  if (!isNonEmptyString(input.expires_at)) errors.push('expires_at is required');
  if (input.expires_at && !ISO_DATE_REGEX.test(input.expires_at)) errors.push('expires_at must be a valid ISO date');
  if (!isValidEnum(input.submission_source, VALID_SUBMISSION_SOURCES)) errors.push(`submission_source must be one of: ${VALID_SUBMISSION_SOURCES.join(', ')}`);

  return { valid: errors.length === 0, errors };
}

export function validateCreateConsultancy(input: Partial<CreateConsultancyInput>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.name)) errors.push('name is required');
  if (!isNonEmptyString(input.city)) errors.push('city is required');
  if (!isNonEmptyString(input.state)) errors.push('state is required');
  if (!isValidEnum(input.submission_source, VALID_SUBMISSION_SOURCES)) errors.push(`submission_source must be one of: ${VALID_SUBMISSION_SOURCES.join(', ')}`);

  if (input.specializations) {
    for (const spec of input.specializations) {
      if (!isValidEnum(spec, VALID_CONSULTANCY_SPECIALIZATIONS)) {
        errors.push(`Invalid specialization: ${spec}. Must be one of: ${VALID_CONSULTANCY_SPECIALIZATIONS.join(', ')}`);
      }
    }
  }
  if (input.email && !EMAIL_REGEX.test(input.email)) errors.push('email must be a valid email address');
  if (input.website_url && !URL_REGEX.test(input.website_url)) errors.push('website_url must be a valid URL');

  return { valid: errors.length === 0, errors };
}

export function validateCreateEvent(input: Partial<CreateEventInput>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.title)) errors.push('title is required');
  if (!isNonEmptyString(input.description)) errors.push('description is required');
  if (!isValidEnum(input.category, VALID_EVENT_CATEGORIES)) errors.push(`category must be one of: ${VALID_EVENT_CATEGORIES.join(', ')}`);
  if (!isNonEmptyString(input.city)) errors.push('city is required');
  if (!isNonEmptyString(input.state)) errors.push('state is required');
  if (!isNonEmptyString(input.starts_at)) errors.push('starts_at is required');
  if (input.starts_at && !ISO_DATE_REGEX.test(input.starts_at)) errors.push('starts_at must be a valid ISO date');
  if (input.ends_at && !ISO_DATE_REGEX.test(input.ends_at)) errors.push('ends_at must be a valid ISO date');

  const validSources = ['website', 'whatsapp', 'admin', 'seed', 'tavily'] as const;
  if (!isValidEnum(input.submission_source, validSources)) errors.push(`submission_source must be one of: ${validSources.join(', ')}`);

  if (input.is_virtual && input.virtual_url && !URL_REGEX.test(input.virtual_url)) errors.push('virtual_url must be a valid URL');
  if (input.ticket_url && !URL_REGEX.test(input.ticket_url)) errors.push('ticket_url must be a valid URL');

  return { valid: errors.length === 0, errors };
}

export function validateCreateReview(input: Partial<CreateReviewInput>): ValidationResult {
  const errors: string[] = [];

  if (!isValidEnum(input.reviewable_type, VALID_REVIEWABLE_TYPES)) errors.push(`reviewable_type must be one of: ${VALID_REVIEWABLE_TYPES.join(', ')}`);
  if (!isNonEmptyString(input.reviewable_id)) errors.push('reviewable_id is required');
  if (!isNonEmptyString(input.reviewable_name)) errors.push('reviewable_name is required');
  if (!isNonEmptyString(input.reviewer_id)) errors.push('reviewer_id is required');
  if (!isNonEmptyString(input.reviewer_name)) errors.push('reviewer_name is required');

  if (typeof input.rating !== 'number' || input.rating < 1 || input.rating > 5 || !Number.isInteger(input.rating)) {
    errors.push('rating must be an integer between 1 and 5');
  }

  if (!isValidEnum(input.submission_source, ['website', 'whatsapp'])) {
    errors.push('submission_source must be website or whatsapp');
  }

  return { valid: errors.length === 0, errors };
}

// ── UUID Validator ──────────────────────────────────────────────

export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

export function isValidUrl(url: string): boolean {
  return URL_REGEX.test(url);
}

export function isValidISODate(date: string): boolean {
  return ISO_DATE_REGEX.test(date);
}

// ── Admin Validators (Week 14) ──────────────────────────────────
export * from './admin';
