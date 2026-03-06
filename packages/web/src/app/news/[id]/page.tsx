import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { apiClient, NewsArticle } from '@/lib/api-client';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { truncateDescription, canonicalUrl } from '@/lib/seo/metadata';
import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  jsonLdScriptContent,
  WithContext,
} from '@/lib/seo/json-ld';

interface NewsDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: NewsDetailPageProps): Promise<Metadata> {
  try {
    const article = await apiClient.getNewsById(params.id);
    const desc = truncateDescription(article.summary || '');
    const url = canonicalUrl(`/news/${article.news_id}`);

    return {
      title: article.title,
      description: desc,
      alternates: { canonical: url },
      openGraph: {
        type: 'article',
        locale: 'en_US',
        url,
        title: article.title,
        description: desc,
        siteName: SITE_NAME,
        publishedTime: article.published_date,
        images: article.image_url
          ? [{ url: article.image_url, width: 1200, height: 630, alt: article.title }]
          : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description: desc,
        ...(article.image_url && { images: [article.image_url] }),
      },
      keywords: [
        article.category,
        'Indian news',
        'desi community news',
        ...(article.tags || []),
      ],
    };
  } catch {
    return {
      title: 'Article Not Found',
    };
  }
}

async function fetchArticle(id: string): Promise<NewsArticle | null> {
  try {
    return await apiClient.getNewsById(id);
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function NewsDetailPage({
  params,
}: NewsDetailPageProps) {
  const article = await fetchArticle(params.id);

  if (!article) {
    notFound();
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/news/${article.news_id}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(article.title);

  // JSON-LD structured data
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'News', path: '/news' },
    { name: article.title, path: `/news/${article.news_id}` },
  ]);
  const org = buildOrganizationJsonLd();
  const newsArticleJsonLd: WithContext = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary || '',
    url: `${SITE_URL}/news/${article.news_id}`,
    datePublished: article.published_date,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/news/${article.news_id}`,
    },
    ...(article.image_url && {
      image: {
        '@type': 'ImageObject',
        url: article.image_url,
      },
    }),
    ...(article.source_name && {
      author: {
        '@type': 'Organization',
        name: article.source_name,
      },
    }),
    ...(article.tags &&
      article.tags.length > 0 && {
        keywords: article.tags.join(', '),
      }),
  };

  return (
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent([org, breadcrumbs, newsArticleJsonLd]) }}
      />
      {/* Back Link */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="container-page py-4">
          <Link
            href="/news"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            ← Back to News
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <section className="bg-gradient-to-r from-blue-50 to-blue-100 py-12 sm:py-16">
        <div className="container-page">
          {/* Category Badge */}
          <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 mb-4">
            {article.category}
          </div>

          <h1 className="font-heading text-4xl font-bold text-gray-900 sm:text-5xl">
            {article.title}
          </h1>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2 text-gray-600">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Source
                </p>
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-blue-600 hover:text-blue-700"
                >
                  {article.source_name} →
                </a>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Published
                </p>
                <p className="text-gray-900">
                  {formatDate(article.published_date)}
                </p>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Share on Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Share on Facebook
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {article.image_url && (
        <section className="py-12 sm:py-16">
          <div className="container-page">
            <div className="overflow-hidden rounded-lg">
              <img
                src={article.image_url}
                alt={article.title}
                className="h-96 w-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Article Content */}
      <section className="py-12 sm:py-16">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            {/* Summary */}
            {article.summary && (
              <div className="mb-8 rounded-lg bg-blue-50 p-6 border-l-4 border-blue-500">
                <p className="text-lg font-semibold text-gray-900">
                  {article.summary}
                </p>
              </div>
            )}

            {/* Full Content */}
            {article.content ? (
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed text-lg">
                  {article.content}
                </p>
              </div>
            ) : (
              <p className="text-gray-600 italic">
                Full content not available. {' '}
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Read the full article on the source →
                </a>
              </p>
            )}

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-12 border-t border-gray-200 pt-8">
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Article Metadata */}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <div className="grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="font-semibold uppercase tracking-wider text-gray-500">
                    Category
                  </p>
                  <p className="mt-2 text-gray-900">{article.category}</p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wider text-gray-500">
                    Views
                  </p>
                  <p className="mt-2 text-gray-900">{article.view_count.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wider text-gray-500">
                    Published
                  </p>
                  <p className="mt-2 text-gray-900">
                    {formatDate(article.published_date)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-50 py-12 sm:py-16">
        <div className="container-page text-center">
          <h2 className="font-heading text-2xl font-bold text-gray-900">
            Want to stay updated?
          </h2>
          <p className="mt-2 text-gray-600">
            Check back regularly for more news and updates from the Indian American community
          </p>
          <Link href="/news" className="btn-primary mt-6">
            Browse More News
          </Link>
        </div>
      </section>
    </div>
  );
}
