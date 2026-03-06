'use client';

import { useState, useEffect, useMemo } from 'react';
import type { SocialMediaPost, ContentCategory, ContentStatus, SocialPlatform } from '@desi-connect/shared';
import { getContentTemplates, getDayTheme, getContentSuggestions } from '@/lib/social-media/content-calendar';
import SocialPostCard from '@/components/cards/SocialPostCard';

const CATEGORIES: ContentCategory[] = [
  'community_spotlight', 'business_feature', 'event_promotion', 'deal_alert',
  'cultural_content', 'food_feature', 'immigration_tips', 'job_highlight',
  'success_story', 'festival_celebration', 'local_news', 'community_poll',
];

const STATUSES: ContentStatus[] = ['draft', 'scheduled', 'published', 'failed'];
const PLATFORMS: SocialPlatform[] = ['instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp', 'youtube'];

export default function ContentCalendarPage() {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  const baseUrl = process.env.NEXT_PUBLIC_NOCODEBACKEND_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        if (platformFilter) params.append('platform', platformFilter);
        if (categoryFilter) params.append('category', categoryFilter);

        const response = await fetch(`${baseUrl}/social/posts?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch posts');

        const data = await response.json();
        setPosts(data.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [statusFilter, platformFilter, categoryFilter, baseUrl]);

  // Content suggestions for today
  const templates = useMemo(() => getContentTemplates(), []);
  const todayTheme = useMemo(() => getDayTheme(new Date().getDay()), []);
  const suggestions = useMemo(() => getContentSuggestions(new Date()), []);

  const resetFilters = () => {
    setStatusFilter('');
    setPlatformFilter('');
    setCategoryFilter('');
  };

  return (
    <div className="w-full">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 py-16 sm:py-24">
        <div className="container-page">
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            Content Calendar
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Plan, schedule, and track your social media content
          </p>
          {todayTheme && (
            <div className="mt-4 inline-block rounded-full bg-white/20 px-4 py-2">
              <span className="text-sm font-medium text-white">
                Today&apos;s theme: {todayTheme.emoji} {todayTheme.theme}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b border-gray-200 py-8">
        <div className="container-page">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                data-testid="status-filter"
              >
                <option value="">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Platform Filter */}
            <div>
              <label htmlFor="platform-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Platform
              </label>
              <select
                id="platform-filter"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                data-testid="platform-filter"
              >
                <option value="">All Platforms</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                data-testid="category-filter"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle + Reset */}
            <div className="flex items-end gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'calendar' : 'grid')}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                data-testid="view-toggle"
              >
                {viewMode === 'grid' ? 'Calendar View' : 'Grid View'}
              </button>
              <button
                onClick={resetFilters}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                data-testid="reset-filters"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Suggestions */}
      {suggestions.length > 0 && (
        <section className="bg-indigo-50 py-6">
          <div className="container-page">
            <h2 className="text-sm font-semibold text-indigo-700 mb-3">
              Content Ideas for Today
            </h2>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <span
                  key={suggestion.template_id}
                  className="inline-block rounded-full bg-white px-3 py-1 text-sm text-indigo-600 shadow-sm"
                >
                  {suggestion.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Results Section */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          {/* Results Count */}
          {!loading && posts.length > 0 && (
            <div className="mb-8">
              <p className="text-gray-600">
                {`${posts.length} post${posts.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card h-64 animate-pulse bg-gray-100" />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="font-semibold">Error loading posts</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Posts Grid */}
          {!loading && posts.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <SocialPostCard key={post.post_id} post={post} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && posts.length === 0 && !error && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">No posts found</h3>
              <p className="mt-2 text-gray-600">
                Try adjusting your filters or create new content
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Templates Section */}
      <section className="bg-gray-50 py-16">
        <div className="container-page">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-8">
            Content Templates
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="templates-grid">
            {templates.map((template) => (
              <div key={template.template_id} className="card">
                <p className="text-xs text-gray-500 uppercase">{template.category.replace(/_/g, ' ')}</p>
                <h3 className="mt-1 font-semibold text-gray-900">{template.name}</h3>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{template.caption_template}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {template.platforms.map((p) => (
                    <span key={p} className="text-xs text-gray-400">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
