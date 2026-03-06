/**
 * Common API Types
 *
 * Shared request/response patterns used across Teable API client,
 * NoCodeBackend, and the middleware layer.
 */

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Teable-specific API types (Section 4.1)
 */
export interface TeableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime: string;
}

export interface TeableListResponse {
  records: TeableRecord[];
  offset?: string;
}

export interface TeableWebhookPayload {
  event: 'record.created' | 'record.updated' | 'record.deleted';
  table_id: string;
  record_id: string;
  fields: Record<string, unknown>;
  previous_fields?: Record<string, unknown>;
  timestamp: string;
}

/**
 * NoCodeBackend API types (Section 4.1)
 */
export interface NoCodeBackendResponse<T> {
  status: number;
  data: T[];
  count: number;
  page: number;
  pages: number;
}

/**
 * Tavily API types (Section 4.3)
 */
export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
  images?: string[];
}

export interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  response_time: number;
}

/**
 * Sync event types (Section 8)
 * Used for the 3-hop sync architecture
 */
export type SyncDirection =
  | 'website_to_whatsapp'    // Website → Teable → Webhook → Twilio
  | 'whatsapp_to_website'    // Twilio → Middleware → Teable → NoCodeBackend
  | 'external_to_both';      // Tavily → Teable → Both channels

export interface SyncEvent {
  sync_id: string;
  direction: SyncDirection;
  source_table: string;
  record_id: string;
  event_type: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  created_at: string;
  completed_at?: string;
}
