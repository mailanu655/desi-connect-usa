import Link from 'next/link';
import Image from 'next/image';
import { Deal } from '@/lib/api-client';

interface DealCardProps {
  deal: Deal;
}

export default function DealCard({ deal }: DealCardProps) {
  const imageUrl = deal.image_url || '/images/placeholder-deal.jpg';

  // Format expiry date
  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    if (date < now) return 'Expired';

    const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft === 0) return 'Expires today';
    if (daysLeft === 1) return 'Expires tomorrow';
    if (daysLeft <= 7) return `Expires in ${daysLeft} days`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if expired
  const isExpired = new Date(deal.expiry_date) < new Date();
  const expiryText = formatExpiryDate(deal.expiry_date);

  return (
    <Link href={`/deals/${deal.deal_id}`}>
      <div className={`card cursor-pointer ${isExpired ? 'opacity-75' : ''}`}>
        {/* Image */}
        <div className="relative mb-4 h-40 w-full overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={imageUrl}
            alt={deal.title}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {isExpired && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-lg font-bold text-white">Expired</span>
            </div>
          )}
        </div>

        {/* Business Name */}
        <p className="text-xs font-semibold text-gray-500 uppercase">
          {deal.business_name}
        </p>

        {/* Deal Title */}
        <h3 className="mt-2 font-heading text-lg font-bold text-gray-900 line-clamp-2 hover:text-saffron-600">
          {deal.title}
        </h3>

        {/* Deal Description */}
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {deal.description}
        </p>

        {/* Discount Value - Highlight */}
        {deal.discount_value && (
          <div className="mt-3">
            <span className="inline-block rounded-lg bg-saffron-100 px-3 py-1 text-lg font-bold text-saffron-700">
              {deal.discount_value}
            </span>
          </div>
        )}

        {/* Coupon Code */}
        {deal.coupon_code && (
          <div className="mt-3 rounded-lg border-2 border-dashed border-saffron-300 bg-saffron-50 p-2">
            <p className="text-xs text-gray-600">Code:</p>
            <p className="font-mono text-sm font-bold text-saffron-700">
              {deal.coupon_code}
            </p>
          </div>
        )}

        {/* Location */}
        <p className="mt-3 text-xs text-gray-500">
          {deal.city}, {deal.state}
        </p>

        {/* Expiry Date */}
        <p
          className={`mt-2 text-xs font-semibold ${
            isExpired
              ? 'text-red-600'
              : expiryText.includes('today')
                ? 'text-orange-600'
                : 'text-green-600'
          }`}
        >
          {expiryText}
        </p>
      </div>
    </Link>
  );
}
