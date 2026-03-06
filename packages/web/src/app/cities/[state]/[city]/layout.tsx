import { Metadata } from 'next';
import { apiClient } from '@/lib/api-client';
import { generateCityMetadata } from '@/lib/seo/metadata';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  jsonLdScriptContent,
  WithContext,
} from '@/lib/seo/json-ld';

interface CityDetailLayoutProps {
  children: React.ReactNode;
  params: {
    state: string;
    city: string;
  };
}

function formatSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: { state: string; city: string };
}): Promise<Metadata> {
  try {
    const cityName = formatSlug(params.city);
    const stateName = formatSlug(params.state);

    // Try to fetch city-specific data for richer metadata
    let businessCount: number | undefined;
    let eventCount: number | undefined;
    try {
      const [businessRes, eventRes] = await Promise.all([
        apiClient.getBusinesses({ city: cityName, state: stateName, limit: 1 }),
        apiClient.getEvents({ city: cityName, limit: 1 }),
      ]);
      businessCount = businessRes.pagination?.total;
      eventCount = eventRes.pagination?.total;
    } catch {
      // Proceed without counts
    }

    return generateCityMetadata({
      city: cityName,
      state: stateName,
      slug: params.city,
      stateSlug: params.state,
      businessCount,
      eventCount,
    });
  } catch {
    return {
      title: 'City Not Found',
    };
  }
}

export default async function CityDetailLayout({
  children,
  params,
}: CityDetailLayoutProps) {
  const cityName = formatSlug(params.city);
  const stateName = formatSlug(params.state);

  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Cities', path: '/cities' },
    { name: `${cityName}, ${stateName}`, path: `/cities/${params.state}/${params.city}` },
  ]);
  const org = buildOrganizationJsonLd();
  const cityJsonLd: WithContext = {
    '@context': 'https://schema.org',
    '@type': 'City',
    name: cityName,
    containedInPlace: {
      '@type': 'State',
      name: stateName,
    },
    url: `${SITE_URL}/cities/${params.state}/${params.city}`,
    description: `Indian American community resources, businesses, events, and services in ${cityName}, ${stateName}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent([org, breadcrumbs, cityJsonLd]) }}
      />
      {children}
    </>
  );
}
