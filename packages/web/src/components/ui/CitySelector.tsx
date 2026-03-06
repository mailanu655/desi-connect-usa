'use client';

import { METRO_AREAS } from '@/lib/constants';

interface CitySelectorProps {
  value: string;
  onSelect: (citySlug: string) => void;
}

export default function CitySelector({ value, onSelect }: CitySelectorProps) {
  return (
    <div className="relative inline-block w-full">
      <select
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm font-medium text-gray-700 transition-colors focus:border-saffron-500 focus:outline-none focus:ring-1 focus:ring-saffron-500"
      >
        <option value="">All Cities</option>
        {METRO_AREAS.map((area) => (
          <option key={area.slug} value={area.slug}>
            {area.name}, {area.state}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}
