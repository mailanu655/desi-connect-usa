import { SocialMediaPost } from '@desi-connect/shared';

interface SocialPostCardProps {
  post: SocialMediaPost;
}

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  twitter: 'bg-sky-100 text-sky-700',
  linkedin: 'bg-indigo-100 text-indigo-700',
  whatsapp: 'bg-green-100 text-green-700',
  youtube: 'bg-red-100 text-red-700',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
};

export default function SocialPostCard({ post }: SocialPostCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="card" data-testid="social-post-card">
      {/* Header: Status + Category */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
            statusColors[post.status] || 'bg-gray-100 text-gray-600'
          }`}
          data-testid="post-status"
        >
          {post.status}
        </span>
        <span className="text-xs text-gray-500">{post.category}</span>
      </div>

      {/* Title */}
      <h3 className="font-heading text-lg font-bold text-gray-900 line-clamp-2">
        {post.title}
      </h3>

      {/* Caption Preview */}
      <p className="mt-2 text-sm text-gray-600 line-clamp-3">{post.caption}</p>

      {/* Platforms */}
      <div className="mt-3 flex flex-wrap gap-1" data-testid="post-platforms">
        {post.platforms.map((platform) => (
          <span
            key={platform}
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              platformColors[platform] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {platform}
          </span>
        ))}
      </div>

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {post.hashtags.slice(0, 5).map((tag) => (
            <span key={tag} className="text-xs text-saffron-600">
              #{tag}
            </span>
          ))}
          {post.hashtags.length > 5 && (
            <span className="text-xs text-gray-400">
              +{post.hashtags.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Schedule Date */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-500">
          {post.status === 'published' ? 'Published' : 'Scheduled'}:{' '}
          {formatDate(post.scheduled_date)}
        </span>
        {post.content_format && (
          <span className="text-xs text-gray-400">{post.content_format}</span>
        )}
      </div>

      {/* Engagement (if published) */}
      {post.engagement && (
        <div className="mt-3 grid grid-cols-4 gap-2 border-t border-gray-100 pt-3" data-testid="post-engagement">
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">
              {post.engagement.likes}
            </p>
            <p className="text-xs text-gray-500">Likes</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">
              {post.engagement.comments}
            </p>
            <p className="text-xs text-gray-500">Comments</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">
              {post.engagement.shares}
            </p>
            <p className="text-xs text-gray-500">Shares</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">
              {post.engagement.reach}
            </p>
            <p className="text-xs text-gray-500">Reach</p>
          </div>
        </div>
      )}
    </div>
  );
}
