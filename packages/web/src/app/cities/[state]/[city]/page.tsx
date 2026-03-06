'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, CityPageData, Business, DesiEvent, Deal, Consultancy, Job } from '@/lib/api-client';

const STATE_NAMES: Record<string, string> = {
  al: 'Alabama', ak: 'Alaska', az: 'Arizona', ar: 'Arkansas', ca: 'California',
  co: 'Colorado', ct: 'Connecticut', de: 'Delaware', fl: 'Florida', ga: 'Georgia',
  hi: 'Hawaii', id: 'Idaho', il: 'Illinois', in: 'Indiana', ia: 'Iowa',
  ks: 'Kansas', ky: 'Kentucky', la: 'Louisiana', me: 'Maine', md: 'Maryland',
  ma: 'Massachusetts', mi: 'Michigan', mn: 'Minnesota', ms: 'Mississippi', mo: 'Missouri',
  mt: 'Montana', ne: 'Nebraska', nv: 'Nevada', nh: 'New Hampshire', nj: 'New Jersey',
  nm: 'New Mexico', ny: 'New York', nc: 'North Carolina', nd: 'North Dakota', oh: 'Ohio',
  ok: 'Oklahoma', or: 'Oregon', pa: 'Pennsylvania', ri: 'Rhode Island', sc: 'South Carolina',
  sd: 'South Dakota', tn: 'Tennessee', tx: 'Texas', ut: 'Utah', vt: 'Vermont',
  va: 'Virginia', wa: 'Washington', wv: 'West Virginia', wi: 'Wisconsin', wy: 'Wyoming',
  dc: 'District of Columbia',
};

type Section = 'businesses' | 'events' | 'deals' | 'consultancies' | 'jobs';

export default function CityDetailPage() {
  const params = useParams();
  const stateParam = (params?.state as string) || '';
  const cityParam = (params?.city as string) || '';
  const stateName = STATE_NAMES[stateParam.toLowerCase()] || stateParam.toUpperCase();

  const [cityData, setCityData] = useState<CityPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('businesses');

  useEffect(() => {
    async function fetchCityData() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getCityData(stateParam, cityParam);
        setCityData(data);
      } catch (err) {
        console.error('Error fetching city data:', err);
        setError('Failed to load city data.');
      } finally {
        setLoading(false);
      }
    }
    if (stateParam && cityParam) {
      fetchCityData();
    }
  }, [stateParam, cityParam]);

  const renderStars = (rating: number | undefined) => {
    const r = rating || 0;
    return (
      <div className="flex items-center" aria-label={`${r.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= Math.round(r) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
        ))}
        <span className="ml-1 text-sm text-gray-600">{r.toFixed(1)}</span>
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-r-transparent" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-2 text-gray-500">Loading city data...</p>
      </div>
    );
  }

  if (error || !cityData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 text-lg">{error || 'City not found.'}</p>
        <Link href="/cities" className="mt-4 text-orange-600 hover:underline inline-block">
          ← Back to all cities
        </Link>
      </div>
    );
  }

  const sections: { key: Section; label: string; count: number }[] = [
    { key: 'businesses', label: 'Businesses', count: cityData.stats.total_businesses },
    { key: 'events', label: 'Events', count: cityData.stats.total_events },
    { key: 'deals', label: 'Deals', count: cityData.stats.total_deals },
    { key: 'consultancies', label: 'Consultancies', count: cityData.stats.total_consultancies },
    { key: 'jobs', label: 'Jobs', count: cityData.stats.total_jobs },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/cities" className="hover:text-orange-600">Cities</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{cityData.city}, {stateName}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Desi Community in {cityData.city}, {stateName}
        </h1>
        <p className="mt-2 text-gray-600">
          Discover Indian businesses, events, deals, consultancies, and jobs in {cityData.city}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`rounded-lg p-4 text-center transition-colors ${
              activeSection === s.key
                ? 'bg-orange-600 text-white shadow'
                : 'bg-white text-gray-900 shadow hover:bg-orange-50'
            }`}
          >
            <div className="text-2xl font-bold">{s.count}</div>
            <div className={`text-sm ${activeSection === s.key ? 'text-orange-100' : 'text-gray-500'}`}>
              {s.label}
            </div>
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {sections.find((s) => s.key === activeSection)?.label} in {cityData.city}
        </h2>

        {/* Businesses */}
        {activeSection === 'businesses' && (
          cityData.businesses.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No businesses listed yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cityData.businesses.map((biz: Business) => (
                <Link
                  key={biz.business_id}
                  href={`/businesses/${biz.business_id}`}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow block"
                >
                  <h3 className="font-semibold text-gray-900">{biz.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{biz.category}</p>
                  {biz.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{biz.description}</p>
                  )}
                  <div className="mt-2">{renderStars(biz.rating)}</div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Events */}
        {activeSection === 'events' && (
          cityData.events.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No upcoming events.</p>
          ) : (
            <div className="space-y-4">
              {cityData.events.map((event: DesiEvent) => (
                <Link
                  key={event.event_id}
                  href={`/events/${event.event_id}`}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow block"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{event.category}</p>
                    </div>
                    <span className="text-sm text-orange-600 font-medium">
                      {formatDate(event.start_date)}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                  )}
                </Link>
              ))}
            </div>
          )
        )}

        {/* Deals */}
        {activeSection === 'deals' && (
          cityData.deals.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No deals available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cityData.deals.map((deal: Deal) => (
                <Link
                  key={deal.deal_id}
                  href={`/deals/${deal.deal_id}`}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow block"
                >
                  <h3 className="font-semibold text-gray-900">{deal.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{deal.business_name}</p>
                  {deal.discount_value && (
                    <span className="mt-2 inline-block bg-green-100 text-green-800 text-sm px-2 py-0.5 rounded">
                      {deal.discount_type === 'percentage' ? `${deal.discount_value}% off` : `$${deal.discount_value} off`}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )
        )}

        {/* Consultancies */}
        {activeSection === 'consultancies' && (
          cityData.consultancies.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No consultancies listed yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cityData.consultancies.map((c: Consultancy) => (
                <Link
                  key={c.consultancy_id}
                  href={`/consultancies/${c.consultancy_id}`}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow block"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                    {c.is_verified && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{c.specialization}</p>
                  {c.fraud_alert && (
                    <span className="mt-2 inline-block text-xs text-red-600 font-medium">⚠ Fraud Alert</span>
                  )}
                  <div className="mt-2">{renderStars(c.rating)}</div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Jobs */}
        {activeSection === 'jobs' && (
          cityData.jobs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No jobs available.</p>
          ) : (
            <div className="space-y-4">
              {cityData.jobs.map((job: Job) => (
                <Link
                  key={job.job_id}
                  href={`/jobs/${job.job_id}`}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow block"
                >
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{job.company}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{job.employment_type}</span>
                    {job.salary_range && <span>{job.salary_range}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>

      {/* CTA */}
      <div className="mt-8 bg-orange-50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900">Know a Desi business in {cityData.city}?</h3>
        <p className="text-gray-600 mt-1">Help grow the community by listing your business or sharing local resources.</p>
        <div className="mt-4 flex justify-center gap-4">
          <Link href="/businesses" className="text-orange-600 hover:underline text-sm font-medium">
            Browse All Businesses →
          </Link>
          <Link href="/consultancies" className="text-orange-600 hover:underline text-sm font-medium">
            Find Consultancies →
          </Link>
        </div>
      </div>
    </div>
  );
}
