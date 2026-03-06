/**
 * Community Forum utilities
 * Handles forum operations including slug generation, category management,
 * time formatting, reputation scoring, content validation, and thread sorting
 */

import type {
  ForumCategory,
  ForumThread,
  CreateThreadInput,
  CreateReplyInput,
} from '@desi-connect/shared';

// ─── Slug Generation ───────────────────────────────────────

/**
 * Generate a URL-safe slug from a title
 * Removes special characters, converts to lowercase, and replaces spaces with hyphens
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// ─── Default Categories ───────────────────────────────────

/**
 * Get the 8 default forum categories for Desi Connect
 */
export function getDefaultCategories(): ForumCategory[] {
  return [
    {
      category_id: 'immigration',
      name: 'Immigration',
      slug: 'immigration',
      description:
        'Discuss visa processes, green cards, citizenship, and immigration updates',
      icon: 'passport',
      post_count: 0,
      last_post_at: null,
      sort_order: 1,
    },
    {
      category_id: 'jobs',
      name: 'Jobs',
      slug: 'jobs',
      description: 'Job postings, career advice, and employment opportunities',
      icon: 'briefcase',
      post_count: 0,
      last_post_at: null,
      sort_order: 2,
    },
    {
      category_id: 'business',
      name: 'Business',
      slug: 'business',
      description: 'Business networking, startups, and entrepreneurship discussions',
      icon: 'building',
      post_count: 0,
      last_post_at: null,
      sort_order: 3,
    },
    {
      category_id: 'food',
      name: 'Food & Recipes',
      slug: 'food-recipes',
      description: 'Share recipes, restaurant recommendations, and cooking tips',
      icon: 'utensils',
      post_count: 0,
      last_post_at: null,
      sort_order: 4,
    },
    {
      category_id: 'events',
      name: 'Events',
      slug: 'events',
      description: 'Local events, meetups, and community gatherings',
      icon: 'calendar',
      post_count: 0,
      last_post_at: null,
      sort_order: 5,
    },
    {
      category_id: 'housing',
      name: 'Housing',
      slug: 'housing',
      description: 'Apartment rentals, real estate, and housing tips',
      icon: 'home',
      post_count: 0,
      last_post_at: null,
      sort_order: 6,
    },
    {
      category_id: 'general',
      name: 'General Discussion',
      slug: 'general',
      description: 'General topics and off-topic discussions',
      icon: 'message-circle',
      post_count: 0,
      last_post_at: null,
      sort_order: 7,
    },
    {
      category_id: 'feedback',
      name: 'Feedback',
      slug: 'feedback',
      description: 'Suggestions, bug reports, and feature requests for Desi Connect',
      icon: 'lightbulb',
      post_count: 0,
      last_post_at: null,
      sort_order: 8,
    },
  ];
}

// ─── Time Formatting ───────────────────────────────────────

/**
 * Format a date string as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  } else {
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  }
}

// ─── Reputation System ─────────────────────────────────────

/**
 * Get the reputation level and title based on reputation score
 */
export function getReputationLevel(score: number): {
  level: string;
  title: string;
  color: string;
} {
  if (score < 10) {
    return { level: 'newbie', title: 'Newbie', color: '#6B7280' };
  } else if (score < 50) {
    return { level: 'contributor', title: 'Contributor', color: '#3B82F6' };
  } else if (score < 100) {
    return { level: 'member', title: 'Member', color: '#10B981' };
  } else if (score < 250) {
    return { level: 'trusted', title: 'Trusted Member', color: '#F59E0B' };
  } else if (score < 500) {
    return { level: 'expert', title: 'Expert', color: '#8B5CF6' };
  } else if (score < 1000) {
    return { level: 'moderator', title: 'Moderator', color: '#DC2626' };
  } else {
    return { level: 'admin', title: 'Administrator', color: '#1F2937' };
  }
}

// ─── Content Formatting ────────────────────────────────────

/**
 * Truncate long post content for preview
 * @param body The body text to truncate
 * @param maxLength Maximum length (default 200)
 * @returns Truncated text with ellipsis if needed
 */
export function truncateBody(body: string, maxLength: number = 200): string {
  if (body.length <= maxLength) {
    return body;
  }
  return body.substring(0, maxLength).trim() + '...';
}

// ─── Validation ────────────────────────────────────────────

/**
 * Validate thread creation input
 */
export function validateThreadInput(
  input: CreateThreadInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.category_id || input.category_id.trim() === '') {
    errors.push('Category is required');
  }

  if (!input.title || input.title.trim() === '') {
    errors.push('Title is required');
  } else if (input.title.length < 5) {
    errors.push('Title must be at least 5 characters');
  } else if (input.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (!input.body || input.body.trim() === '') {
    errors.push('Description is required');
  } else if (input.body.length < 10) {
    errors.push('Description must be at least 10 characters');
  } else if (input.body.length > 5000) {
    errors.push('Description must be less than 5000 characters');
  }

  if (input.tags && input.tags.length > 5) {
    errors.push('Maximum 5 tags allowed');
  }

  if (input.tags) {
    for (const tag of input.tags) {
      if (tag.length > 30) {
        errors.push('Each tag must be less than 30 characters');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate reply input
 */
export function validateReplyInput(
  input: CreateReplyInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.thread_id || input.thread_id.trim() === '') {
    errors.push('Thread ID is required');
  }

  if (!input.body || input.body.trim() === '') {
    errors.push('Reply text is required');
  } else if (input.body.length < 3) {
    errors.push('Reply must be at least 3 characters');
  } else if (input.body.length > 3000) {
    errors.push('Reply must be less than 3000 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ─── Thread Sorting ────────────────────────────────────────

/**
 * Sort threads by different criteria
 */
export function sortThreads(
  threads: ForumThread[],
  sortBy: 'recent' | 'popular' | 'unanswered'
): ForumThread[] {
  const sorted = [...threads];

  switch (sortBy) {
    case 'recent':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.last_reply_at || a.created_at).getTime();
        const dateB = new Date(b.last_reply_at || b.created_at).getTime();
        return dateB - dateA;
      });

    case 'popular':
      return sorted.sort((a, b) => {
        // Combine view count, reply count, and like count to determine popularity
        const popularityA = a.view_count * 1 + a.reply_count * 2 + a.like_count * 3;
        const popularityB = b.view_count * 1 + b.reply_count * 2 + b.like_count * 3;
        return popularityB - popularityA;
      });

    case 'unanswered':
      return sorted
        .filter((thread) => thread.reply_count === 0)
        .sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });

    default:
      return sorted;
  }
}
