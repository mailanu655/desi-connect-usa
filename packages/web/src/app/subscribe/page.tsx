'use client';

import Link from 'next/link';
import NewsletterSignup from '@/components/newsletter/NewsletterSignup';

export default function SubscribePage() {
  return (
    <div className="w-full">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-orange-600 to-red-500 py-16 sm:py-24">
        <div className="container-page">
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            Subscribe to Our Newsletter
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Stay connected with the Indian American community. Get curated updates on news, immigration, deals, jobs, and events delivered to your inbox.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl">
            {/* Newsletter Form Card */}
            <div className="card p-6 sm:p-8">
              <NewsletterSignup
                variant="card"
                showDigestOptions={true}
                showWhatsAppOptIn={true}
              />
            </div>

            {/* Benefits Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                What You&apos;ll Get
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="card p-5">
                  <div className="text-2xl mb-2">📰</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Community Updates</h3>
                  <p className="text-sm text-gray-600">
                    Local news and highlights from the Indian American community across the USA.
                  </p>
                </div>
                <div className="card p-5">
                  <div className="text-2xl mb-2">🛂</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Immigration Alerts</h3>
                  <p className="text-sm text-gray-600">
                    Visa bulletins, USCIS updates, H-1B news, and policy changes that affect you.
                  </p>
                </div>
                <div className="card p-5">
                  <div className="text-2xl mb-2">🏷️</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Deals &amp; Coupons</h3>
                  <p className="text-sm text-gray-600">
                    Exclusive deals from Indian businesses, restaurants, and services near you.
                  </p>
                </div>
                <div className="card p-5">
                  <div className="text-2xl mb-2">💼</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Job Alerts</h3>
                  <p className="text-sm text-gray-600">
                    New job listings, career opportunities, and networking events.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Note */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                We respect your privacy. Unsubscribe anytime.{' '}
                <Link href="/privacy" className="text-orange-600 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
