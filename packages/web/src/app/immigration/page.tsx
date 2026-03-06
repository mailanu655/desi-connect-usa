export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { SITE_NAME } from '@/lib/constants';
import NewsCard from '@/components/cards/NewsCard';
import { generateImmigrationMetadata } from '@/lib/seo/metadata';
import {
  buildOrganizationJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  jsonLdScriptContent,
} from '@/lib/seo/json-ld';

export const metadata = generateImmigrationMetadata();

async function fetchImmigrationNews() {
  try {
    const response = await apiClient.getNews({
      category: 'immigration',
      limit: 9,
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching immigration news:', error);
    return [];
  }
}

async function fetchConsultancies() {
  try {
    const response = await apiClient.getConsultancies({
      limit: 6,
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching consultancies:', error);
    return [];
  }
}

export default async function ImmigrationHubPage() {
  const [articles, consultancies] = await Promise.all([
    fetchImmigrationNews(),
    fetchConsultancies(),
  ]);

  const quickLinks = [
    { title: 'H-1B Updates', icon: '💼', color: 'bg-blue-50' },
    { title: 'Green Card News', icon: '🟢', color: 'bg-green-50' },
    { title: 'OPT/CPT Info', icon: '📋', color: 'bg-yellow-50' },
    { title: 'Citizenship Path', icon: '🇺🇸', color: 'bg-red-50' },
  ];

  const resources = [
    {
      title: 'USCIS Official Website',
      description: 'Official immigration services and forms',
      url: 'https://www.uscis.gov',
    },
    {
      title: 'U.S. Department of State - Visa Information',
      description: 'Travel documents and visa information',
      url: 'https://travel.state.gov',
    },
    {
      title: 'AILA (American Immigration Lawyers Association)',
      description: 'Professional association for immigration attorneys',
      url: 'https://www.aila.org',
    },
    {
      title: 'NRI.com Immigration Portal',
      description: 'Resources for Non-Resident Indians',
      url: 'https://www.nri.com',
    },
  ];

  // JSON-LD structured data
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Immigration', path: '/immigration' },
  ]);
  const org = buildOrganizationJsonLd();
  const faq = buildFaqJsonLd([
    { question: 'What is the H-1B visa?', answer: 'The H-1B visa is a non-immigrant visa that allows US companies to employ foreign workers in specialty occupations requiring a bachelor\'s degree or equivalent.' },
    { question: 'How does the EB-2 green card process work?', answer: 'The EB-2 category is for professionals with advanced degrees or exceptional ability. It typically requires PERM labor certification, I-140, and I-485 filing.' },
    { question: 'What is OPT for international students?', answer: 'Optional Practical Training (OPT) allows F-1 students to work in the US for up to 12 months after completing their academic program, with a 24-month STEM extension available.' },
  ]);

  return (
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent([org, breadcrumbs, faq]) }}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 py-24 sm:py-32">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-heading text-5xl font-bold text-white sm:text-6xl">
              Immigration Hub
            </h1>
            <p className="mt-6 text-lg text-white/90">
              Your trusted source for immigration updates, visa information, and legal guidance
            </p>
            <p className="mt-4 text-white/80 text-sm">
              Stay informed about H-1B, Green Cards, OPT/CPT, and the path to citizenship
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          <h2 className="section-heading">Quick Links</h2>
          <p className="section-subheading">Navigate immigration topics</p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <div
                key={link.title}
                className={`${link.color} rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer`}
              >
                <div className="text-4xl mb-3">{link.icon}</div>
                <h3 className="font-semibold text-gray-900">{link.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Immigration News */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-heading">Latest Immigration News</h2>
              <p className="section-subheading">Stay updated on policy changes and announcements</p>
            </div>
            <Link href="/news?category=immigration" className="text-blue-600 hover:text-blue-700 font-semibold">
              View All →
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.length > 0 ? (
              articles.map((article) => (
                <NewsCard key={article.news_id} article={article} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500">
                No immigration news available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Consultancy Directory */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-heading">Immigration Consultants</h2>
              <p className="section-subheading">
                Connect with verified immigration professionals
              </p>
            </div>
            <Link href="/consultancies" className="text-blue-600 hover:text-blue-700 font-semibold">
              View All →
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {consultancies.length > 0 ? (
              consultancies.map((consultancy) => (
                <div key={consultancy.consultancy_id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-gray-900">
                        {consultancy.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {consultancy.specialization}
                      </p>
                    </div>
                    {consultancy.is_verified && (
                      <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        Verified
                      </span>
                    )}
                  </div>

                  {consultancy.fraud_alert && (
                    <div className="mt-4 rounded-lg bg-red-50 p-3 border border-red-200">
                      <p className="text-xs font-semibold text-red-800">
                        ⚠️ Fraud Alert - Please verify independently
                      </p>
                    </div>
                  )}

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-semibold text-gray-900">
                        {consultancy.city}, {consultancy.state}
                      </span>
                    </div>
                    {consultancy.rating && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rating:</span>
                        <span className="font-semibold text-gray-900">
                          ★ {consultancy.rating.toFixed(1)}
                          {consultancy.review_count && (
                            <span className="text-gray-500 ml-1">
                              ({consultancy.review_count})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    {consultancy.email && (
                      <a
                        href={`mailto:${consultancy.email}`}
                        className="flex-1 btn-secondary text-center text-sm py-2"
                      >
                        Email
                      </a>
                    )}
                    {consultancy.phone && (
                      <a
                        href={`tel:${consultancy.phone}`}
                        className="flex-1 btn-secondary text-center text-sm py-2"
                      >
                        Call
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500">
                No consultancies available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="bg-gradient-to-r from-blue-50 to-blue-100 py-16 sm:py-24">
        <div className="container-page">
          <h2 className="section-heading">Helpful Resources</h2>
          <p className="section-subheading">
            Verified links to government and professional immigration resources
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {resources.map((resource) => (
              <a
                key={resource.title}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <h3 className="font-heading font-bold text-gray-900 text-lg">
                  {resource.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {resource.description}
                </p>
                <p className="mt-4 text-blue-600 font-semibold text-sm">
                  Visit Resource →
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16 sm:py-24">
        <div className="container-page text-center">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Need Help with Your Immigration Journey?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Connect with experienced immigration consultants and explore your options
          </p>
          <Link href="/immigration#consultancy" className="btn-primary mt-8">
            Find a Consultant
          </Link>
        </div>
      </section>
    </div>
  );
}
