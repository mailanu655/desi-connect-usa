'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Business, ApiResponse } from '@/lib/api-client';
import { BUSINESS_CATEGORIES, METRO_AREAS, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import SearchBar from '@/components/ui/SearchBar';
import CategoryFilter from '@/components/ui/CategoryFilter';
import CitySelector from '@/components/ui/CitySelector';
import Pagination from '@/components/ui/Pagination';
import BusinessCard from '@/components/cards/BusinessCard';

export default function BusinessDirectoryPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');

  const baseUrl = process.env.NEXT_PUBLIC_NOCODEBACKEND_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (city) params.append('city', city);
        params.append('page', page.toString());
        params.append('limit', DEFAULT_PAGE_SIZE.toString());

        const response = await fetch(`${baseUrl}/businesses?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch businesses');
        }

        const data: ApiResponse<Business[]> = await response.json();
        setBusinesses(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
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
      <section className="bg-gradient-to-r from-saffron-500 to-orange-400 py-16 sm:py-24">
        <div className="container-page">
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            Business Directory
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Discover trusted Indian-owned and Indian-focused businesses in your area
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
              placeholder="Search businesses by name, type, or service..."
            />

            {/* Filters */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Category Filter */}
              <CategoryFilter
                categories={BUSINESS_CATEGORIES}
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
                {businesses.length > 0
                  ? `Showing ${(page - 1) * DEFAULT_PAGE_SIZE + 1}–${Math.min(
                      page * DEFAULT_PAGE_SIZE,
                      (page - 1) * DEFAULT_PAGE_SIZE + businesses.length,
                    )} businesses`
                  : 'No businesses found'}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="card h-64 animate-pulse bg-gray-100"
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="font-semibold">Error loading businesses</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Business Grid */}
          {!loading && businesses.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => (
                <BusinessCard key={business.business_id} business={business} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && businesses.length === 0 && !error && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">No businesses found</h3>
              <p className="mt-2 text-gray-600">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}

          {/* Pagination */}
          {!loading && businesses.length > 0 && totalPages > 1 && (
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
