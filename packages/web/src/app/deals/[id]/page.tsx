'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Deal } from '@/lib/api-client';

const DEAL_TYPE_LABELS: Record<string, string> = {
  percentage: 'Percentage Off',
  flat: 'Flat Discount',
  bogo: 'Buy One Get One',
  freebie: 'Free Item',
  bundle: 'Bundle Deal',
  cashback: 'Cashback',
  special: 'Special Offer',
};

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params?.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_NOCODEBACKEND_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (!dealId) return;

    const fetchDeal = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${baseUrl}/deals/${dealId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Deal not found.');
          } else {
            throw new Error('Failed to load deal details.');
          }
          return;
        }

        const data = await response.json();
        setDeal(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [dealId, baseUrl]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  // Format expiry date
  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if expired
  const isExpired = deal ? new Date(deal.expiry_date) < new Date() : false;

  // Days remaining
  const getDaysRemaining = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    if (date < now) return -1;
    return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Loading State
  if (loading) {
    return (
      <div className="w-full">
        <section className="bg-gradient-to-r from-red-500 to-orange-500 py-16 sm:py-24">
          <div className="container-page">
            <div className="h-8 w-48 animate-pulse bg-white/30 rounded" />
            <div className="h-12 w-96 animate-pulse bg-white/30 rounded mt-4" />
          </div>
        </section>
        <section className="py-16">
          <div className="container-page">
            <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />
          </div>
        </section>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="w-full">
        <section className="bg-gradient-to-r from-red-500 to-orange-500 py-16 sm:py-24">
          <div className="container-page">
            <Link href="/deals" className="text-white/80 hover:text-white text-sm">
              ← Back to Deals
            </Link>
            <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl mt-4">
              Deal Not Found
            </h1>
          </div>
        </section>
        <section className="py-16">
          <div className="container-page">
            <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-red-800 font-semibold text-lg">{error}</p>
              <p className="mt-2 text-red-600">The deal you&apos;re looking for may have been removed or doesn&apos;t exist.</p>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Go Back
                </button>
                <Link
                  href="/deals"
                  className="px-4 py-2 text-sm text-white bg-orange-600 rounded-md hover:bg-orange-700"
                >
                  Browse All Deals
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!deal) return null;

  const daysRemaining = getDaysRemaining(deal.expiry_date);
  const dealTypeLabel = DEAL_TYPE_LABELS[deal.deal_type] || deal.deal_type;

  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-gradient-to-r from-red-500 to-orange-500 py-16 sm:py-24">
        <div className="container-page">
          {/* Breadcrumb */}
          <nav className="mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-white/80">
              <li>
                <Link href="/" className="hover:text-white">Home</Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/deals" className="hover:text-white">Deals</Link>
              </li>
              <li>/</li>
              <li className="text-white font-medium">{deal.title}</li>
            </ol>
          </nav>

          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            {deal.title}
          </h1>
          <p className="mt-4 text-lg text-white/90">
            by {deal.business_name}
          </p>

          {/* Status Badge */}
          {isExpired ? (
            <span className="mt-4 inline-block rounded-full bg-red-700 px-4 py-1 text-sm font-semibold text-white">
              Expired
            </span>
          ) : daysRemaining <= 7 ? (
            <span className="mt-4 inline-block rounded-full bg-yellow-500 px-4 py-1 text-sm font-semibold text-white">
              Expiring Soon — {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
            </span>
          ) : (
            <span className="mt-4 inline-block rounded-full bg-green-600 px-4 py-1 text-sm font-semibold text-white">
              Active
            </span>
          )}
        </div>
      </section>

      {/* Deal Content */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Deal Image */}
              {deal.image_url && (
                <div className="relative h-64 sm:h-96 w-full overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={deal.image_url}
                    alt={deal.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 66vw"
                    priority
                  />
                  {isExpired && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <span className="text-2xl font-bold text-white">Expired</span>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">About This Deal</h2>
                <p className="mt-4 text-gray-700 leading-relaxed">
                  {deal.description}
                </p>
              </div>

              {/* Deal Type */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Deal Type</h3>
                <p className="mt-2 text-gray-600">{dealTypeLabel}</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Discount Highlight Card */}
              {deal.discount_value && (
                <div className="rounded-xl bg-gradient-to-br from-saffron-50 to-orange-50 border border-saffron-200 p-6 text-center">
                  <p className="text-sm font-medium text-gray-600 uppercase">Discount</p>
                  <p className="mt-2 text-4xl font-bold text-saffron-700">
                    {deal.discount_value}
                  </p>
                </div>
              )}

              {/* Coupon Code Card */}
              {deal.coupon_code && (
                <div className="rounded-xl border-2 border-dashed border-saffron-300 bg-saffron-50 p-6 text-center">
                  <p className="text-sm font-medium text-gray-600 uppercase">Coupon Code</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-saffron-700">
                    {deal.coupon_code}
                  </p>
                  <button
                    onClick={() => handleCopyCode(deal.coupon_code!)}
                    className="mt-3 w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition"
                    aria-label="Copy coupon code"
                  >
                    {codeCopied ? '✓ Copied!' : 'Copy Code'}
                  </button>
                </div>
              )}

              {/* Details Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Deal Details</h3>

                {/* Location */}
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">{deal.city}, {deal.state}</p>
                </div>

                {/* Expiry */}
                <div>
                  <p className="text-sm text-gray-500">Valid Until</p>
                  <p className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatExpiryDate(deal.expiry_date)}
                  </p>
                  {!isExpired && daysRemaining >= 0 && (
                    <p className={`text-sm ${daysRemaining <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                      {daysRemaining === 0 ? 'Expires today' : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`}
                    </p>
                  )}
                </div>

                {/* Business Link */}
                <div>
                  <p className="text-sm text-gray-500">Offered By</p>
                  <p className="font-medium text-orange-600">{deal.business_name}</p>
                </div>
              </div>

              {/* Back to Deals */}
              <Link
                href="/deals"
                className="block w-full text-center rounded-md bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
              >
                ← Browse All Deals
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
