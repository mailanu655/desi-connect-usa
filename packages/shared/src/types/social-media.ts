/**
 * Social Media Content Management types
 * Week 10: Daily content calendar, community graphics, video snippets
 */

export type SocialPlatform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'youtube';

export type ContentFormat = 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'text' | 'link';

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'archived';

export type ContentCategory =
  | 'community_spotlight'
  | 'business_feature'
  | 'event_promotion'
  | 'deal_alert'
  | 'cultural_content'
  | 'immigration_tips'
  | 'food_feature'
  | 'success_story'
  | 'festival_greeting'
  | 'job_highlight'
  | 'user_generated'
  | 'newsletter_teaser';

export interface SocialMediaPost {
  post_id: string;
  title: string;
  caption: string;
  platforms: SocialPlatform[];
  format: ContentFormat;
  category: ContentCategory;
  status: ContentStatus;
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
  engagement?: PostEngagement;
  related_content_id?: string;
  related_content_type?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PostEngagement {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  click_through_rate?: number;
}

export interface ContentCalendarEntry {
  date: string;
  day_of_week: string;
  posts: SocialMediaPost[];
  theme?: string;
  notes?: string;
}

export interface ContentCalendar {
  month: number;
  year: number;
  entries: ContentCalendarEntry[];
  total_posts: number;
  platforms_covered: SocialPlatform[];
}

export interface ContentTemplate {
  template_id: string;
  name: string;
  category: ContentCategory;
  platforms: SocialPlatform[];
  format: ContentFormat;
  caption_template: string;
  hashtag_suggestions: string[];
  best_posting_times: string[];
  tips: string[];
  example_media_url?: string;
}

export interface CreateSocialPostInput {
  title: string;
  caption: string;
  platforms: SocialPlatform[];
  format: ContentFormat;
  category: ContentCategory;
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
  platform_breakdown: PlatformMetrics[];
  category_breakdown: CategoryMetrics[];
}

export interface PlatformMetrics {
  platform: SocialPlatform;
  posts: number;
  reach: number;
  engagement: number;
  engagement_rate: number;
  followers_gained: number;
}

export interface CategoryMetrics {
  category: ContentCategory;
  posts: number;
  avg_engagement: number;
  best_performing_post_id?: string;
}

export interface ShareableContent {
  content_id: string;
  content_type: string;
  title: string;
  description: string;
  share_url: string;
  image_url?: string;
  platforms: SocialPlatform[];
  suggested_caption: string;
  suggested_hashtags: string[];
}
