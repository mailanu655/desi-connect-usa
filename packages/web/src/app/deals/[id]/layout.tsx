import { Metadata } from 'next';
import { apiClient } from '@/lib/api-client';
import { generateDealMetadata } from '@/lib/seo/metadata';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  jsonLdScriptContent,
  WithContext,
} from '@/lib/seo/json-ld';

interface DealDetailLayoutProps {
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
    const deal = await apiClient.getDealById(params.id);
    return generateDealMetadata({
      title: deal.title,
      businessName: deal.business_name,
      city: deal.city,
      state: deal.state,
      discountType: deal.deal_type,
      discountValue: deal.discount_value ? parseFloat(deal.discount_value) : undefined,
      dealId: deal.deal_id,
    });
  } catch {
    return {
      title: 'Deal Not Found',
    };
  }
}

export default async function DealDetailLayout({
  children,
  params,
}: DealDetailLayoutProps) {
  let jsonLdData: WithContext[] = [];

  try {
    const deal = await apiClient.getDealById(params.id);

    const breadcrumbs = buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Deals', path: '/deals' },
      { name: deal.title, path: `/deals/${deal.deal_id}` },
    ]);
    const org = buildOrganizationJsonLd();
    const offerJsonLd: WithContext = {
      '@context': 'https://schema.org',
      '@type': 'Offer',
      name: deal.title,
      description: deal.description || '',
      url: `${SITE_URL}/deals/${deal.deal_id}`,
      offeredBy: {
        '@type': 'LocalBusiness',
        name: deal.business_name,
        address: {
          '@type': 'PostalAddress',
          addressLocality: deal.city,
          addressRegion: deal.state,
        },
      },
      ...(deal.discount_value && {
        discount: `${deal.discount_value}`,
      }),
      ...(deal.expiry_date && {
        validThrough: deal.expiry_date,
      }),
      ...(deal.image_url && {
        image: deal.image_url,
      }),
      availability: 'https://schema.org/InStock',
    };

    jsonLdData = [org, breadcrumbs, offerJsonLd];
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
