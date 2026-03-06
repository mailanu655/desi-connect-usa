import { generateCitiesIndexMetadata } from '@/lib/seo/metadata';
import { buildOrganizationJsonLd, buildBreadcrumbJsonLd, jsonLdScriptContent } from '@/lib/seo/json-ld';

export const metadata = generateCitiesIndexMetadata();

export default function CitiesLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Cities', path: '/cities' },
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
