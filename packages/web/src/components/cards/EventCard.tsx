import Link from 'next/link';
import Image from 'next/image';
import { DesiEvent } from '@/lib/api-client';

interface EventCardProps {
  event: DesiEvent;
}

export default function EventCard({ event }: EventCardProps) {
  const imageUrl = event.image_url || '/images/placeholder-event.jpg';

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      year: date.getFullYear(),
      full: date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  };

  const startDate = formatDate(event.start_date);
  const endDate = event.end_date ? formatDate(event.end_date) : null;

  return (
    <Link href={`/events/${event.event_id}`}>
      <div className="card cursor-pointer">
        <div className="flex gap-4">
          {/* Date Calendar */}
          <div className="flex-shrink-0">
            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border-2 border-saffron-500 bg-saffron-50">
              <div className="text-2xl font-bold text-saffron-600">
                {startDate.day}
              </div>
              <div className="text-xs font-semibold text-saffron-600">
                {startDate.month}
              </div>
              {startDate.year !== new Date().getFullYear() && (
                <div className="text-xs text-saffron-500">
                  {startDate.year}
                </div>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="flex-1">
            {/* Title */}
            <h3 className="font-heading text-lg font-bold text-gray-900 line-clamp-2 hover:text-saffron-600">
              {event.title}
            </h3>

            {/* Description */}
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {event.description}
            </p>

            {/* Location */}
            <p className="mt-2 text-sm text-gray-700">
              {event.location}
            </p>

            {/* City, State */}
            <p className="text-xs text-gray-500">
              {event.city}, {event.state}
            </p>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              {/* Virtual/In-person Badge */}
              <span
                className={`badge text-xs ${
                  event.is_virtual
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {event.is_virtual ? 'Virtual' : 'In-Person'}
              </span>

              {/* Free/Paid Badge */}
              <span
                className={`badge text-xs ${
                  event.is_free
                    ? 'badge-forest'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {event.is_free ? 'Free' : 'Paid'}
              </span>

              {/* RSVP Count Badge */}
              {event.rsvp_count != null && event.rsvp_count > 0 && (
                <span className="badge text-xs bg-blue-100 text-blue-800">
                  {event.rsvp_count} {event.rsvp_count === 1 ? 'RSVP' : 'RSVPs'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
