'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getMetroContentBySlug, MetroContent } from '@/lib/metro-content';
import { apiClient, Business, DesiEvent } from '@/lib/api-client';

export default function MetroDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const [metro, setMetro] = useState<MetroContent | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [events, setEvents] = useState<DesiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const content = getMetroContentBySlug(slug);
    if (content) {
      setMetro(content);
      // Fetch featured businesses and events for this metro
      Promise.all([
        apiClient
          .getBusinesses({ city: content.city, state: content.state, limit: 6 })
          .then((res) => res.data || [])
          .catch(() => []),
        apiClient
          .getEvents({ city: content.city, limit: 6 })
          .then((res) => res.data || [])
          .catch(() => []),
      ]).then(([biz, evt]) => {
        setBusinesses(biz);
        setEvents(evt);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-r-transparent"
          role="status"
        >
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-2 text-gray-500">Loading metro data...</p>
      </div>
    );
  }

  if (!metro) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Metro Area Not Found</h1>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t find information for this metro area.
        </p>
        <Link href="/metros" className="text-orange-600 hover:underline">
          ← Browse all metro areas
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/metros" className="hover:text-orange-600">
          Metro Areas
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{metro.city}</span>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-8 mb-10 text-white">
        <div className="max-w-3xl">
          <p className="text-orange-200 text-sm font-medium mb-2">{metro.metroArea}</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Indian Community in {metro.city}
          </h1>
          <p className="text-xl text-orange-100 font-medium mb-4">{metro.headline}</p>
          <p className="text-orange-50 leading-relaxed">{metro.description}</p>
        </div>

        <div className="flex gap-8 mt-8">
          <div>
            <div className="text-3xl font-bold">{metro.indianPopulation}</div>
            <div className="text-orange-200 text-sm">Indian Population</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{metro.population}</div>
            <div className="text-orange-200 text-sm">Metro Population</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Highlights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Community Highlights</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {metro.highlights.map((highlight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                >
                  <span className="text-orange-500 mt-0.5 shrink-0">✦</span>
                  <span className="text-gray-700 text-sm">{highlight}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Neighborhoods */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Neighborhoods</h2>
            <div className="flex flex-wrap gap-3">
              {metro.neighborhoods.map((hood) => (
                <span
                  key={hood}
                  className="bg-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {hood}
                </span>
              ))}
            </div>
          </section>

          {/* Cultural Landmarks */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cultural Landmarks</h2>
            <div className="space-y-3">
              {metro.culturalLandmarks.map((landmark, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                >
                  <span className="text-orange-500 text-lg">🛕</span>
                  <span className="text-gray-700">{landmark}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Featured Businesses */}
          {businesses.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Featured Businesses</h2>
                <Link
                  href={`/businesses?city=${encodeURIComponent(metro.city)}`}
                  className="text-orange-600 hover:underline text-sm font-medium"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {businesses.map((biz) => (
                  <Link
                    key={biz.business_id}
                    href={`/businesses/${biz.business_id}`}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-gray-900">{biz.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{biz.category}</p>
                    {biz.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{biz.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Events */}
          {events.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
                <Link
                  href={`/events?city=${encodeURIComponent(metro.city)}`}
                  className="text-orange-600 hover:underline text-sm font-medium"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {events.map((event) => (
                  <Link
                    key={event.event_id}
                    href={`/events/${event.event_id}`}
                    className="flex items-start gap-4 bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="bg-orange-50 rounded-lg p-3 text-center shrink-0 min-w-[60px]">
                      <div className="text-orange-600 text-xs font-medium">
                        {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-orange-800 text-xl font-bold">
                        {new Date(event.start_date).getDate()}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {event.location || event.city}
                        {event.is_virtual && ' • Virtual'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Cuisines */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Popular Cuisines</h3>
            <div className="space-y-2">
              {metro.topCuisines.map((cuisine) => (
                <div
                  key={cuisine}
                  className="flex items-center gap-2 text-gray-700 text-sm"
                >
                  <span className="text-orange-500">🍛</span>
                  {cuisine}
                </div>
              ))}
            </div>
          </div>

          {/* Community Orgs */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Community Organizations</h3>
            <div className="space-y-2">
              {metro.communityOrgs.map((org) => (
                <div
                  key={org}
                  className="flex items-center gap-2 text-gray-700 text-sm"
                >
                  <span className="text-blue-500">🏢</span>
                  {org}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-orange-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">Explore {metro.city}</h3>
            <div className="space-y-3">
              <Link
                href={`/businesses?city=${encodeURIComponent(metro.city)}`}
                className="block text-orange-700 hover:text-orange-800 text-sm font-medium"
              >
                🏪 Browse Businesses →
              </Link>
              <Link
                href={`/events?city=${encodeURIComponent(metro.city)}`}
                className="block text-orange-700 hover:text-orange-800 text-sm font-medium"
              >
                📅 Find Events →
              </Link>
              <Link
                href={`/jobs?city=${encodeURIComponent(metro.city)}`}
                className="block text-orange-700 hover:text-orange-800 text-sm font-medium"
              >
                💼 Search Jobs →
              </Link>
              <Link
                href={`/deals?city=${encodeURIComponent(metro.city)}`}
                className="block text-orange-700 hover:text-orange-800 text-sm font-medium"
              >
                🏷️ View Deals →
              </Link>
              <Link
                href={`/consultancies?city=${encodeURIComponent(metro.city)}`}
                className="block text-orange-700 hover:text-orange-800 text-sm font-medium"
              >
                📋 Find Consultancies →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
