import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForumThreadCard from '@/components/cards/ForumThreadCard';
import type { ForumThread } from '@desi-connect/shared';

// ────────────────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────────────────

jest.mock('next/link', () => ({ children, ...props }: any) => (
  <a {...props}>{children}</a>
));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock('@/lib/forum', () => ({
  formatRelativeTime: jest.fn(() => '2 hours ago'),
  truncateBody: jest.fn((body: string) => body.substring(0, 150)),
}));

// ────────────────────────────────────────────────────────────
// Helper Function
// ────────────────────────────────────────────────────────────

/**
 * Create a valid ForumThread object with sensible defaults
 */
function makeThread(overrides?: Partial<ForumThread>): ForumThread {
  return {
    thread_id: 'thread-123',
    category_id: 'immigration',
    title: 'How to apply for H1B visa?',
    body: 'This is a detailed question about the H1B visa application process. It contains important information that users need to know.',
    author_id: 'user-456',
    author_name: 'John Doe',
    author_avatar: 'https://example.com/avatar.jpg',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    last_reply_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reply_count: 5,
    view_count: 120,
    like_count: 8,
    is_pinned: false,
    tags: ['visa', 'immigration', 'h1b'],
    city: 'San Francisco',
    state: 'CA',
    ...overrides,
  };
}

describe('ForumThreadCard', () => {
  // ────────────────────────────────────────────────────────────
  // Basic Rendering Tests
  // ────────────────────────────────────────────────────────────

  describe('Basic Rendering', () => {
    it('should render the thread card', () => {
      const thread = makeThread();
      render(<ForumThreadCard thread={thread} />);

      const card = screen.getByTestId('forum-thread-card');
      expect(card).toBeInTheDocument();
    });

    it('should render thread title', () => {
      const thread = makeThread({ title: 'Test Thread Title' });
      render(<ForumThreadCard thread={thread} />);

      const title = screen.getByTestId('thread-card-title');
      expect(title).toHaveTextContent('Test Thread Title');
    });

    it('should render author name', () => {
      const thread = makeThread({ author_name: 'Jane Smith' });
      render(<ForumThreadCard thread={thread} />);

      const author = screen.getByTestId('thread-card-author');
      expect(author).toHaveTextContent('Jane Smith');
    });

    it('should render category', () => {
      const thread = makeThread({ category_id: 'jobs' });
      render(<ForumThreadCard thread={thread} />);

      const category = screen.getByTestId('thread-card-category');
      expect(category).toHaveTextContent('jobs');
    });

    it('should render body preview', () => {
      const thread = makeThread({
        body: 'This is the preview text',
      });
      render(<ForumThreadCard thread={thread} />);

      const bodyPreview = screen.getByTestId('thread-card-body-preview');
      expect(bodyPreview).toBeInTheDocument();
    });

    it('should render location when city and state are present', () => {
      const thread = makeThread({
        city: 'New York',
        state: 'NY',
      });
      render(<ForumThreadCard thread={thread} />);

      expect(screen.getByText('New York, NY')).toBeInTheDocument();
    });

    it('should not render location when city or state is missing', () => {
      const thread = makeThread({
        city: null,
        state: null,
      });
      render(<ForumThreadCard thread={thread} />);

      expect(screen.queryByText(/,/)).not.toBeInTheDocument();
    });

    it('should render avatar image when present', () => {
      const thread = makeThread({
        author_avatar: 'https://example.com/avatar.jpg',
      });
      render(<ForumThreadCard thread={thread} />);

      const avatar = screen.getByAltText(thread.author_name);
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', expect.stringContaining('avatar'));
    });

    it('should not render avatar image when not present', () => {
      const thread = makeThread({
        author_avatar: null,
      });
      render(<ForumThreadCard thread={thread} />);

      expect(screen.queryByAltText(thread.author_name)).not.toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────────────────────────
  // Badge Tests
  // ────────────────────────────────────────────────────────────

  describe('Badges', () => {
    it('should show pinned badge when is_pinned is true', () => {
      const thread = makeThread({ is_pinned: true });
      render(<ForumThreadCard thread={thread} />);

      const pinnedBadge = screen.getByTestId('thread-card-pinned-badge');
      expect(pinnedBadge).toBeInTheDocument();
      expect(pinnedBadge).toHaveTextContent('Pinned');
    });

    it('should not show pinned badge when is_pinned is false', () => {
      const thread = makeThread({ is_pinned: false });
      render(<ForumThreadCard thread={thread} />);

      const pinnedBadge = screen.queryByTestId('thread-card-pinned-badge');
      expect(pinnedBadge).not.toBeInTheDocument();
    });

    it('should show unanswered badge when reply_count is 0', () => {
      const thread = makeThread({ reply_count: 0 });
      render(<ForumThreadCard thread={thread} />);

      const unansweredBadge = screen.getByTestId('thread-card-unanswered-badge');
      expect(unansweredBadge).toBeInTheDocument();
      expect(unansweredBadge).toHaveTextContent('Unanswered');
    });

    it('should not show unanswered badge when reply_count > 0', () => {
      const thread = makeThread({ reply_count: 5 });
      render(<ForumThreadCard thread={thread} />);

      const unansweredBadge = screen.queryByTestId('thread-card-unanswered-badge');
      expect(unansweredBadge).not.toBeInTheDocument();
    });

    it('should show both pinned and unanswered badges when both conditions are met', () => {
      const thread = makeThread({
        is_pinned: true,
        reply_count: 0,
      });
      render(<ForumThreadCard thread={thread} />);

      const pinnedBadge = screen.getByTestId('thread-card-pinned-badge');
      const unansweredBadge = screen.getByTestId('thread-card-unanswered-badge');

      expect(pinnedBadge).toBeInTheDocument();
      expect(unansweredBadge).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────────────────────────
  // Tags Tests
  // ────────────────────────────────────────────────────────────

  describe('Tags', () => {
    it('should render all tags when count is 3 or less', () => {
      const thread = makeThread({
        tags: ['visa', 'immigration', 'h1b'],
      });
      render(<ForumThreadCard thread={thread} />);

      expect(screen.getByTestId('thread-card-tag-visa')).toBeInTheDocument();
      expect(screen.getByTestId('thread-card-tag-immigration')).toBeInTheDocument();
      expect(screen.getByTestId('thread-card-tag-h1b')).toBeInTheDocument();
    });

    it('should render only first 3 tags when count > 3', () => {
      const thread = makeThread({
        tags: ['visa', 'immigration', 'h1b', 'work', 'usa'],
      });
      render(<ForumThreadCard thread={thread} />);

      expect(screen.getByTestId('thread-card-tag-visa')).toBeInTheDocument();
      expect(screen.getByTestId('thread-card-tag-immigration')).toBeInTheDocument();
      expect(screen.getByTestId('thread-card-tag-h1b')).toBeInTheDocument();
      expect(screen.queryByTestId('thread-card-tag-work')).not.toBeInTheDocument();
      expect(screen.queryByTestId('thread-card-tag-usa')).not.toBeInTheDocument();
    });

    it('should show overflow indicator when tags exceed 3', () => {
      const thread = makeThread({
        tags: ['visa', 'immigration', 'h1b', 'work', 'usa'],
      });
      render(<ForumThreadCard thread={thread} />);

      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('should not show overflow indicator when tags are 3 or less', () => {
      const thread = makeThread({
        tags: ['visa', 'immigration'],
      });
      render(<ForumThreadCard thread={thread} />);

      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    });

    it('should not render tags section when tags array is empty', () => {
      const thread = makeThread({
        tags: [],
      });
      render(<ForumThreadCard thread={thread} />);

      expect(screen.queryByTestId('thread-card-tag-visa')).not.toBeInTheDocument();
    });

    it('should not render tags section when tags is undefined', () => {
      const thread = makeThread();
      delete thread.tags;
      render(<ForumThreadCard thread={thread} />);

      expect(screen.queryByTestId(/thread-card-tag-/)).not.toBeInTheDocument();
    });

    it('should handle tags with special characters', () => {
      const thread = makeThread({
        tags: ['c++', 'node.js', 'asp.net'],
      });
      render(<ForumThreadCard thread={thread} />);

      expect(screen.getByTestId('thread-card-tag-c++')).toBeInTheDocument();
      expect(screen.getByTestId('thread-card-tag-node.js')).toBeInTheDocument();
      expect(screen.getByTestId('thread-card-tag-asp.net')).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────────────────────────
  // Stats Tests
  // ────────────────────────────────────────────────────────────

  describe('Stats Display', () => {
    it('should display reply count', () => {
      const thread = makeThread({ reply_count: 7 });
      render(<ForumThreadCard thread={thread} />);

      const repliesStat = screen.getByTestId('thread-card-replies');
      expect(repliesStat).toHaveTextContent('7');
      expect(repliesStat).toHaveTextContent('replies');
    });

    it('should display view count', () => {
      const thread = makeThread({ view_count: 250 });
      render(<ForumThreadCard thread={thread} />);

      const viewsStat = screen.getByTestId('thread-card-views');
      expect(viewsStat).toHaveTextContent('250');
      expect(viewsStat).toHaveTextContent('views');
    });

    it('should display like count', () => {
      const thread = makeThread({ like_count: 15 });
      render(<ForumThreadCard thread={thread} />);

      const likesStat = screen.getByTestId('thread-card-likes');
      expect(likesStat).toHaveTextContent('15');
    });

    it('should handle zero counts', () => {
      const thread = makeThread({
        reply_count: 0,
        view_count: 0,
        like_count: 0,
      });
      render(<ForumThreadCard thread={thread} />);

      const repliesStat = screen.getByTestId('thread-card-replies');
      const viewsStat = screen.getByTestId('thread-card-views');
      const likesStat = screen.getByTestId('thread-card-likes');

      expect(repliesStat).toHaveTextContent('0');
      expect(viewsStat).toHaveTextContent('0');
      expect(likesStat).toHaveTextContent('0');
    });

    it('should handle large counts', () => {
      const thread = makeThread({
        reply_count: 9999,
        view_count: 50000,
        like_count: 1000,
      });
      render(<ForumThreadCard thread={thread} />);

      const repliesStat = screen.getByTestId('thread-card-replies');
      const viewsStat = screen.getByTestId('thread-card-views');
      const likesStat = screen.getByTestId('thread-card-likes');

      expect(repliesStat).toHaveTextContent('9999');
      expect(viewsStat).toHaveTextContent('50000');
      expect(likesStat).toHaveTextContent('1000');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Time Display Tests
  // ────────────────────────────────────────────────────────────

  describe('Time Display', () => {
    it('should display relative time', () => {
      const thread = makeThread({
        last_reply_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      });
      render(<ForumThreadCard thread={thread} />);

      const timeDisplay = screen.getByTestId('thread-card-time');
      expect(timeDisplay).toHaveTextContent('2 hours ago');
    });

    it('should use last_reply_at when available', () => {
      const thread = makeThread({
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        last_reply_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      });
      render(<ForumThreadCard thread={thread} />);

      const timeDisplay = screen.getByTestId('thread-card-time');
      expect(timeDisplay).toHaveTextContent('2 hours ago');
    });

    it('should fall back to created_at when last_reply_at is null', () => {
      const thread = makeThread({
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        last_reply_at: null,
      });
      render(<ForumThreadCard thread={thread} />);

      const timeDisplay = screen.getByTestId('thread-card-time');
      expect(timeDisplay).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────────────────────────
  // Link Tests
  // ────────────────────────────────────────────────────────────

  describe('Links', () => {
    it('should link to correct thread URL', () => {
      const thread = makeThread({ thread_id: 'thread-abc123' });
      render(<ForumThreadCard thread={thread} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/forum/thread-abc123');
    });

    it('should link to thread with different IDs', () => {
      const thread = makeThread({ thread_id: 'xyz789' });
      render(<ForumThreadCard thread={thread} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/forum/xyz789');
    });

    it('should have clickable card area', () => {
      const thread = makeThread();
      render(<ForumThreadCard thread={thread} />);

      const card = screen.getByTestId('forum-thread-card');
      expect(card).toBeInTheDocument();
      expect(card.closest('a')).toBeTruthy();
    });
  });

  // ────────────────────────────────────────────────────────────
  // Integration Tests
  // ────────────────────────────────────────────────────────────

  describe('Integration', () => {
    it('should render complete thread with all elements', () => {
      const thread = makeThread({
        thread_id: 'thread-complete',
        title: 'Complete Thread Example',
        author_name: 'Complete User',
        category_id: 'business',
        body: 'This is a complete forum thread with all fields populated.',
        is_pinned: true,
        reply_count: 3,
        view_count: 85,
        like_count: 4,
        tags: ['startup', 'funding', 'ai'],
        city: 'Boston',
        state: 'MA',
        author_avatar: 'https://example.com/user.jpg',
      });

      render(<ForumThreadCard thread={thread} />);

      expect(screen.getByTestId('forum-thread-card')).toBeInTheDocument();
      expect(screen.getByTestId('thread-card-title')).toHaveTextContent('Complete Thread Example');
      expect(screen.getByTestId('thread-card-author')).toHaveTextContent('Complete User');
      expect(screen.getByTestId('thread-card-category')).toHaveTextContent('business');
      expect(screen.getByTestId('thread-card-pinned-badge')).toBeInTheDocument();
      expect(screen.getByTestId('thread-card-replies')).toHaveTextContent('3');
      expect(screen.getByTestId('thread-card-views')).toHaveTextContent('85');
      expect(screen.getByTestId('thread-card-likes')).toHaveTextContent('4');
      expect(screen.getByTestId('thread-card-tag-startup')).toBeInTheDocument();
      expect(screen.getByText('Boston, MA')).toBeInTheDocument();
    });

    it('should render minimal thread with required fields only', () => {
      const thread = makeThread({
        thread_id: 'thread-minimal',
        title: 'Minimal Thread',
        author_name: 'Minimal User',
        category_id: 'general',
        body: 'Minimal content here.',
        is_pinned: false,
        reply_count: 0,
        view_count: 0,
        like_count: 0,
        tags: [],
        city: null,
        state: null,
        author_avatar: null,
      });

      render(<ForumThreadCard thread={thread} />);

      expect(screen.getByTestId('forum-thread-card')).toBeInTheDocument();
      expect(screen.getByTestId('thread-card-title')).toHaveTextContent('Minimal Thread');
      expect(screen.getByTestId('thread-card-unanswered-badge')).toBeInTheDocument();
      expect(screen.queryByTestId('thread-card-pinned-badge')).not.toBeInTheDocument();
      expect(screen.queryByText(/,/)).not.toBeInTheDocument();
      expect(screen.queryByAltText('Minimal User')).not.toBeInTheDocument();
    });

    it('should maintain proper hierarchy and structure', () => {
      const thread = makeThread({
        title: 'Structured Thread',
        author_name: 'John',
        category_id: 'jobs',
      });

      render(<ForumThreadCard thread={thread} />);

      const card = screen.getByTestId('forum-thread-card');
      const title = screen.getByTestId('thread-card-title');
      const author = screen.getByTestId('thread-card-author');

      expect(card).toContainElement(title);
      expect(card).toContainElement(author);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Helper Tests
  // ────────────────────────────────────────────────────────────

  describe('makeThread Helper', () => {
    it('should create a valid default thread', () => {
      const thread = makeThread();

      expect(thread).toHaveProperty('thread_id');
      expect(thread).toHaveProperty('category_id');
      expect(thread).toHaveProperty('title');
      expect(thread).toHaveProperty('body');
      expect(thread).toHaveProperty('author_id');
      expect(thread).toHaveProperty('author_name');
      expect(thread).toHaveProperty('created_at');
      expect(thread).toHaveProperty('reply_count');
      expect(thread).toHaveProperty('view_count');
      expect(thread).toHaveProperty('like_count');
      expect(thread).toHaveProperty('is_pinned');
      expect(thread).toHaveProperty('tags');
    });

    it('should allow overriding properties', () => {
      const thread = makeThread({
        title: 'Custom Title',
        author_name: 'Custom Author',
        reply_count: 42,
      });

      expect(thread.title).toBe('Custom Title');
      expect(thread.author_name).toBe('Custom Author');
      expect(thread.reply_count).toBe(42);
    });

    it('should not affect original object when creating new thread', () => {
      const thread1 = makeThread();
      const thread2 = makeThread({ title: 'Different Title' });

      expect(thread1.title).not.toBe(thread2.title);
    });
  });
});
