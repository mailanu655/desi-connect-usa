'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient, Consultancy, ApiResponse } from '@/lib/api-client';

const SPECIALIZATION_LABELS: Record<string, string> = {
  it_staffing: 'IT Staffing',
  h1b_sponsor: 'H-1B Sponsorship',
  opt_cpt: 'OPT/CPT',
  gc_processing: 'Green Card Processing',
  immigration_legal: 'Immigration Legal',
  tax_accounting: 'Tax & Accounting',
  general: 'General',
};

const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'review_count', label: 'Most Reviewed' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'newest', label: 'Newest' },
];

export default function ConsultanciesPage() {
  const [consultancies, setConsultancies] = useState<Consultancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const fetchConsultancies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: ApiResponse<Consultancy[]> = await apiClient.getConsultancies({
        search: searchQuery || undefined,
        specialization: selectedSpecialization || undefined,
        city: selectedCity || undefined,
        state: selectedState || undefined,
        verified_only: verifiedOnly || undefined,
        sort_by: sortBy,
        page: currentPage,
        limit: 12,
      });
      setConsultancies(response.data);
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages);
        setTotalResults(response.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching consultancies:', err);
      setError('Failed to load consultancies. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSpecialization, selectedCity, selectedState, verifiedOnly, sortBy, currentPage]);

  useEffect(() => {
    fetchConsultancies();
  }, [fetchConsultancies]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchConsultancies();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSpecialization('');
    setSelectedCity('');
    setSelectedState('');
    setVerifiedOnly(false);
    setSortBy('rating');
    setCurrentPage(1);
  };

  const renderStars = (rating: number | undefined) => {
    const r = rating || 0;
    return (
      <div className="flex items-center" aria-label={`${r.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= Math.round(r) ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        ))}
        <span className="ml-1 text-sm text-gray-600">{r.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Desi Consultancy Directory</h1>
        <p className="mt-2 text-gray-600">
          Find and review Indian consultancies across the USA. Community-verified ratings and fraud alerts.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              name="search"
              placeholder="Search consultancies by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2"
              aria-label="Search consultancies"
            />
            <button
              type="submit"
              className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700"
            >
              Search
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
              Specialization
            </label>
            <select
              id="specialization"
              value={selectedSpecialization}
              onChange={(e) => { setSelectedSpecialization(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">All Specializations</option>
              {Object.entries(SPECIALIZATION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              id="city"
              type="text"
              placeholder="Filter by city"
              value={selectedCity}
              onChange={(e) => { setSelectedCity(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              id="state"
              type="text"
              placeholder="Filter by state"
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => { setVerifiedOnly(e.target.checked); setCurrentPage(1); }}
              className="rounded"
            />
            Verified only
          </label>

          <button onClick={clearFilters} className="text-sm text-orange-600 hover:underline">
            Clear all filters
          </button>
        </div>
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="text-sm text-gray-500 mb-4">
          {totalResults} consultanc{totalResults === 1 ? 'y' : 'ies'} found
        </p>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-r-transparent" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2 text-gray-500">Loading consultancies...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchConsultancies}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* No results */}
      {!loading && !error && consultancies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No consultancies found matching your criteria.</p>
          <button onClick={clearFilters} className="mt-2 text-orange-600 hover:underline">
            Clear filters
          </button>
        </div>
      )}

      {/* Consultancy Grid */}
      {!loading && !error && consultancies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consultancies.map((consultancy) => (
            <Link
              key={consultancy.consultancy_id}
              href={`/consultancies/${consultancy.consultancy_id}`}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 block"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {consultancy.name}
                </h3>
                {consultancy.is_verified && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    ✓ Verified
                  </span>
                )}
              </div>

              {consultancy.fraud_alert && (
                <div className="mb-3 bg-red-50 border border-red-200 rounded px-3 py-2">
                  <span className="text-red-600 text-sm font-medium">⚠ Fraud Alert</span>
                </div>
              )}

              <p className="text-sm text-gray-500 mb-2">
                {SPECIALIZATION_LABELS[consultancy.specialization] || consultancy.specialization}
              </p>

              {consultancy.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {consultancy.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                {renderStars(consultancy.rating)}
                <span className="text-sm text-gray-400">
                  {consultancy.review_count || 0} review{(consultancy.review_count || 0) !== 1 ? 's' : ''}
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-500">
                {consultancy.city}, {consultancy.state}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
