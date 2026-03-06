/**
 * Type Compilation & Export Tests
 *
 * Verifies that all shared types compile correctly, are exported from
 * the barrel, and that type relationships hold. This file serves as
 * both a compilation check and a structural contract test.
 */

import type {
  // User types (Section 5.2)
  PreferredChannel,
  CreatedVia,
  AuthProvider,
  User,
  CreateUserInput,
  UpdateUserInput,
  IdentityLinkRequest,
  IdentityLinkResult,
  // Business types (Section 6.1)
  BusinessCategory,
  BusinessStatus,
  SubmissionSource,
  Business,
  CreateBusinessInput,
  BusinessSearchParams,
  // Job types (Section 6.1)
  JobType,
  ExperienceLevel,
  JobStatus,
  Job,
  CreateJobInput,
  JobSearchParams,
  // News types (Section 4.3)
  NewsCategory,
  NewsSource,
  NewsStatus,
  NewsArticle,
  CreateNewsInput,
  NewsSearchParams,
  // Deal types (Section 6.1)
  DealStatus,
  DealType,
  Deal,
  CreateDealInput,
  DealSearchParams,
  // Consultancy types (Section 6.1)
  ConsultancyStatus,
  ConsultancySpecialization,
  Consultancy,
  CreateConsultancyInput,
  ConsultancySearchParams,
  // Event types (Section 6.1)
  EventCategory,
  EventStatus,
  Event,
  CreateEventInput,
  EventSearchParams,
  // Review types (Section 7.1)
  ReviewableType,
  ReviewStatus,
  Review,
  CreateReviewInput,
  ReviewSearchParams,
  // WhatsApp types (Section 7)
  BotIntent,
  IntentClassification,
  IncomingWhatsAppMessage,
  OutgoingWhatsAppMessage,
  SessionStep,
  ConversationSession,
  TemplateType,
  WhatsAppTemplate,
  MessageClassification,
  ClassifiedMessage,
  // API types (Section 4)
  PaginatedResponse,
  ApiResponse,
  ApiError,
  TeableRecord,
  TeableListResponse,
  TeableWebhookPayload,
  NoCodeBackendResponse,
  TavilySearchResult,
  TavilySearchResponse,
  SyncDirection,
  SyncEvent,
} from '../../../packages/shared/src';

describe('Type Exports — Barrel file (@desi-connect/shared)', () => {
  it('exports all User-related types', () => {
    const channel: PreferredChannel = 'whatsapp';
    const via: CreatedVia = 'website';
    const auth: AuthProvider = 'google';
    expect(['whatsapp', 'web', 'both']).toContain(channel);
    expect(['whatsapp', 'website']).toContain(via);
    expect(['google', 'email_magic_link', 'phone_otp', 'none']).toContain(auth);
  });

  it('exports all Business-related types', () => {
    const cat: BusinessCategory = 'restaurant';
    const status: BusinessStatus = 'pending';
    const src: SubmissionSource = 'whatsapp';
    expect(cat).toBe('restaurant');
    expect(status).toBe('pending');
    expect(src).toBe('whatsapp');
  });

  it('exports all Job-related types', () => {
    const jt: JobType = 'full_time';
    const el: ExperienceLevel = 'senior';
    const js: JobStatus = 'active';
    expect(jt).toBe('full_time');
    expect(el).toBe('senior');
    expect(js).toBe('active');
  });

  it('exports all News-related types', () => {
    const nc: NewsCategory = 'immigration';
    const ns: NewsSource = 'tavily';
    const nst: NewsStatus = 'published';
    expect(nc).toBe('immigration');
    expect(ns).toBe('tavily');
    expect(nst).toBe('published');
  });

  it('exports all Deal-related types', () => {
    const ds: DealStatus = 'active';
    const dt: DealType = 'bogo';
    expect(ds).toBe('active');
    expect(dt).toBe('bogo');
  });

  it('exports all Consultancy-related types', () => {
    const cs: ConsultancyStatus = 'flagged_fraud';
    const sp: ConsultancySpecialization = 'h1b_sponsor';
    expect(cs).toBe('flagged_fraud');
    expect(sp).toBe('h1b_sponsor');
  });

  it('exports all Event-related types', () => {
    const ec: EventCategory = 'cultural';
    const es: EventStatus = 'upcoming';
    expect(ec).toBe('cultural');
    expect(es).toBe('upcoming');
  });

  it('exports all Review-related types', () => {
    const rt: ReviewableType = 'consultancy';
    const rs: ReviewStatus = 'published';
    expect(rt).toBe('consultancy');
    expect(rs).toBe('published');
  });

  it('exports all WhatsApp-related types', () => {
    const intent: BotIntent = 'search_businesses';
    const step: SessionStep = 'idle';
    const tmpl: TemplateType = 'daily_digest';
    const mc: MessageClassification = 'utility';
    expect(intent).toBe('search_businesses');
    expect(step).toBe('idle');
    expect(tmpl).toBe('daily_digest');
    expect(mc).toBe('utility');
  });

  it('exports all API-related types', () => {
    const dir: SyncDirection = 'website_to_whatsapp';
    expect(dir).toBe('website_to_whatsapp');
  });
});

describe('Type Structural Contracts', () => {
  it('CreateUserInput is assignable from a valid object', () => {
    const input: CreateUserInput = {
      display_name: 'Test User',
      phone_number: '+12125551234',
      created_via: 'whatsapp',
    };
    expect(input.display_name).toBe('Test User');
  });

  it('CreateBusinessInput requires mandatory fields', () => {
    const input: CreateBusinessInput = {
      name: 'Taj Palace',
      category: 'restaurant',
      address: '123 Main St',
      city: 'Houston',
      state: 'TX',
      zip_code: '77001',
      submission_source: 'website',
    };
    expect(input.name).toBe('Taj Palace');
  });

  it('PaginatedResponse generic works with Business[]', () => {
    const response: PaginatedResponse<Business> = {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
    };
    expect(response.data).toEqual([]);
    expect(response.pagination.total_pages).toBe(0);
  });

  it('ApiResponse wraps data correctly', () => {
    const resp: ApiResponse<string> = {
      success: true,
      data: 'hello',
      error: null,
      timestamp: new Date().toISOString(),
    };
    expect(resp.success).toBe(true);
    expect(resp.data).toBe('hello');
  });

  it('ApiError has required structure', () => {
    const err: ApiError = {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    };
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Resource not found');
  });

  it('ConversationSession has required fields', () => {
    const session: ConversationSession = {
      session_id: 'sess-123',
      user_phone: '+12125551234',
      user_id: null,
      current_step: 'collecting_business_name',
      intent: 'submit_business',
      data: {},
      last_activity: new Date().toISOString(),
      expires_at: new Date().toISOString(),
    };
    expect(session.intent).toBe('submit_business');
    expect(session.current_step).toBe('collecting_business_name');
  });

  it('SyncEvent tracks direction and source table', () => {
    const evt: SyncEvent = {
      sync_id: 'sync-001',
      direction: 'external_to_both',
      source_table: 'news',
      record_id: 'news-123',
      event_type: 'create',
      payload: { title: 'Test' },
      status: 'completed',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };
    expect(evt.direction).toBe('external_to_both');
    expect(evt.source_table).toBe('news');
  });

  it('TeableWebhookPayload tracks record lifecycle', () => {
    const payload: TeableWebhookPayload = {
      event: 'record.created',
      table_id: 'tbl_abc',
      record_id: 'rec_123',
      fields: { name: 'Test' },
      timestamp: new Date().toISOString(),
    };
    expect(payload.event).toBe('record.created');
  });

  it('ClassifiedMessage includes cost estimation', () => {
    const msg: ClassifiedMessage = {
      classification: 'marketing',
      template_type: 'deal_notification',
      is_within_session_window: false,
      estimated_cost_usd: 0.05,
    };
    expect(msg.classification).toBe('marketing');
    expect(msg.estimated_cost_usd).toBeGreaterThan(0);
  });
});
