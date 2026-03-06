'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DesiEvent } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { getGoogleCalendarUrlForEvent, downloadIcsFile } from '@/lib/calendar/google-calendar';

const EVENT_CATEGORIES = {
  cultural: 'Cultural',
  professional: 'Professional',
  religious: 'Religious',
  social: 'Social',
  educational: 'Educational',
  sports: 'Sports',
  fundraiser: 'Fundraiser',
  other: 'Other',
};

interface EventDetailPageProps {
  params: {
    id: string;
  };
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const eventId = params.id;
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [event, setEvent] = useState<DesiEvent | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<DesiEvent[]>([]);
  const [hasRsvped, setHasRsvped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rsvpMessage, setRsvpMessage] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_NOCODEBACKEND_URL || 'http://localhost:3001/api';

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${baseUrl}/events/${eventId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch event');
        }

        const data = await response.json();
        setEvent(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, baseUrl]);

  // Check if user has RSVP'd
  useEffect(() => {
    const checkRsvp = async () => {
      if (!isAuthenticated || !user) {
        setHasRsvped(false);
        return;
      }

      try {
        const response = await fetch(`/api/events/${eventId}/rsvp`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setHasRsvped(data.hasRsvped || false);
        }
      } catch (err) {
        console.error('Failed to check RSVP status:', err);
      }
    };

    if (event) {
      checkRsvp();
    }
  }, [eventId, isAuthenticated, user, event]);

  // Fetch related events (same category or city)
  useEffect(() => {
    const fetchRelatedEvents = async () => {
      if (!event) return;

      try {
        const params = new URLSearchParams();
        params.append('category', event.category);
        params.append('limit', '3');

        const response = await fetch(`${baseUrl}/events?${params.toString()}`);

        if (response.ok) {
          const data = await response.json();
          const filtered = (data.data || []).filter((e: DesiEvent) => e.event_id !== eventId);
          setRelatedEvents(filtered.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch related events:', err);
      }
    };

    if (event) {
      fetchRelatedEvents();
    }
  }, [event, eventId, baseUrl]);

  // Handle RSVP
  const handleRsvp = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    try {
      setRsvpLoading(true);
      setRsvpMessage(null);

      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.user_id,
          status: 'going',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to RSVP');
      }

      setHasRsvped(true);
      setRsvpMessage('Successfully RSVP\'d to event!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to RSVP';
      setRsvpMessage(message);
    } finally {
      setRsvpLoading(false);
    }
  };

  // Handle cancel RSVP
  const handleCancelRsvp = async () => {
    try {
      setRsvpLoading(true);
      setRsvpMessage(null);

      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.user_id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel RSVP');
      }

      setHasRsvped(false);
      setRsvpMessage('RSVP cancelled');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel RSVP';
      setRsvpMessage(message);
    } finally {
      setRsvpLoading(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://desiconnectusa.com'}/events/${eventId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          url,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setRsvpMessage('Link copied to clipboard!');
        setTimeout(() => setRsvpMessage(null), 3000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="w-full">
        <section className="min-h-96 bg-gray-100 animate-pulse" />
        <section className="py-16 sm:py-24">
          <div className="container-page">
            <div className="h-12 bg-gray-100 rounded-lg mb-4 w-3/4 animate-pulse" />
            <div className="h-6 bg-gray-100 rounded-lg w-1/2 animate-pulse" />
          </div>
        </section>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="w-full">
        <section className="py-16 sm:py-24">
          <div className="container-page">
            <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
              <h1 className="font-heading text-2xl font-bold text-red-900 mb-2">
                Event Not Found
              </h1>
              <p className="text-red-700 mb-6">{error || 'The event could not be loaded'}</p>
              <Link
                href="/events"
                className="btn-primary inline-block"
              >
                Back to Events
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Hero Section with Image */}
      <section className="relative h-96 bg-gradient-to-br from-saffron-500 to-orange-600 overflow-hidden">
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/30" />

        {/* Back Button */}
        <div className="absolute top-6 left-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 bg-white/90 hover:bg-white px-4 py-2 rounded-lg font-medium text-gray-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Events
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Title and Meta */}
              <div className="mb-8">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="badge bg-saffron-100 text-saffron-800">
                    {EVENT_CATEGORIES[event.category as keyof typeof EVENT_CATEGORIES] || 'Other'}
                  </span>
                  {event.is_virtual && (
                    <span className="badge bg-purple-100 text-purple-800">Virtual</span>
                  )}
                  {event.is_free && (
                    <span className="badge-forest">Free</span>
                  )}
                </div>

                <h1 className="font-heading text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                  {event.title}
                </h1>

                {event.organizer && (
                  <p className="text-lg text-gray-600">
                    Organized by <span className="font-semibold">{event.organizer}</span>
                  </p>
                )}
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
                {/* Date & Time */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-saffron-100">
                      <svg
                        className="h-6 w-6 text-saffron-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Date & Time</p>
                    <p className="font-semibold text-gray-900">{formatDate(event.start_date)}</p>
                    {event.end_date && (
                      <p className="text-sm text-gray-600">
                        Ends: {formatDate(event.end_date)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-saffron-100">
                      <svg
                        className="h-6 w-6 text-saffron-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Location</p>
                    {event.is_virtual ? (
                      <>
                        <p className="font-semibold text-gray-900">Online Event</p>
                        {event.registration_url && (
                          <a
                            href={event.registration_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-saffron-600 hover:text-saffron-700"
                          >
                            Join Video →
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-gray-900">{event.location}</p>
                        <p className="text-sm text-gray-600">
                          {event.city}, {event.state}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">
                  About
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>

              {/* Registration/Ticket Section */}
              {event.registration_url && (
                <div className="mb-8 p-6 bg-saffron-50 border border-saffron-200 rounded-lg">
                  <h3 className="font-heading text-lg font-bold text-gray-900 mb-3">
                    Registration
                  </h3>
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-block"
                  >
                    Get Tickets
                  </a>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* RSVP Card */}
              <div className="card mb-8 sticky top-4">
                <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">
                  Interested?
                </h3>

                <div className="flex flex-col gap-3">
                  {isAuthenticated ? (
                    <>
                      {hasRsvped ? (
                        <>
                          <button
                            onClick={handleCancelRsvp}
                            disabled={rsvpLoading}
                            className="btn-secondary opacity-75 cursor-not-allowed"
                          >
                            {rsvpLoading ? 'Cancelling...' : 'You\'re Going!'}
                          </button>
                          <button
                            onClick={handleCancelRsvp}
                            disabled={rsvpLoading}
                            className="btn-secondary"
                          >
                            {rsvpLoading ? 'Cancelling...' : 'Cancel RSVP'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleRsvp}
                          disabled={rsvpLoading}
                          className="btn-primary"
                        >
                          {rsvpLoading ? 'RSVPing...' : 'RSVP to Event'}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => router.push('/auth/login')}
                      className="btn-primary"
                    >
                      Login to RSVP
                    </button>
                  )}

                  <button
                    onClick={handleShare}
                    className="btn-secondary"
                  >
                    Share Event
                  </button>

                  {/* Calendar Integration */}
                  <a
                    href={getGoogleCalendarUrlForEvent(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center justify-center gap-2"
                    data-testid="google-calendar-btn"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Add to Google Calendar
                  </a>
                  <button
                    onClick={() => downloadIcsFile(event)}
                    className="btn-secondary flex items-center justify-center gap-2"
                    data-testid="download-ics-btn"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download .ics
                  </button>
                </div>

                {rsvpMessage && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">{rsvpMessage}</p>
                  </div>
                )}
              </div>

              {/* Related Events */}
              {relatedEvents.length > 0 && (
                <div>
                  <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">
                    More Events
                  </h3>

                  <div className="space-y-4">
                    {relatedEvents.map((relEvent) => (
                      <Link
                        key={relEvent.event_id}
                        href={`/events/${relEvent.event_id}`}
                        className="card cursor-pointer hover:shadow-lg transition-shadow"
                      >
                        <h4 className="font-heading font-bold text-gray-900 line-clamp-2 mb-2">
                          {relEvent.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {new Date(relEvent.start_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">{relEvent.city}, {relEvent.state}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
