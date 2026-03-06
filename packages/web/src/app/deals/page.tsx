'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Deal, ApiResponse } from '@/lib/api-client';
import { METRO_AREAS, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import CitySelector from '@/components/ui/CitySelector';
import Pagination from '@/components/ui/Pagination';
import DealCard from '@/components/cards/DealCard';

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [city, setCity] = useState('');
  const [expiringFilter, setExpiringFilter] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_NOCODEBACKEND_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (city) params.append('city', city);
        params.append('page', page.toString());
        params.append('limit', DEFAULT_PAGE_SIZE.toString());

        const response = await fetch(`${baseUrl}/deals?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch deals');
        }

        const data: ApiResponse<Deal[]> = await response.json();
        let filteredDeals = data.data || [];

        // Filter for expiring soon if enabled
        if (expiringFilter) {
          const now = new Date();
          const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          filteredDeals = filteredDeals.filter((deal) => {
            const expiryDate = new Date(deal.expiry_date);
            return expiryDate > now && expiryDate <= thirtyDaysFromNow;
          });
        }

        setDeals(filteredDeals);
        setTotalPages(data.pagination?.totalPages || 1);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, [city, page, expiringFilter, baseUrl]);

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
      <section className="bg-gradient-to-r from-red-500 to-orange-500 py-16 sm:py-24">
        <div className="container-page">
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            Hot Deals
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Exclusive discounts and offers from community partners
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b border-gray-200 py-8">
        <div className="container-page">
          <div className="space-y-6">
            {/* Filters */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* City Selector */}
              <CitySelector value={city} onSelect={handleCitySelect} />
            </div>

            {/* Toggle Filter */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={expiringFilter}
                  onChange={(e) => {
                    setExpiringFilter(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-orange-600"
                />
                <span className="text-gray-700 font-medium">Expiring within 30 days</span>
              </label>
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
                {deals.length > 0
                  ? `Found ${deals.length} deal${deals.length !== 1 ? 's' : ''}`
                  : 'No deals found'}
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
              <p className="font-semibold">Error loading deals</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Deals Grid */}
          {!loading && deals.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {deals.map((deal) => (
                <DealCard key={deal.deal_id} deal={deal} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && deals.length === 0 && !error && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">No deals found</h3>
              <p className="mt-2 text-gray-600">
                Try adjusting your filters
              </p>
            </div>
          )}

          {/* Pagination */}
          {!loading && deals.length > 0 && totalPages > 1 && (
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
