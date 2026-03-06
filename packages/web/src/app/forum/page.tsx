'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { formatRelativeTime, sortThreads } from '@/lib/forum';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import ForumThreadCard from '@/components/cards/ForumThreadCard';
import type { ForumThread, ForumCategory } from '@desi-connect/shared';

type SortOption = 'recent' | 'popular' | 'unanswered';

export default function ForumPage() {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalThreads: 0,
    totalReplies: 0,
    activeUsers: 0,
    trendingTags: [] as Array<{ tag: string; count: number }>,
  });

  const baseUrl = process.env.NEXT_PUBLIC_NOCODEBACKEND_URL || 'http://localhost:3001/api';

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${baseUrl}/forum/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, [baseUrl]);

  // Fetch threads
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (selectedCategory) params.append('category', selectedCategory);
        if (searchQuery) params.append('search', searchQuery);
        if (sortBy) params.append('sort', sortBy);
        params.append('page', page.toString());
        params.append('limit', DEFAULT_PAGE_SIZE.toString());

        const response = await fetch(`${baseUrl}/forum?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch threads');
        }

        const data = await response.json();
        let fetchedThreads = data.data || [];

        // Sort threads client-side based on selection
        fetchedThreads = sortThreads(fetchedThreads, sortBy);

        setThreads(fetchedThreads);
        setTotalPages(data.pagination?.totalPages || 1);

        // Update stats
        if (data.stats) {
          setStats({
            totalThreads: data.stats.total_threads || 0,
            totalReplies: data.stats.total_replies || 0,
            activeUsers: data.stats.active_today || 0,
            trendingTags: data.stats.trending_tags || [],
          });
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [selectedCategory, searchQuery, sortBy, page, baseUrl]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="w-full">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-saffron-500 to-orange-500 py-16 sm:py-24">
        <div className="container-page">
          <h1
            className="font-heading text-4xl font-bold text-white sm:text-5xl"
            data-testid="forum-page-title"
          >
            Community Forum
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Connect, discuss, and share knowledge with the Desi community
          </p>
          <Link
            href="/forum/new"
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-saffron-600 hover:bg-gray-50 transition-colors"
            data-testid="new-thread-button"
          >
            Start New Thread
          </Link>
        </div>
      </section>

      <div className="py-12 sm:py-16">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Filters Section */}
              <div className="mb-8 space-y-4">
                {/* Search */}
                <div>
                  <label htmlFor="forum-search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search Threads
                  </label>
                  <input
                    id="forum-search"
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Search forum threads..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-saffron-500 focus:ring-saffron-500"
                    data-testid="forum-search-input"
                  />
                </div>

                {/* Sort Options */}
                <div>
                  <label htmlFor="forum-sort" className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    id="forum-sort"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as SortOption);
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                    data-testid="forum-sort-select"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                    <option value="unanswered">Unanswered</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              {!loading && threads.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600" data-testid="results-count">
                    Found {threads.length} thread{threads.length !== 1 ? 's' : ''} in{' '}
                    {selectedCategory ? categories.find(c => c.category_id === selectedCategory)?.name : 'all categories'}
                  </p>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="space-y-4" data-testid="forum-loading-skeleton">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="card h-32 animate-pulse bg-gray-100" />
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
                  data-testid="forum-error-state"
                >
                  <p className="font-semibold">Error loading threads</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Threads List */}
              {!loading && threads.length > 0 && (
                <div className="space-y-4" data-testid="forum-threads-list">
                  {threads.map((thread) => (
                    <ForumThreadCard key={thread.thread_id} thread={thread} />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && threads.length === 0 && !error && (
                <div
                  className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center"
                  data-testid="forum-empty-state"
                >
                  <h3 className="text-lg font-semibold text-gray-900">No threads found</h3>
                  <p className="mt-2 text-gray-600">
                    {searchQuery
                      ? 'Try adjusting your search criteria'
                      : 'Start a new discussion to get the conversation going!'}
                  </p>
                </div>
              )}

              {/* Pagination */}
              {!loading && threads.length > 0 && totalPages > 1 && (
                <div className="mt-12">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Categories */}
              <div className="card p-6" data-testid="forum-categories-section">
                <h2 className="font-heading text-lg font-bold text-gray-900 mb-4">
                  Categories
                </h2>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.category_id}
                      onClick={() => handleCategorySelect(category.category_id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category.category_id
                          ? 'bg-saffron-100 text-saffron-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      data-testid={`category-filter-${category.category_id}`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{category.name}</span>
                        <span className="text-xs font-semibold text-gray-500">
                          {category.post_count}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Forum Stats */}
              <div className="card p-6" data-testid="forum-stats-section">
                <h2 className="font-heading text-lg font-bold text-gray-900 mb-4">
                  Forum Stats
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Total Threads</p>
                    <p className="text-2xl font-bold text-saffron-600" data-testid="stats-threads">
                      {stats.totalThreads}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Replies</p>
                    <p className="text-2xl font-bold text-saffron-600" data-testid="stats-replies">
                      {stats.totalReplies}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Today</p>
                    <p className="text-2xl font-bold text-saffron-600" data-testid="stats-active">
                      {stats.activeUsers}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trending Tags */}
              {stats.trendingTags.length > 0 && (
                <div className="card p-6" data-testid="forum-trending-tags">
                  <h2 className="font-heading text-lg font-bold text-gray-900 mb-4">
                    Trending Tags
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {stats.trendingTags.slice(0, 10).map((tag) => (
                      <span
                        key={tag.tag}
                        className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-saffron-100 hover:text-saffron-600 cursor-pointer transition-colors"
                        data-testid={`trending-tag-${tag.tag}`}
                      >
                        {tag.tag} ({tag.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
