'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient, CityInfo } from '@/lib/api-client';

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

export default function CitiesPage() {
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchCities() {
      try {
        setLoading(true);
        const data = await apiClient.getAvailableCities();
        setCities(data);
      } catch (err) {
        console.error('Error fetching cities:', err);
        setError('Failed to load cities.');
      } finally {
        setLoading(false);
      }
    }
    fetchCities();
  }, []);

  // Group cities by state
  const citiesByState = cities.reduce<Record<string, CityInfo[]>>((acc, city) => {
    const state = city.state;
    if (!acc[state]) acc[state] = [];
    acc[state].push(city);
    return acc;
  }, {});

  // Filter by search
  const filteredStates = Object.entries(citiesByState)
    .filter(([state, stateCities]) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const stateName = (STATE_NAMES[state] || state).toLowerCase();
      return (
        stateName.includes(q) ||
        state.toLowerCase().includes(q) ||
        stateCities.some((c) => c.city.toLowerCase().includes(q))
      );
    })
    .sort(([a], [b]) => (STATE_NAMES[a] || a).localeCompare(STATE_NAMES[b] || b));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-r-transparent" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-2 text-gray-500">Loading cities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Desi Community by City</h1>
        <p className="mt-2 text-gray-600">
          Explore Indian businesses, events, jobs, and services in your city.
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search by city or state..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md rounded-md border border-gray-300 px-4 py-2"
          aria-label="Search cities"
        />
      </div>

      {filteredStates.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No cities found matching your search.</p>
      ) : (
        <div className="space-y-8">
          {filteredStates.map(([state, stateCities]) => (
            <div key={state}>
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">
                {STATE_NAMES[state] || state}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stateCities
                  .sort((a, b) => a.city.localeCompare(b.city))
                  .map((city) => (
                    <Link
                      key={city.slug}
                      href={`/cities/${city.state.toLowerCase()}/${city.slug}`}
                      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 block"
                    >
                      <h3 className="text-lg font-semibold text-gray-900">{city.city}</h3>
                      <div className="mt-2 flex gap-4 text-sm text-gray-500">
                        <span>{city.business_count} businesses</span>
                        <span>{city.event_count} events</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
