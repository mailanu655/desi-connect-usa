import Link from 'next/link';
import Image from 'next/image';
import { NewsArticle } from '@/lib/api-client';
import { NEWS_CATEGORIES } from '@/lib/constants';

interface NewsCardProps {
  article: NewsArticle;
}

export default function NewsCard({ article }: NewsCardProps) {
  // Get category color
  const getCategoryColor = (category: string) => {
    const found = NEWS_CATEGORIES.find((cat) => cat.value === category);
    return found?.color || 'gray';
  };

  const categoryColor = getCategoryColor(article.category);
  const imageUrl = article.image_url || '/images/placeholder-news.jpg';

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get badge color class
  const getBadgeClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      amber: 'bg-amber-100 text-amber-800',
      purple: 'bg-purple-100 text-purple-800',
      pink: 'bg-pink-100 text-pink-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Link href={`/news/${article.news_id}`}>
      <div className="card cursor-pointer">
        {/* Image */}
        <div className="relative mb-4 h-40 w-full overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Category Badge */}
        <div className="mb-3">
          <span className={`badge ${getBadgeClass(categoryColor)} text-xs`}>
            {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-heading text-lg font-bold text-gray-900 line-clamp-2 hover:text-saffron-600">
          {article.title}
        </h3>

        {/* Summary */}
        <p className="mt-2 text-sm text-gray-600 line-clamp-3">
          {article.summary}
        </p>

        {/* Meta information */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
          <div>
            <span className="font-medium">{article.source_name}</span>
          </div>
          <time dateTime={article.published_date}>
            {formatDate(article.published_date)}
          </time>
        </div>

        {/* View count */}
        {article.view_count > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            {article.view_count.toLocaleString()} views
          </p>
        )}
      </div>
    </Link>
  );
}
