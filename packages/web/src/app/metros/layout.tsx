import { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  jsonLdScriptContent,
} from '@/lib/seo/json-ld';

export const metadata: Metadata = {
  title: `Top Indian Communities in the US | ${SITE_NAME}`,
  description:
    'Explore the top 10 Indian diaspora metro areas in the United States. Find businesses, events, temples, restaurants, and community resources.',
  openGraph: {
    title: `Top Indian Communities in the US | ${SITE_NAME}`,
    description:
      'Explore the top 10 Indian diaspora metro areas in the United States.',
    url: `${SITE_URL}/metros`,
    siteName: SITE_NAME,
    type: 'website',
  },
};

export default function MetrosLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Metro Areas', path: '/metros' },
  ]);
  const org = buildOrganizationJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent([org, breadcrumbs]) }}
      />
      {children}
    </>
  );
}
