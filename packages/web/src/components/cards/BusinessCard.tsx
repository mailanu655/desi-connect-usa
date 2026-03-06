import Link from 'next/link';
import Image from 'next/image';
import { Business } from '@/lib/api-client';

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  // Default placeholder image
  const imageUrl = business.image_url || '/images/placeholder-business.jpg';

  // Generate star rating display
  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => {
            if (i < fullStars) {
              return (
                <svg
                  key={i}
                  className="h-4 w-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              );
            } else if (i === fullStars && hasHalfStar) {
              return (
                <svg
                  key={i}
                  className="h-4 w-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{
                    clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
                  }}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              );
            } else {
              return (
                <svg
                  key={i}
                  className="h-4 w-4 text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              );
            }
          })}
        </div>
        <span className="text-sm text-gray-600">
          {rating.toFixed(1)} ({business.review_count || 0})
        </span>
      </div>
    );
  };

  return (
    <Link href={`/businesses/${business.business_id}`}>
      <div className="card cursor-pointer">
        {/* Image */}
        <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={imageUrl}
            alt={business.name}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Category Badge */}
        <div className="mb-2">
          <span className="badge-saffron text-xs">
            {business.category}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-heading text-lg font-bold text-gray-900 line-clamp-2 hover:text-saffron-600">
          {business.name}
        </h3>

        {/* Rating */}
        {business.rating && (
          <div className="my-3">
            {renderStars(business.rating)}
          </div>
        )}

        {/* Address */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {business.address}
        </p>

        {/* City, State */}
        <p className="mt-2 text-xs text-gray-500">
          {business.city}, {business.state} {business.zip_code}
        </p>

        {/* Phone */}
        {business.phone && (
          <p className="mt-2 text-sm font-medium text-saffron-600">
            {business.phone}
          </p>
        )}
      </div>
    </Link>
  );
}
