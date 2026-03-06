'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Job, ApiResponse } from '@/lib/api-client';
import { JOB_TYPES, METRO_AREAS, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import SearchBar from '@/components/ui/SearchBar';
import CategoryFilter from '@/components/ui/CategoryFilter';
import CitySelector from '@/components/ui/CitySelector';
import Pagination from '@/components/ui/Pagination';
import JobCard from '@/components/cards/JobCard';

export default function JobBoardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState('');
  const [city, setCity] = useState('');
  const [h1bSponsor, setH1bSponsor] = useState(false);
  const [optFriendly, setOptFriendly] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_NOCODEBACKEND_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (search) params.append('search', search);
        if (jobType) params.append('type', jobType);
        if (city) params.append('city', city);
        if (h1bSponsor) params.append('h1b_sponsor', 'true');
        if (optFriendly) params.append('opt_friendly', 'true');
        params.append('page', page.toString());
        params.append('limit', DEFAULT_PAGE_SIZE.toString());

        const response = await fetch(`${baseUrl}/jobs?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }

        const data: ApiResponse<Job[]> = await response.json();
        setJobs(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [search, jobType, city, h1bSponsor, optFriendly, page, baseUrl]);

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handleJobTypeSelect = (selectedType: string) => {
    setJobType(selectedType);
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
      <section className="bg-gradient-to-r from-forest-600 to-forest-500 py-16 sm:py-24">
        <div className="container-page">
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            Job Board
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Find career opportunities with H-1B sponsorship, OPT-friendly roles, and more
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
              placeholder="Search jobs by title, company, or skills..."
            />

            {/* Filters */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Job Type Filter */}
              <CategoryFilter
                categories={JOB_TYPES}
                selected={jobType}
                onSelect={handleJobTypeSelect}
              />

              {/* City Selector */}
              <CitySelector value={city} onSelect={handleCitySelect} />
            </div>

            {/* Toggle Filters */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={h1bSponsor}
                  onChange={(e) => {
                    setH1bSponsor(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-saffron-600"
                />
                <span className="text-gray-700 font-medium">H-1B Sponsor</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={optFriendly}
                  onChange={(e) => {
                    setOptFriendly(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-saffron-600"
                />
                <span className="text-gray-700 font-medium">OPT Friendly</span>
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
                {jobs.length > 0
                  ? `Found ${jobs.length} position${jobs.length !== 1 ? 's' : ''}`
                  : 'No jobs found'}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="card h-32 animate-pulse bg-gray-100"
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="font-semibold">Error loading jobs</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Jobs List */}
          {!loading && jobs.length > 0 && (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard key={job.job_id} job={job} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && jobs.length === 0 && !error && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">No jobs found</h3>
              <p className="mt-2 text-gray-600">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}

          {/* Pagination */}
          {!loading && jobs.length > 0 && totalPages > 1 && (
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
