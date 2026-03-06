'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import CitySelector from '@/components/ui/CitySelector';
import Pagination from '@/components/ui/Pagination';
import GiveawayCard from '@/components/cards/GiveawayCard';
import type { GiveawayCampaign } from '@desi-connect/shared';

type StatusFilter = '' | 'active' | 'ended' | 'upcoming';

export default function GiveawaysPage() {
  const [campaigns, setCampaigns] = useState<GiveawayCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [city, setCity] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  const baseUrl = process.env.NEXT_PUBLIC_NOCODEBACKEND_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const fetchGiveaways = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (city) params.append('city', city);
        if (statusFilter) params.append('status', statusFilter);
        params.append('page', page.toString());
        params.append('limit', DEFAULT_PAGE_SIZE.toString());

        const response = await fetch(`${baseUrl}/giveaways?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch giveaways');
        }

        const data = await response.json();
        setCampaigns(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGiveaways();
  }, [city, statusFilter, page, baseUrl]);

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
      <section className="bg-gradient-to-r from-saffron-500 to-orange-500 py-16 sm:py-24">
        <div className="container-page">
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            Giveaways
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Enter to win amazing prizes from community sponsors
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b border-gray-200 py-8">
        <div className="container-page">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* City Selector */}
            <CitySelector value={city} onSelect={handleCitySelect} />

            {/* Status Filter */}
            <div>
              <label htmlFor="giveaway-status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="giveaway-status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                data-testid="status-filter"
              >
                <option value="">All Giveaways</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          {/* Results Count */}
          {!loading && campaigns.length > 0 && (
            <div className="mb-8">
              <p className="text-gray-600">
                {`Found ${campaigns.length} giveaway${campaigns.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card h-96 animate-pulse bg-gray-100" />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="font-semibold">Error loading giveaways</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Giveaways Grid */}
          {!loading && campaigns.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <GiveawayCard key={campaign.campaign_id} campaign={campaign} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && campaigns.length === 0 && !error && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">No giveaways found</h3>
              <p className="mt-2 text-gray-600">
                Check back soon for new giveaway campaigns!
              </p>
            </div>
          )}

          {/* Pagination */}
          {!loading && campaigns.length > 0 && totalPages > 1 && (
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
