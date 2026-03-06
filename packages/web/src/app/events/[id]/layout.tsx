import { Metadata } from 'next';
import { apiClient } from '@/lib/api-client';
import { generateEventMetadata } from '@/lib/seo/metadata';
import {
  buildEventJsonLd,
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  jsonLdScriptContent,
  WithContext,
} from '@/lib/seo/json-ld';

interface EventDetailLayoutProps {
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
    const event = await apiClient.getEventById(params.id);
    return generateEventMetadata({
      title: event.title,
      category: event.category,
      city: event.city,
      state: event.state,
      startDate: event.start_date,
      description: event.description,
      eventId: event.event_id,
      image: event.image_url,
    });
  } catch {
    return {
      title: 'Event Not Found',
    };
  }
}

export default async function EventDetailLayout({
  children,
  params,
}: EventDetailLayoutProps) {
  let jsonLdData: WithContext[] = [];

  try {
    const event = await apiClient.getEventById(params.id);

    const breadcrumbs = buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Events', path: '/events' },
      { name: event.title, path: `/events/${event.event_id}` },
    ]);
    const org = buildOrganizationJsonLd();
    const eventJsonLd = buildEventJsonLd({
      title: event.title,
      description: event.description || '',
      startDate: event.start_date,
      endDate: event.end_date,
      city: event.city,
      state: event.state,
      venue: event.venue_name,
      image: event.image_url,
      eventId: event.event_id,
      isOnline: event.is_virtual,
      ticketUrl: event.registration_url,
      price: event.is_free ? 0 : undefined,
    });

    jsonLdData = [org, breadcrumbs, eventJsonLd];
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
