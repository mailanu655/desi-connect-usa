/**
 * API Client for Desi Connect USA website.
 * Reads from NoCodeBackend (fast cached reads) and writes to Teable (source of truth).
 */

export interface ApiClientConfig {
  noCodeBackendUrl: string;
  teableUrl: string;
  teableApiKey?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const DEFAULT_CONFIG: ApiClientConfig = {
  noCodeBackendUrl: process.env.NEXT_PUBLIC_NOCODEBACKEND_URL || 'http://localhost:3001/api',
  teableUrl: process.env.NEXT_PUBLIC_TEABLE_URL || 'http://localhost:3002/api',
  teableApiKey: process.env.TEABLE_API_KEY || '',
};

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ─── Read Operations (NoCodeBackend) ───────────────────────

  private async readGet<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.config.noCodeBackendUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, value);
        }
      });
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 }, // ISR: revalidate every 60s
    });

    if (!res.ok) {
      throw new ApiError(`GET ${endpoint} failed: ${res.status}`, res.status);
    }

    return res.json();
  }

  // ─── Write Operations (Teable) ─────────────────────────────

  private async writePost<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.config.teableUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.teableApiKey ? { Authorization: `Bearer ${this.config.teableApiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new ApiError(`POST ${endpoint} failed: ${res.status}`, res.status);
    }

    return res.json();
  }

  // ─── Business Directory ────────────────────────────────────

  async getBusinesses(params?: {
    category?: string;
    city?: string;
    state?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Business[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.category) queryParams.category = params.category;
    if (params?.city) queryParams.city = params.city;
    if (params?.state) queryParams.state = params.state;
    if (params?.search) queryParams.search = params.search;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return this.readGet<ApiResponse<Business[]>>('/businesses', queryParams);
  }

  async getBusinessById(id: string): Promise<Business> {
    return this.readGet<Business>(`/businesses/${id}`);
  }

  async getBusinessCategories(): Promise<string[]> {
    return this.readGet<string[]>('/businesses/categories');
  }

  // ─── News / Articles ───────────────────────────────────────

  async getNews(params?: {
    category?: string;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<NewsArticle[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.category) queryParams.category = params.category;
    if (params?.city) queryParams.city = params.city;
    if (params?.search) queryParams.search = params.search;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return this.readGet<ApiResponse<NewsArticle[]>>('/news', queryParams);
  }

  async getNewsById(id: string): Promise<NewsArticle> {
    return this.readGet<NewsArticle>(`/news/${id}`);
  }

  // ─── Jobs ──────────────────────────────────────────────────

  async getJobs(params?: {
    type?: string;
    city?: string;
    state?: string;
    h1b_sponsor?: boolean;
    opt_friendly?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Job[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.type) queryParams.type = params.type;
    if (params?.city) queryParams.city = params.city;
    if (params?.state) queryParams.state = params.state;
    if (params?.h1b_sponsor !== undefined) queryParams.h1b_sponsor = String(params.h1b_sponsor);
    if (params?.opt_friendly !== undefined) queryParams.opt_friendly = String(params.opt_friendly);
    if (params?.search) queryParams.search = params.search;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return this.readGet<ApiResponse<Job[]>>('/jobs', queryParams);
  }

  async getJobById(id: string): Promise<Job> {
    return this.readGet<Job>(`/jobs/${id}`);
  }

  // ─── Events ────────────────────────────────────────────────

  async getEvents(params?: {
    category?: string;
    city?: string;
    state?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<DesiEvent[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.category) queryParams.category = params.category;
    if (params?.city) queryParams.city = params.city;
    if (params?.state) queryParams.state = params.state;
    if (params?.search) queryParams.search = params.search;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return this.readGet<ApiResponse<DesiEvent[]>>('/events', queryParams);
  }

  async getEventById(id: string): Promise<DesiEvent> {
    return this.readGet<DesiEvent>(`/events/${id}`);
  }

  // ─── Deals ─────────────────────────────────────────────────

  async getDeals(params?: {
    city?: string;
    state?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Deal[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.city) queryParams.city = params.city;
    if (params?.state) queryParams.state = params.state;
    if (params?.search) queryParams.search = params.search;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return this.readGet<ApiResponse<Deal[]>>('/deals', queryParams);
  }

  async getDealById(id: string): Promise<Deal> {
    return this.readGet<Deal>(`/deals/${id}`);
  }

  async submitDeal(deal: CreateDealInput): Promise<Deal> {
    return this.writePost<Deal>('/deals', deal);
  }

  // ─── Consultancies ─────────────────────────────────────────

  async getConsultancies(params?: {
    specialization?: string;
    city?: string;
    state?: string;
    verified_only?: boolean;
    min_rating?: number;
    search?: string;
    sort_by?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Consultancy[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.specialization) queryParams.specialization = params.specialization;
    if (params?.city) queryParams.city = params.city;
    if (params?.state) queryParams.state = params.state;
    if (params?.verified_only !== undefined) queryParams.verified_only = String(params.verified_only);
    if (params?.min_rating !== undefined) queryParams.min_rating = String(params.min_rating);
    if (params?.search) queryParams.search = params.search;
    if (params?.sort_by) queryParams.sort_by = params.sort_by;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return this.readGet<ApiResponse<Consultancy[]>>('/consultancies', queryParams);
  }

  async getConsultancyById(id: string): Promise<Consultancy> {
    return this.readGet<Consultancy>(`/consultancies/${id}`);
  }

  async getConsultancySpecializations(): Promise<string[]> {
    return this.readGet<string[]>('/consultancies/specializations');
  }

  // ─── Reviews ────────────────────────────────────────────────

  async getReviews(params?: {
    reviewable_type?: string;
    reviewable_id?: string;
    min_rating?: number;
    sort_by?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Review[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.reviewable_type) queryParams.reviewable_type = params.reviewable_type;
    if (params?.reviewable_id) queryParams.reviewable_id = params.reviewable_id;
    if (params?.min_rating !== undefined) queryParams.min_rating = String(params.min_rating);
    if (params?.sort_by) queryParams.sort_by = params.sort_by;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return this.readGet<ApiResponse<Review[]>>('/reviews', queryParams);
  }

  async submitReview(review: CreateReviewInput): Promise<Review> {
    return this.writePost<Review>('/reviews', review);
  }

  // ─── City/State Aggregation ─────────────────────────────────

  async getCityData(state: string, city: string): Promise<CityPageData> {
    return this.readGet<CityPageData>(`/cities/${encodeURIComponent(state)}/${encodeURIComponent(city)}`);
  }

  async getAvailableCities(): Promise<CityInfo[]> {
    return this.readGet<CityInfo[]>('/cities');
  }

  // ─── User Profile ────────────────────────────────────────
  
  async getUserProfile(): Promise<UserProfileData> {
    return this.readGet<UserProfileData>('/users/profile');
  }

  async updateUserProfile(data: UpdateProfileInput): Promise<UserProfileData> {
    return this.writePost<UserProfileData>('/users/profile', data);
  }

  // ─── Submission History ──────────────────────────────────

  async getUserSubmissions(params?: {
    content_type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<UserSubmission[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.content_type) queryParams.content_type = params.content_type;
    if (params?.status) queryParams.status = params.status;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return this.readGet<ApiResponse<UserSubmission[]>>('/users/submissions', queryParams);
  }

  // ─── Saved Items / Favorites ─────────────────────────────

  async getSavedItems(params?: {
    item_type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<SavedItem[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.item_type) queryParams.item_type = params.item_type;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return this.readGet<ApiResponse<SavedItem[]>>('/users/saved', queryParams);
  }

  async saveItem(item_type: string, item_id: string): Promise<SavedItem> {
    return this.writePost<SavedItem>('/users/saved', { item_type, item_id });
  }

  async removeSavedItem(saved_id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${this.config.teableUrl}/users/saved/${saved_id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.teableApiKey ? { Authorization: `Bearer ${this.config.teableApiKey}` } : {}),
      },
    });

    if (!res.ok) {
      throw new ApiError(`DELETE /users/saved/${saved_id} failed: ${res.status}`, res.status);
    }

    return res.json();
  }

  // ─── Notification Preferences ────────────────────────────

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    return this.readGet<NotificationPreferences>('/users/notifications');
  }

  async updateNotificationPreferences(
    preferences: NotificationPreference[]
  ): Promise<NotificationPreferences> {
    return this.writePost<NotificationPreferences>('/users/notifications', { preferences });
  }

  // ─── Newsletter Subscriptions ──────────────────────────────

  async subscribeNewsletter(
    input: CreateNewsletterSubscriptionInput
  ): Promise<NewsletterSubscription> {
    return this.writePost<NewsletterSubscription>('/newsletter/subscribe', input);
  }

  async getNewsletterSubscription(email: string): Promise<NewsletterSubscription> {
    return this.readGet<NewsletterSubscription>(`/newsletter/subscription`, { email });
  }

  async updateNewsletterPreferences(
    email: string,
    preferences: UpdateNewsletterPreferencesInput
  ): Promise<NewsletterSubscription> {
    return this.writePost<NewsletterSubscription>('/newsletter/preferences', {
      email,
      ...preferences,
    });
  }

  async unsubscribeNewsletter(email: string): Promise<{ success: boolean }> {
    return this.writePost<{ success: boolean }>('/newsletter/unsubscribe', { email });
  }

  // ─── Social Media Content ──────────────────────────────────

  async getSocialPosts(params?: {
    status?: string;
    platform?: string;
    category?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<SocialMediaPost[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.platform) queryParams.platform = params.platform;
    if (params?.category) queryParams.category = params.category;
    if (params?.start_date) queryParams.start_date = params.start_date;
    if (params?.end_date) queryParams.end_date = params.end_date;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return this.readGet<ApiResponse<SocialMediaPost[]>>('/social/posts', queryParams);
  }

  async getSocialPostById(id: string): Promise<SocialMediaPost> {
    return this.readGet<SocialMediaPost>(`/social/posts/${id}`);
  }

  async createSocialPost(post: CreateSocialPostInput): Promise<SocialMediaPost> {
    return this.writePost<SocialMediaPost>('/social/posts', post);
  }

  async updateSocialPost(id: string, data: Partial<CreateSocialPostInput>): Promise<SocialMediaPost> {
    return this.writePost<SocialMediaPost>(`/social/posts/${id}`, data);
  }

  async getSocialAnalytics(params?: {
    period?: string;
    platform?: string;
  }): Promise<SocialMediaAnalytics> {
    const queryParams: Record<string, string> = {};
    if (params?.period) queryParams.period = params.period;
    if (params?.platform) queryParams.platform = params.platform;

    return this.readGet<SocialMediaAnalytics>('/social/analytics', queryParams);
  }

  async getContentTemplates(): Promise<ContentTemplate[]> {
    return this.readGet<ContentTemplate[]>('/social/templates');
  }

  // ─── Giveaway Campaigns ──────────────────────────────────

  async getGiveaways(params?: {
    status?: string;
    city?: string;
    state?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<GiveawayCampaign[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.city) queryParams.city = params.city;
    if (params?.state) queryParams.state = params.state;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return this.readGet<ApiResponse<GiveawayCampaign[]>>('/giveaways', queryParams);
  }

  async getGiveawayById(id: string): Promise<GiveawayCampaign> {
    return this.readGet<GiveawayCampaign>(`/giveaways/${id}`);
  }

  async createGiveaway(data: CreateGiveawayInput): Promise<GiveawayCampaign> {
    return this.writePost<GiveawayCampaign>('/giveaways', data);
  }

  async enterGiveaway(input: GiveawayEntryInput): Promise<GiveawayEntry> {
    return this.writePost<GiveawayEntry>('/giveaways/enter', input);
  }

  async getGiveawayParticipant(
    campaignId: string,
    email: string
  ): Promise<GiveawayParticipant> {
    return this.readGet<GiveawayParticipant>(
      `/giveaways/${campaignId}/participant`,
      { email }
    );
  }

  async getGiveawayStats(campaignId: string): Promise<GiveawayStats> {
    return this.readGet<GiveawayStats>(`/giveaways/${campaignId}/stats`);
  }

  async getGiveawayReferral(
    campaignId: string,
    referralCode: string
  ): Promise<GiveawayReferral> {
    return this.readGet<GiveawayReferral>(
      `/giveaways/${campaignId}/referral`,
      { code: referralCode }
    );
  }

  // ─── Community Forum ──────────────────────────────────────

  async getForumThreads(params?: {
    category?: string;
    status?: string;
    city?: string;
    tags?: string;
    sort?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ForumThread[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.category) queryParams.category = params.category;
    if (params?.status) queryParams.status = params.status;
    if (params?.city) queryParams.city = params.city;
    if (params?.tags) queryParams.tags = params.tags;
    if (params?.sort) queryParams.sort = params.sort;
    if (params?.search) queryParams.search = params.search;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return this.readGet<ApiResponse<ForumThread[]>>('/forum', queryParams);
  }

  async getForumThreadById(threadId: string): Promise<ForumThread> {
    return this.readGet<ForumThread>(`/forum/${threadId}`);
  }

  async createForumThread(data: CreateThreadInput): Promise<ForumThread> {
    return this.writePost<ForumThread>('/forum', data);
  }

  async updateForumThread(
    threadId: string,
    data: Partial<ForumThread>
  ): Promise<ForumThread> {
    const res = await fetch(`${this.config.teableUrl}/forum/${threadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.teableApiKey ? { Authorization: `Bearer ${this.config.teableApiKey}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new ApiError(`PATCH /forum/${threadId} failed: ${res.status}`, res.status);
    }

    return res.json();
  }

  async getForumReplies(threadId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ForumReply[]>> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    return this.readGet<ApiResponse<ForumReply[]>>(
      `/forum/${threadId}/replies`,
      queryParams
    );
  }

  async createForumReply(data: CreateReplyInput): Promise<ForumReply> {
    return this.writePost<ForumReply>(
      `/forum/${data.thread_id}/replies`,
      data
    );
  }
}

// ─── Types (local to web, mirrors shared types for API responses) ─────

export interface Business {
  business_id: string;
  name: string;
  category: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
  email?: string;
  website?: string;
  hours?: string;
  image_url?: string;
  rating?: number;
  review_count?: number;
  status: string;
  created_at: string;
}

export interface NewsArticle {
  news_id: string;
  title: string;
  summary: string;
  content?: string;
  category: string;
  source_name: string;
  source_url: string;
  image_url?: string;
  city?: string;
  state?: string;
  tags?: string[];
  view_count: number;
  published_date: string;
  status: string;
}

export interface Job {
  job_id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  city: string;
  state: string;
  job_type: string;
  experience_level: string;
  salary_min?: number;
  salary_max?: number;
  h1b_sponsor: boolean;
  opt_friendly: boolean;
  apply_url?: string;
  posted_date: string;
  expiry_date?: string;
  status: string;
}

export interface DesiEvent {
  event_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  city: string;
  state: string;
  start_date: string;
  end_date?: string;
  is_virtual: boolean;
  is_free: boolean;
  registration_url?: string;
  image_url?: string;
  organizer?: string;
  status: string;
  rsvp_count?: number;
  venue_name?: string;
  address?: string;
  virtual_url?: string;
  organizer_contact?: string;
  price?: string;
  ticket_url?: string;
}

export interface Deal {
  deal_id: string;
  business_name: string;
  title: string;
  description: string;
  deal_type: string;
  discount_value?: string;
  coupon_code?: string;
  expiry_date: string;
  city: string;
  state: string;
  image_url?: string;
  status: string;
}

export interface Consultancy {
  consultancy_id: string;
  name: string;
  specialization: string;
  specializations?: string[];
  description?: string;
  city: string;
  state: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  rating?: number;
  review_count?: number;
  is_verified: boolean;
  fraud_alert: boolean;
  fraud_alert_reason?: string;
  status: string;
  created_at?: string;
}

export interface Review {
  review_id: string;
  reviewable_type: string;
  reviewable_id: string;
  reviewable_name: string;
  reviewer_id: string;
  reviewer_name: string;
  rating: number;
  review_text: string | null;
  status: string;
  submission_source: string;
  is_fraud_report: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewInput {
  reviewable_type: string;
  reviewable_id: string;
  reviewable_name: string;
  rating: number;
  review_text?: string | null;
  is_fraud_report?: boolean;
}

export interface CreateDealInput {
  business_name: string;
  title: string;
  description: string;
  deal_type: string;
  discount_value?: string;
  coupon_code?: string;
  expiry_date: string;
  city: string;
  state: string;
  image_url?: string;
}

export interface CityPageData {
  city: string;
  state: string;
  businesses: Business[];
  events: DesiEvent[];
  deals: Deal[];
  consultancies: Consultancy[];
  jobs: Job[];
  stats: {
    total_businesses: number;
    total_events: number;
    total_deals: number;
    total_consultancies: number;
    total_jobs: number;
  };
}

export interface CityInfo {
  city: string;
  state: string;
  slug: string;
  business_count: number;
  event_count: number;
}


export interface UserProfileData {
  user_id: string;
  display_name: string;
  email: string | null;
  phone_number: string | null;
  avatar_url?: string;
  city?: string;
  state?: string;
  preferred_channel: 'whatsapp' | 'web' | 'both';
  identity_linked: boolean;
  auth_provider: string;
  is_verified: boolean;
  created_via: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubmission {
  submission_id: string;
  user_id: string;
  content_type: string;
  content_id: string;
  title: string;
  status: string;
  submitted_at: string;
  updated_at: string;
  rejection_reason?: string;
}

export interface SavedItem {
  saved_id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  item_title: string;
  item_subtitle?: string;
  item_image_url?: string;
  saved_at: string;
}

export interface NotificationPreference {
  type: string;
  label: string;
  description: string;
  enabled: boolean;
  frequency: string;
  channels: string[];
}

export interface NotificationPreferences {
  user_id: string;
  preferences: NotificationPreference[];
  updated_at: string;
}

export interface UpdateProfileInput {
  display_name?: string;
  city?: string;
  state?: string;
  preferred_channel?: string;
  avatar_url?: string;
}
export type DigestFrequency = 'daily' | 'weekly' | 'never';
export type DigestType = 'community' | 'immigration' | 'deals' | 'jobs' | 'events';

export interface NewsletterSubscription {
  subscription_id: string;
  email: string;
  name?: string;
  city?: string;
  state?: string;
  digest_types: DigestType[];
  frequency: DigestFrequency;
  whatsapp_opted_in: boolean;
  whatsapp_number?: string;
  is_verified: boolean;
  subscribed_at: string;
  updated_at: string;
  status: 'active' | 'unsubscribed' | 'pending';
}

export interface CreateNewsletterSubscriptionInput {
  email: string;
  name?: string;
  city?: string;
  state?: string;
  digest_types: DigestType[];
  frequency: DigestFrequency;
  whatsapp_opted_in?: boolean;
  whatsapp_number?: string;
}

export interface UpdateNewsletterPreferencesInput {
  digest_types?: DigestType[];
  frequency?: DigestFrequency;
  whatsapp_opted_in?: boolean;
  whatsapp_number?: string;
  city?: string;
  state?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Types (local to web, mirrors shared types for API responses) ─────

// Social Media types
export interface SocialMediaPost {
  post_id: string;
  title: string;
  caption: string;
  platforms: string[];
  format: string;
  category: string;
  status: string;
  scheduled_date: string;
  scheduled_time?: string;
  published_date?: string;
  media_urls: string[];
  thumbnail_url?: string;
  hashtags: string[];
  mentions: string[];
  link_url?: string;
  city?: string;
  state?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reach: number;
    impressions: number;
    click_through_rate?: number;
  };
  related_content_id?: string;
  related_content_type?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSocialPostInput {
  title: string;
  caption: string;
  platforms: string[];
  format: string;
  category: string;
  scheduled_date: string;
  scheduled_time?: string;
  media_urls?: string[];
  hashtags?: string[];
  mentions?: string[];
  link_url?: string;
  city?: string;
  state?: string;
  related_content_id?: string;
  related_content_type?: string;
}

export interface SocialMediaAnalytics {
  period: string;
  total_posts: number;
  total_reach: number;
  total_engagement: number;
  avg_engagement_rate: number;
  top_performing_posts: SocialMediaPost[];
  platform_breakdown: Array<{
    platform: string;
    posts: number;
    reach: number;
    engagement: number;
    engagement_rate: number;
    followers_gained: number;
  }>;
  category_breakdown: Array<{
    category: string;
    posts: number;
    avg_engagement: number;
    best_performing_post_id?: string;
  }>;
}

export interface ContentTemplate {
  template_id: string;
  name: string;
  category: string;
  platforms: string[];
  format: string;
  caption_template: string;
  hashtag_suggestions: string[];
  best_posting_times: string[];
  tips: string[];
  example_media_url?: string;
}

// Giveaway types
export interface GiveawayCampaign {
  campaign_id: string;
  title: string;
  description: string;
  short_description: string;
  prize_description: string;
  prize_value: string;
  prize_image_url?: string;
  sponsor_name: string;
  sponsor_logo_url?: string;
  sponsor_website?: string;
  status: string;
  start_date: string;
  end_date: string;
  city?: string;
  state?: string;
  rules_url?: string;
  terms_text?: string;
  max_entries_per_user: number;
  entry_methods: EntryMethodConfig[];
  total_entries: number;
  total_participants: number;
  winner_count: number;
  winners?: GiveawayWinner[];
  share_url: string;
  og_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface EntryMethodConfig {
  method: string;
  label: string;
  description: string;
  points: number;
  max_entries: number;
  is_required: boolean;
  action_url?: string;
  verification_type?: string;
}

export interface GiveawayEntry {
  entry_id: string;
  campaign_id: string;
  participant_id: string;
  entry_method: string;
  points_earned: number;
  referral_code?: string;
  referred_by?: string;
  metadata?: Record<string, string>;
  is_verified: boolean;
  created_at: string;
}

export interface GiveawayParticipant {
  participant_id: string;
  campaign_id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  total_entries: number;
  total_points: number;
  referral_code: string;
  referral_count: number;
  referral_entries: number;
  entries: GiveawayEntry[];
  joined_at: string;
}

export interface GiveawayWinner {
  winner_id: string;
  campaign_id: string;
  participant_id: string;
  participant_name: string;
  participant_email: string;
  prize_description: string;
  total_entries: number;
  selected_at: string;
  notified: boolean;
  claimed: boolean;
  claimed_at?: string;
}

export interface GiveawayReferral {
  referral_code: string;
  referrer_id: string;
  referrer_name: string;
  campaign_id: string;
  total_referrals: number;
  share_url: string;
}

export interface GiveawayEntryInput {
  campaign_id: string;
  entry_method: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  referral_code?: string;
  metadata?: Record<string, string>;
}

export interface GiveawayStats {
  campaign_id: string;
  total_entries: number;
  total_participants: number;
  entries_today: number;
  participants_today: number;
  referral_entries: number;
  top_referrers: Array<{
    participant_id: string;
    name: string;
    referral_count: number;
  }>;
  entry_method_breakdown: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  daily_entries: Array<{
    date: string;
    entries: number;
    participants: number;
  }>;
  city_breakdown: Array<{
    city: string;
    state: string;
    participants: number;
  }>;
}

export interface CreateGiveawayInput {
  title: string;
  description: string;
  short_description: string;
  prize_description: string;
  prize_value: string;
  prize_image_url?: string;
  sponsor_name: string;
  sponsor_logo_url?: string;
  sponsor_website?: string;
  start_date: string;
  end_date: string;
  city?: string;
  state?: string;
  rules_url?: string;
  terms_text?: string;
  max_entries_per_user?: number;
  entry_methods: EntryMethodConfig[];
  winner_count?: number;
}

// ─── Community Forum ──────────────────────────────────────

export interface ForumThread {
  thread_id: string;
  category_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  title: string;
  slug: string;
  body: string;
  status: 'open' | 'closed' | 'pinned' | 'archived';
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  like_count: number;
  last_reply_at: string | null;
  last_reply_by: string | null;
  tags: string[];
  city?: string;
  state?: string;
  created_at: string;
  updated_at: string;
}

export interface ForumReply {
  reply_id: string;
  thread_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  body: string;
  like_count: number;
  is_solution: boolean;
  parent_reply_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ForumCategory {
  category_id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  post_count: number;
  last_post_at: string | null;
  sort_order: number;
}

export interface CreateThreadInput {
  category_id: string;
  title: string;
  body: string;
  tags?: string[];
  city?: string;
  state?: string;
}

export interface CreateReplyInput {
  thread_id: string;
  body: string;
  parent_reply_id?: string;
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
