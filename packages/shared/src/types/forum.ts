// Forum category
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

// Forum thread/discussion
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

// Forum reply/comment
export interface ForumReply {
  reply_id: string;
  thread_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  body: string;
  like_count: number;
  is_solution: boolean;
  parent_reply_id: string | null; // for nested replies
  created_at: string;
  updated_at: string;
}

// Forum user stats
export interface ForumUserStats {
  user_id: string;
  total_threads: number;
  total_replies: number;
  total_likes_received: number;
  reputation_score: number;
  badges: ForumBadge[];
}

export interface ForumBadge {
  badge_id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

// Moderation
export interface ForumReport {
  report_id: string;
  reporter_id: string;
  content_type: 'thread' | 'reply';
  content_id: string;
  reason: 'spam' | 'harassment' | 'off_topic' | 'inappropriate' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  moderator_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

// Input types for creating content
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

// Forum stats
export interface ForumStats {
  total_threads: number;
  total_replies: number;
  total_users: number;
  active_today: number;
  trending_tags: Array<{ tag: string; count: number }>;
}
