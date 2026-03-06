export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Metadata } from 'next';
import { apiClient } from '@/lib/api-client';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants';
import SearchBar from '@/components/ui/SearchBar';
import BusinessCard from '@/components/cards/BusinessCard';
import NewsCard from '@/components/cards/NewsCard';
import JobCard from '@/components/cards/JobCard';
import EventCard from '@/components/cards/EventCard';
import DealCard from '@/components/cards/DealCard';

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

async function fetchHomePageData() {
  try {
    const [newsRes, businessesRes, jobsRes, eventsRes, dealsRes] = await Promise.all([
      apiClient.getNews({ limit: 4 }),
      apiClient.getBusinesses({ limit: 6 }),
      apiClient.getJobs({ limit: 6 }),
      apiClient.getEvents({ limit: 4 }),
      apiClient.getDeals({ limit: 4 }),
    ]);

    return {
      news: newsRes.data || [],
      businesses: businessesRes.data || [],
      jobs: jobsRes.data || [],
      events: eventsRes.data || [],
      deals: dealsRes.data || [],
    };
  } catch (error) {
    console.error('Error fetching home page data:', error);
    return {
      news: [],
      businesses: [],
      jobs: [],
      events: [],
      deals: [],
    };
  }
}

export default async function HomePage() {
  const { news, businesses, jobs, events, deals } = await fetchHomePageData();

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-saffron-500 via-orange-400 to-forest-600 py-24 sm:py-32">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-heading text-5xl font-bold text-white sm:text-6xl">
              Welcome to {SITE_NAME}
            </h1>
            <p className="mt-6 text-lg text-white/90">
              The #1 hub for the Indian diaspora in America — community news, business directory, jobs,
              immigration updates, and deals.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/businesses" className="btn-primary">
                Explore Businesses
              </Link>
              <Link href="/jobs" className="btn-secondary">
                Browse Jobs
              </Link>
              <Link href="/immigration" className="btn-secondary">
                Immigration Hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending News Section */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-heading">Trending News</h2>
              <p className="section-subheading">Latest updates from our community</p>
            </div>
            <Link href="/news" className="text-saffron-600 hover:text-saffron-700 font-semibold">
              View All →
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {news.length > 0 ? (
              news.map((article) => (
                <NewsCard key={article.news_id} article={article} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500">
                No news articles available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Businesses Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-heading">Featured Businesses</h2>
              <p className="section-subheading">Discover trusted businesses in your community</p>
            </div>
            <Link href="/businesses" className="text-saffron-600 hover:text-saffron-700 font-semibold">
              View All →
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.length > 0 ? (
              businesses.map((business) => (
                <BusinessCard key={business.business_id} business={business} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500">
                No businesses available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Latest Jobs Section */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-heading">Latest Jobs</h2>
              <p className="section-subheading">Opportunities for skilled professionals</p>
            </div>
            <Link href="/jobs" className="text-saffron-600 hover:text-saffron-700 font-semibold">
              View All →
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <JobCard key={job.job_id} job={job} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500">
                No jobs available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-heading">Upcoming Events</h2>
              <p className="section-subheading">Connect with community members</p>
            </div>
            <Link href="/events" className="text-saffron-600 hover:text-saffron-700 font-semibold">
              View All →
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {events.length > 0 ? (
              events.map((event) => (
                <EventCard key={event.event_id} event={event} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500">
                No events available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Hot Deals Section */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-heading">Hot Deals</h2>
              <p className="section-subheading">Exclusive discounts from our partners</p>
            </div>
            <Link href="/deals" className="text-saffron-600 hover:text-saffron-700 font-semibold">
              View All →
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {deals.length > 0 ? (
              deals.map((deal) => (
                <DealCard key={deal.deal_id} deal={deal} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500">
                No deals available
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
