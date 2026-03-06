/**
 * News/Articles Model (Section 6.1 - Immigration Hub + Homepage Feed)
 *
 * Immigration hub content: visa bulletin tracker, USCIS news,
 * green card priority date estimator, attorney directory.
 * P0 priority, MVP feature.
 *
 * Content sourced from Tavily API (Section 4.3) and manual submissions.
 */

export type NewsCategory =
  | 'immigration'
  | 'community'
  | 'business'
  | 'technology'
  | 'lifestyle'
  | 'events'
  | 'deals'
  | 'politics'
  | 'other';

export type NewsSource = 'tavily' | 'manual' | 'admin' | 'rss';
export type NewsStatus = 'published' | 'draft' | 'pending_review' | 'archived';

export interface NewsArticle {
  article_id: string;
  title: string;
  summary: string;
  content: string;
  source_url: string | null;
  source_name: string | null;
  image_url: string | null;
  category: NewsCategory;
  tags: string[];

  /** City relevance — null means national/all cities */
  city: string | null;
  state: string | null;

  source: NewsSource;
  status: NewsStatus;
  author_name: string | null;
  view_count: number;
  published_at: string;
  fetched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNewsInput {
  title: string;
  summary: string;
  content?: string;
  source_url?: string | null;
  source_name?: string | null;
  image_url?: string | null;
  category: NewsCategory;
  tags?: string[];
  city?: string | null;
  state?: string | null;
  source: NewsSource;
  author_name?: string | null;
  published_at?: string;
}

export interface NewsSearchParams {
  query?: string;
  category?: NewsCategory;
  city?: string;
  state?: string;
  source?: NewsSource;
  published_after?: string;
  published_before?: string;
  page?: number;
  limit?: number;
  sort_by?: 'newest' | 'popular' | 'relevance';
}
