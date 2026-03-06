import { generateConsultancyDirectoryMetadata } from '@/lib/seo/metadata';
import { buildOrganizationJsonLd, buildBreadcrumbJsonLd, jsonLdScriptContent } from '@/lib/seo/json-ld';

export const metadata = generateConsultancyDirectoryMetadata();

export default function ConsultanciesLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Consultancies', path: '/consultancies' },
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
