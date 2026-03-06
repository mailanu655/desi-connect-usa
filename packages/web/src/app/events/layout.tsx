import { generateEventsPageMetadata } from '@/lib/seo/metadata';
import { buildOrganizationJsonLd, buildBreadcrumbJsonLd, jsonLdScriptContent } from '@/lib/seo/json-ld';

export const metadata = generateEventsPageMetadata();

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
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
