export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { apiClient, Business } from '@/lib/api-client';
import { generateBusinessMetadata } from '@/lib/seo/metadata';
import {
  buildLocalBusinessJsonLd,
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  jsonLdScriptContent,
} from '@/lib/seo/json-ld';

interface BusinessDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: BusinessDetailPageProps): Promise<Metadata> {
  try {
    const business = await apiClient.getBusinessById(params.id);
    return generateBusinessMetadata({
      name: business.name,
      category: business.category,
      city: business.city,
      state: business.state,
      description: business.description,
      businessId: business.business_id,
      image: business.image_url,
    });
  } catch {
    return {
      title: 'Business Not Found',
    };
  }
}

async function fetchBusiness(id: string): Promise<Business | null> {
  try {
    return await apiClient.getBusinessById(id);
  } catch (error) {
    console.error('Error fetching business:', error);
    return null;
  }
}

export default async function BusinessDetailPage({
  params,
}: BusinessDetailPageProps) {
  const business = await fetchBusiness(params.id);

  if (!business) {
    notFound();
  }

  const mapUrl = `https://www.google.com/maps/search/${encodeURIComponent(
    `${business.name} ${business.address}`,
  )}`;

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${business.address} ${business.city} ${business.state}`,
  )}`;

  // JSON-LD structured data
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Businesses', path: '/businesses' },
    { name: business.name, path: `/businesses/${business.business_id}` },
  ]);
  const org = buildOrganizationJsonLd();
  const localBusiness = buildLocalBusinessJsonLd({
    name: business.name,
    category: business.category,
    description: business.description,
    address: {
      street: business.address,
      city: business.city,
      state: business.state,
      zipCode: business.zip_code,
    },
    phone: business.phone,
    website: business.website,
    rating: business.rating,
    reviewCount: business.review_count,
    image: business.image_url,
    businessId: business.business_id,
  });

  return (
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent([org, breadcrumbs, localBusiness]) }}
      />
      {/* Back Link */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="container-page py-4">
          <Link
            href="/businesses"
            className="inline-flex items-center text-saffron-600 hover:text-saffron-700"
          >
            ← Back to Directory
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-saffron-100 to-orange-100 py-12 sm:py-16">
        <div className="container-page">
          {business.image_url ? (
            <div className="mb-8 h-96 overflow-hidden rounded-lg">
              <img
                src={business.image_url}
                alt={business.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="mb-8 h-96 rounded-lg bg-gradient-to-br from-saffron-300 to-orange-300" />
          )}

          <div>
            <div className="inline-block rounded-full bg-saffron-100 px-3 py-1 text-sm font-semibold text-saffron-800 mb-4">
              {business.category}
            </div>
            <h1 className="font-heading text-4xl font-bold text-gray-900 sm:text-5xl">
              {business.name}
            </h1>

            {business.rating && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-2xl font-bold text-yellow-500">★</span>
                <span className="text-lg font-semibold text-gray-700">
                  {business.rating.toFixed(1)}
                </span>
                {business.review_count && (
                  <span className="text-gray-600">
                    ({business.review_count} reviews)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Business Details */}
      <section className="py-12 sm:py-16">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Description */}
              {business.description && (
                <div>
                  <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">
                    About
                  </h2>
                  <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {business.description}
                  </p>
                </div>
              )}

              {/* Hours */}
              {business.hours && (
                <div>
                  <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">
                    Hours
                  </h2>
                  <div className="card bg-gray-50">
                    <p className="whitespace-pre-wrap text-gray-700">
                      {business.hours}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="card">
                <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">
                  Contact & Location
                </h3>

                <div className="space-y-4">
                  {/* Address */}
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                      Address
                    </p>
                    <p className="mt-1 text-gray-900">
                      {business.address}
                    </p>
                    <p className="text-gray-700">
                      {business.city}, {business.state} {business.zip_code}
                    </p>
                    <a
                      href={googleMapsDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-saffron-600 hover:text-saffron-700 font-semibold text-sm"
                    >
                      Get Directions →
                    </a>
                  </div>

                  {/* Phone */}
                  {business.phone && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        Phone
                      </p>
                      <a
                        href={`tel:${business.phone}`}
                        className="mt-1 block text-lg text-saffron-600 hover:text-saffron-700 font-semibold"
                      >
                        {business.phone}
                      </a>
                    </div>
                  )}

                  {/* Email */}
                  {business.email && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        Email
                      </p>
                      <a
                        href={`mailto:${business.email}`}
                        className="mt-1 block text-saffron-600 hover:text-saffron-700 font-semibold break-all"
                      >
                        {business.email}
                      </a>
                    </div>
                  )}

                  {/* Website */}
                  {business.website && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        Website
                      </p>
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-saffron-600 hover:text-saffron-700 font-semibold break-all"
                      >
                        Visit Website →
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Info */}
              <div className="card">
                <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">
                  Business Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-semibold text-gray-900">{business.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-semibold text-gray-900">
                      {business.city}, {business.state}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                      {business.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
