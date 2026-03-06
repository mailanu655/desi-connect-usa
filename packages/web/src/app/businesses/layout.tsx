import { generateBusinessDirectoryMetadata } from '@/lib/seo/metadata';
import { buildOrganizationJsonLd, buildBreadcrumbJsonLd, jsonLdScriptContent } from '@/lib/seo/json-ld';

export const metadata = generateBusinessDirectoryMetadata();

export default function BusinessesLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Businesses', path: '/businesses' },
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
