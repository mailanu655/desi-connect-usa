export const dynamic = 'force-dynamic';
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DesiEvent, ApiResponse } from '@/lib/api-client';
import { METRO_AREAS, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import CitySelector from '@/components/ui/CitySelector';
import Pagination from '@/components/ui/Pagination';
import EventCard from '@/components/cards/EventCard';
import { useAuth } from '@/context/AuthContext';

const EVENT_CATEGORIES = [
  { value: 'cultural', label: 'Cultural' },
  { value: 'professional', label: 'Professional' },
  { value: 'religious', label: 'Religious' },
  { value: 'social', label: 'Social' },
  { value: 'educational', label: 'Educational' },
  { value: 'sports', label: 'Sports' },
  { value: 'fundraiser', label: 'Fundraiser' },
  { value: 'other', label: 'Other' },
];

export default function EventsPage() {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<DesiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [virtualOnly, setVirtualOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_NOCODEBACKEND_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (city) params.append('city', city);
        if (category) params.append('category', category);
        params.append('page', page.toString());
        params.append('limit', DEFAULT_PAGE_SIZE.toString());

        const response = await fetch(`${baseUrl}/events?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data: ApiResponse<DesiEvent[]> = await response.json();
        let filteredEvents = data.data || [];

        // Filter for virtual if enabled
        if (virtualOnly) {
          filteredEvents = filteredEvents.filter((event) => event.is_virtual);
        }

        setEvents(filteredEvents);
        setTotalPages(data.pagination?.totalPages || 1);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [city, category, page, virtualOnly, baseUrl]);

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    setPage(1);
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-saffron-500 to-orange-600 py-16 sm:py-24">
        <div className="container-page">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
                Community Events
              </h1>
              <p className="mt-4 text-lg text-white/90">
                Connect with community members at cultural, professional, and social events
              </p>
            </div>
            {isAuthenticated && (
              <Link
                href="/events/submit"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-saffron-600 shadow-sm transition-colors hover:bg-gray-50"
              >
                <span className="mr-2">+</span>
                Submit Event
              </Link>
            )}
          </div>
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

              {/* Category Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Categories</option>
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Toggle Filter */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={virtualOnly}
                  onChange={(e) => {
                    setVirtualOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600"
                />
                <span className="text-gray-700 font-medium">Virtual Events Only</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          {/* Results Count and View Toggle */}
          {!loading && (
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-gray-600">
                  {events.length > 0
                    ? `Found ${events.length} event${events.length !== 1 ? 's' : ''}`
                    : 'No events found'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-saffron-100 text-saffron-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                    <path d="M3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
                  </svg>
                  List
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-saffron-100 text-saffron-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Calendar
                </button>
              </div>
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
              <p className="font-semibold">Error loading events</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Events Grid */}
          {!loading && events.length > 0 && viewMode === 'grid' && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {events.map((event) => (
                <EventCard key={event.event_id} event={event} />
              ))}
            </div>
          )}

          {/* Calendar View */}
          {!loading && events.length > 0 && viewMode === 'calendar' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h3 className="font-heading text-lg font-bold text-gray-900 mb-6">
                  Events by Date
                </h3>

                <div className="space-y-4">
                  {events
                    .reduce(
                      (acc, event) => {
                        const date = new Date(event.start_date).toLocaleDateString();
                        const existing = acc.find((g) => g.date === date);
                        if (existing) {
                          existing.events.push(event);
                        } else {
                          acc.push({ date, events: [event] });
                        }
                        return acc;
                      },
                      [] as Array<{ date: string; events: DesiEvent[] }>,
                    )
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((group) => (
                      <div key={group.date} className="border-l-4 border-saffron-500 pl-4 py-4">
                        <h4 className="font-heading font-semibold text-gray-900 mb-3">
                          {new Date(group.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </h4>

                        <div className="space-y-3">
                          {group.events.map((event) => (
                            <Link
                              key={event.event_id}
                              href={`/events/${event.event_id}`}
                              className="block p-4 rounded-lg bg-gray-50 hover:bg-saffron-50 transition-colors cursor-pointer"
                            >
                              <h5 className="font-heading font-semibold text-gray-900 mb-1">
                                {event.title}
                              </h5>
                              <p className="text-sm text-gray-600 mb-2">{event.location}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(event.start_date).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && events.length === 0 && !error && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">No events found</h3>
              <p className="mt-2 text-gray-600">
                Try adjusting your filters
              </p>
            </div>
          )}

          {/* Pagination */}
          {!loading && events.length > 0 && totalPages > 1 && (
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
