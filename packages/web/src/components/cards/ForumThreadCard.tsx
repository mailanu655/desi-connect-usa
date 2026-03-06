import Link from 'next/link';
import Image from 'next/image';
import type { ForumThread } from '@desi-connect/shared';
import { formatRelativeTime, truncateBody } from '@/lib/forum';

interface ForumThreadCardProps {
  thread: ForumThread;
}

export default function ForumThreadCard({ thread }: ForumThreadCardProps) {
  return (
    <Link href={`/forum/${thread.thread_id}`}>
      <div
        className="card cursor-pointer transition-shadow hover:shadow-lg p-6"
        data-testid="forum-thread-card"
      >
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Avatar */}
            {thread.author_avatar && (
              <Image
                src={thread.author_avatar}
                alt={thread.author_name}
                width={40}
                height={40}
                className="rounded-full flex-shrink-0"
              />
            )}

            {/* Author & Category */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900" data-testid="thread-card-author">
                {thread.author_name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="inline-block rounded-full bg-saffron-100 px-2 py-0.5 text-xs font-semibold text-saffron-700"
                  data-testid="thread-card-category"
                >
                  {thread.category_id}
                </span>
                {thread.city && thread.state && (
                  <span className="text-xs text-gray-500">
                    {thread.city}, {thread.state}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 ml-4 flex-shrink-0">
            {thread.is_pinned && (
              <span
                className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
                data-testid="thread-card-pinned-badge"
                title="This thread is pinned"
              >
                📌 Pinned
              </span>
            )}
            {thread.reply_count === 0 && (
              <span
                className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700"
                data-testid="thread-card-unanswered-badge"
                title="No replies yet"
              >
                Unanswered
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          className="font-heading text-lg font-bold text-gray-900 hover:text-saffron-600 transition-colors mb-2 line-clamp-2"
          data-testid="thread-card-title"
        >
          {thread.title}
        </h3>

        {/* Body Preview */}
        <p
          className="text-sm text-gray-600 mb-3 line-clamp-2"
          data-testid="thread-card-body-preview"
        >
          {truncateBody(thread.body, 150)}
        </p>

        {/* Tags */}
        {thread.tags && thread.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {thread.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                data-testid={`thread-card-tag-${tag}`}
              >
                {tag}
              </span>
            ))}
            {thread.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{thread.tags.length - 3} more</span>
            )}
          </div>
        )}

        {/* Footer - Stats Row */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-600">
          {/* Left Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1" data-testid="thread-card-replies">
              <span>💬</span>
              <span className="font-semibold text-gray-900">{thread.reply_count}</span>
              <span>replies</span>
            </div>

            <div className="flex items-center gap-1" data-testid="thread-card-views">
              <span>👁️</span>
              <span className="font-semibold text-gray-900">{thread.view_count}</span>
              <span>views</span>
            </div>

            <div className="flex items-center gap-1" data-testid="thread-card-likes">
              <span>❤️</span>
              <span className="font-semibold text-gray-900">{thread.like_count}</span>
            </div>
          </div>

          {/* Right - Time */}
          <span className="font-medium text-gray-900" data-testid="thread-card-time">
            {formatRelativeTime(thread.last_reply_at || thread.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
