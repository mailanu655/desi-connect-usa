import { generateDealsPageMetadata } from '@/lib/seo/metadata';
import { buildOrganizationJsonLd, buildBreadcrumbJsonLd, jsonLdScriptContent } from '@/lib/seo/json-ld';

export const metadata = generateDealsPageMetadata();

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Deals', path: '/deals' },
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
