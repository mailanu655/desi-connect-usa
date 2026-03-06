/**
 * SocialPostCard Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import SocialPostCard from '@/components/cards/SocialPostCard';
import type { SocialMediaPost } from '@desi-connect/shared';

function makePost(overrides: Partial<SocialMediaPost> = {}): SocialMediaPost {
  return {
    post_id: 'p1',
    title: 'Test Post Title',
    caption: 'This is a test caption for the post',
    platforms: ['instagram', 'facebook'],
    scheduled_date: '2025-04-15T10:00:00Z',
    status: 'scheduled',
    category: 'food_feature',
    ...overrides,
  } as SocialMediaPost;
}

describe('SocialPostCard', () => {
  it('renders the post title', () => {
    render(<SocialPostCard post={makePost()} />);
    expect(screen.getByText('Test Post Title')).toBeDefined();
  });

  it('renders the caption', () => {
    render(<SocialPostCard post={makePost()} />);
    expect(screen.getByText('This is a test caption for the post')).toBeDefined();
  });

  it('renders the status badge', () => {
    render(<SocialPostCard post={makePost({ status: 'published' })} />);
    const badge = screen.getByTestId('post-status');
    expect(badge.textContent).toBe('published');
  });

  it('renders the category', () => {
    render(<SocialPostCard post={makePost({ category: 'community_spotlight' })} />);
    expect(screen.getByText('community_spotlight')).toBeDefined();
  });

  it('renders platform badges', () => {
    render(<SocialPostCard post={makePost({ platforms: ['instagram', 'twitter'] as any })} />);
    const platformsContainer = screen.getByTestId('post-platforms');
    expect(platformsContainer.textContent).toContain('instagram');
    expect(platformsContainer.textContent).toContain('twitter');
  });

  it('renders hashtags (max 5 shown)', () => {
    const hashtags = ['food', 'desi', 'dallas', 'curry', 'spice', 'biryani', 'extra'];
    render(<SocialPostCard post={makePost({ hashtags } as any)} />);
    expect(screen.getByText('#food')).toBeDefined();
    expect(screen.getByText('#desi')).toBeDefined();
    expect(screen.getByText('+2 more')).toBeDefined();
  });

  it('does not render hashtag section when no hashtags', () => {
    render(<SocialPostCard post={makePost({ hashtags: undefined } as any)} />);
    expect(screen.queryByText(/#\w+/)).toBeNull();
  });

  it('renders formatted schedule date', () => {
    render(<SocialPostCard post={makePost()} />);
    // "Scheduled: " should appear since status is 'scheduled'
    expect(screen.getByText(/Scheduled:/)).toBeDefined();
  });

  it('shows "Published" label for published posts', () => {
    render(<SocialPostCard post={makePost({ status: 'published' })} />);
    expect(screen.getByText(/Published:/)).toBeDefined();
  });

  it('renders engagement metrics when present', () => {
    const engagement = { likes: 150, comments: 30, shares: 20, reach: 5000 };
    render(<SocialPostCard post={makePost({ engagement, status: 'published' } as any)} />);
    const engagementSection = screen.getByTestId('post-engagement');
    expect(engagementSection.textContent).toContain('150');
    expect(engagementSection.textContent).toContain('30');
    expect(engagementSection.textContent).toContain('20');
    expect(engagementSection.textContent).toContain('5000');
  });

  it('does not render engagement section when not present', () => {
    render(<SocialPostCard post={makePost()} />);
    expect(screen.queryByTestId('post-engagement')).toBeNull();
  });

  it('renders content_format when present', () => {
    render(<SocialPostCard post={makePost({ content_format: 'carousel' } as any)} />);
    expect(screen.getByText('carousel')).toBeDefined();
  });

  it('renders the data-testid attribute', () => {
    render(<SocialPostCard post={makePost()} />);
    expect(screen.getByTestId('social-post-card')).toBeDefined();
  });
});
