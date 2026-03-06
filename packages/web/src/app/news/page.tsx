'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NewsArticle, ApiResponse } from '@/lib/api-client';
import { NEWS_CATEGORIES, METRO_AREAS, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import SearchBar from '@/components/ui/SearchBar';
import CategoryFilter from '@/components/ui/CategoryFilter';
import CitySelector from '@/components/ui/CitySelector';
import Pagination from '@/components/ui/Pagination';
import NewsCard from '@/components/cards/NewsCard';

export default function NewsFeedPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');

  const baseUrl = process.env.NEXT_PUBLIC_NOCODEBACKEND_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (city) params.append('city', city);
        params.append('page', page.toString());
        params.append('limit', DEFAULT_PAGE_SIZE.toString());

        const response = await fetch(`${baseUrl}/news?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }

        const data: ApiResponse<NewsArticle[]> = await response.json();
        setArticles(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [search, category, city, page, baseUrl]);

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setPage(1);
  };

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-500 py-16 sm:py-24">
        <div className="container-page">
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            News & Updates
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Stay informed with the latest news from the Indian American community
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b border-gray-200 py-8">
        <div className="container-page">
          <div className="space-y-6">
            {/* Search Bar */}
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search news by keyword or topic..."
            />

            {/* Filters */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Category Filter */}
              <CategoryFilter
                categories={NEWS_CATEGORIES}
                selected={category}
                onSelect={handleCategorySelect}
              />

              {/* City Selector */}
              <CitySelector value={city} onSelect={handleCitySelect} />
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          {/* Results Count */}
          {!loading && (
            <div className="mb-8">
              <p className="text-gray-600">
                {articles.length > 0
                  ? `Found ${articles.length} article${articles.length !== 1 ? 's' : ''}`
                  : 'No articles found'}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="card h-80 animate-pulse bg-gray-100"
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="font-semibold">Error loading articles</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* News Grid */}
          {!loading && articles.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {articles.map((article) => (
                <NewsCard key={article.news_id} article={article} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && articles.length === 0 && !error && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">No articles found</h3>
              <p className="mt-2 text-gray-600">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}

          {/* Pagination */}
          {!loading && articles.length > 0 && totalPages > 1 && (
            <div className="mt-12">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
