import { Metadata } from 'next';
import { apiClient } from '@/lib/api-client';
import { generateConsultancyMetadata } from '@/lib/seo/metadata';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  jsonLdScriptContent,
  WithContext,
} from '@/lib/seo/json-ld';

interface ConsultancyDetailLayoutProps {
  children: React.ReactNode;
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const consultancy = await apiClient.getConsultancyById(params.id);
    return generateConsultancyMetadata({
      name: consultancy.name,
      specialization: consultancy.specialization,
      city: consultancy.city,
      state: consultancy.state,
      isVerified: consultancy.is_verified,
      consultancyId: consultancy.consultancy_id,
    });
  } catch {
    return {
      title: 'Consultancy Not Found',
    };
  }
}

export default async function ConsultancyDetailLayout({
  children,
  params,
}: ConsultancyDetailLayoutProps) {
  let jsonLdData: WithContext[] = [];

  try {
    const consultancy = await apiClient.getConsultancyById(params.id);

    const breadcrumbs = buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Consultancies', path: '/consultancies' },
      { name: consultancy.name, path: `/consultancies/${consultancy.consultancy_id}` },
    ]);
    const org = buildOrganizationJsonLd();
    const consultancyJsonLd: WithContext = {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: consultancy.name,
      description: consultancy.description || `${consultancy.specialization} immigration consultancy`,
      url: `${SITE_URL}/consultancies/${consultancy.consultancy_id}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: consultancy.city,
        addressRegion: consultancy.state,
        addressCountry: 'US',
      },
      ...(consultancy.phone && { telephone: consultancy.phone }),
      ...(consultancy.email && { email: consultancy.email }),
      ...(consultancy.website && { sameAs: consultancy.website }),
      ...(consultancy.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: consultancy.rating,
          ...(consultancy.review_count && { reviewCount: consultancy.review_count }),
        },
      }),
      ...(consultancy.specializations && consultancy.specializations.length > 0 && {
        knowsAbout: consultancy.specializations,
      }),
    };

    jsonLdData = [org, breadcrumbs, consultancyJsonLd];
  } catch {
    // If fetch fails, render children without JSON-LD
  }

  return (
    <>
      {jsonLdData.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(jsonLdData) }}
        />
      )}
      {children}
    </>
  );
}
