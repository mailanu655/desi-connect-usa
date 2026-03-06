'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeTime, getReputationLevel, validateReplyInput } from '@/lib/forum';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import Pagination from '@/components/ui/Pagination';
import type { ForumThread, ForumReply } from '@desi-connect/shared';

interface ThreadDetailData {
  thread: ForumThread;
  replies: ForumReply[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ThreadDetailPage({
  params,
}: {
  params: { threadId: string };
}) {
  const { threadId } = params;
  const [data, setData] = useState<ThreadDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [liked, setLiked] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_NOCODEBACKEND_URL || 'http://localhost:3001/api';

  // Fetch thread and replies
  useEffect(() => {
    const fetchThreadData = async () => {
      try {
        setLoading(true);

        // Fetch thread
        const threadResponse = await fetch(
          `${baseUrl}/forum/${threadId}`
        );

        if (threadResponse.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (!threadResponse.ok) {
          throw new Error('Failed to fetch thread');
        }

        const threadData = await threadResponse.json();

        // Fetch replies with pagination
        const repliesParams = new URLSearchParams();
        repliesParams.append('page', page.toString());
        repliesParams.append('limit', DEFAULT_PAGE_SIZE.toString());

        const repliesResponse = await fetch(
          `${baseUrl}/forum/${threadId}/replies?${repliesParams.toString()}`
        );

        if (!repliesResponse.ok) {
          throw new Error('Failed to fetch replies');
        }

        const repliesData = await repliesResponse.json();

        setData({
          thread: threadData,
          replies: repliesData.data || [],
          pagination: repliesData.pagination,
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchThreadData();
  }, [threadId, page, baseUrl]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    // Validate reply
    const validation = validateReplyInput({
      thread_id: threadId,
      body: replyText,
    });

    if (!validation.valid) {
      setReplyError(validation.errors[0]);
      return;
    }

    try {
      setSubmittingReply(true);
      setReplyError(null);

      const response = await fetch(`${baseUrl}/forum/${threadId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: replyText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reply');
      }

      const newReply = await response.json();

      // Add reply to the list
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          replies: [...prev.replies, newReply],
          thread: {
            ...prev.thread,
            reply_count: prev.thread.reply_count + 1,
          },
        };
      });

      setReplyText('');
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Failed to submit reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="w-full py-12 sm:py-16">
        <div className="container-page">
          <div className="animate-pulse space-y-6">
            <div className="h-12 w-3/4 rounded-lg bg-gray-100" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-2/3 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="w-full py-12 sm:py-16">
        <div className="container-page">
          <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center" data-testid="thread-not-found">
            <h1 className="text-2xl font-bold text-red-900">Thread Not Found</h1>
            <p className="mt-2 text-red-700">
              The thread you're looking for doesn't exist or has been deleted.
            </p>
            <Link
              href="/forum"
              className="mt-4 inline-block rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
            >
              Back to Forum
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-12 sm:py-16">
        <div className="container-page">
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-12 text-center"
            data-testid="thread-error-state"
          >
            <h1 className="text-2xl font-bold text-red-900">Error Loading Thread</h1>
            <p className="mt-2 text-red-700">{error}</p>
            <Link
              href="/forum"
              className="mt-4 inline-block rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
            >
              Back to Forum
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { thread, replies, pagination } = data;
  const reputationInfo = getReputationLevel(0); // Placeholder

  return (
    <div className="w-full py-8 sm:py-12">
      <div className="container-page">
        {/* Back Link */}
        <Link
          href="/forum"
          className="inline-flex items-center text-saffron-600 hover:text-saffron-700 mb-6"
          data-testid="back-to-forum-link"
        >
          <span className="mr-2">←</span> Back to Forum
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Thread Header */}
            <div className="card p-6 mb-6" data-testid="thread-header">
              {/* Badges */}
              <div className="mb-3 flex flex-wrap gap-2">
                {thread.is_pinned && (
                  <span
                    className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
                    data-testid="pinned-badge"
                  >
                    Pinned
                  </span>
                )}
                {thread.is_locked && (
                  <span
                    className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                    data-testid="locked-badge"
                  >
                    Locked
                  </span>
                )}
                {thread.status === 'archived' && (
                  <span
                    className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                    data-testid="archived-badge"
                  >
                    Archived
                  </span>
                )}
              </div>

              {/* Title */}
              <h1
                className="font-heading text-3xl font-bold text-gray-900 mb-4"
                data-testid="thread-title"
              >
                {thread.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4 border-b border-gray-200 pb-4">
                <div className="flex items-center gap-2">
                  {thread.author_avatar && (
                    <Image
                      src={thread.author_avatar}
                      alt={thread.author_name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span data-testid="thread-author">{thread.author_name}</span>
                </div>
                <span data-testid="thread-created">
                  {formatRelativeTime(thread.created_at)}
                </span>
                <span data-testid="thread-views">{thread.view_count} views</span>
                <span data-testid="thread-replies">{thread.reply_count} replies</span>
              </div>

              {/* Body */}
              <div className="prose prose-sm max-w-none mb-6" data-testid="thread-body">
                <p className="text-gray-700 whitespace-pre-wrap">{thread.body}</p>
              </div>

              {/* Tags */}
              {thread.tags && thread.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {thread.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
                      data-testid={`thread-tag-${tag}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    liked
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  data-testid="thread-like-button"
                >
                  <span>❤️</span>
                  <span className="text-sm font-medium">{thread.like_count + (liked ? 1 : 0)}</span>
                </button>
              </div>
            </div>

            {/* Replies Section */}
            <div className="mb-8" data-testid="replies-section">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">
                Replies ({thread.reply_count})
              </h2>

              {/* Replies List */}
              {replies.length > 0 ? (
                <div className="space-y-4 mb-8" data-testid="replies-list">
                  {replies.map((reply) => (
                    <div
                      key={reply.reply_id}
                      className="card p-6"
                      data-testid={`reply-${reply.reply_id}`}
                    >
                      {/* Reply Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {reply.author_avatar && (
                            <Image
                              src={reply.author_avatar}
                              alt={reply.author_name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          )}
                          <div>
                            <p
                              className="font-semibold text-gray-900"
                              data-testid={`reply-author-${reply.reply_id}`}
                            >
                              {reply.author_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatRelativeTime(reply.created_at)}
                            </p>
                          </div>
                        </div>
                        {reply.is_solution && (
                          <span
                            className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                            data-testid={`solution-badge-${reply.reply_id}`}
                          >
                            Solution
                          </span>
                        )}
                      </div>

                      {/* Reply Body */}
                      <p
                        className="text-gray-700 whitespace-pre-wrap mb-4"
                        data-testid={`reply-body-${reply.reply_id}`}
                      >
                        {reply.body}
                      </p>

                      {/* Reply Actions */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <button
                          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                          data-testid={`reply-like-${reply.reply_id}`}
                        >
                          <span>❤️</span>
                          <span>{reply.like_count}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center mb-8">
                  <p className="text-gray-600">No replies yet. Be the first to reply!</p>
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mb-8">
                  <Pagination
                    page={page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>

            {/* Reply Form */}
            {!thread.is_locked && (
              <div className="card p-6" data-testid="reply-form-section">
                <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">
                  Write a Reply
                </h3>

                {replyError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                    <p className="text-sm">{replyError}</p>
                  </div>
                )}

                <form onSubmit={handleReplySubmit}>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={6}
                    className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-saffron-500 focus:ring-saffron-500"
                    data-testid="reply-textarea"
                  />

                  <button
                    type="submit"
                    disabled={submittingReply || !replyText.trim()}
                    className="rounded-lg bg-saffron-600 px-6 py-3 font-semibold text-white hover:bg-saffron-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    data-testid="reply-submit-button"
                  >
                    {submittingReply ? 'Submitting...' : 'Post Reply'}
                  </button>
                </form>
              </div>
            )}

            {thread.is_locked && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
                <p className="font-semibold">This thread is locked</p>
                <p className="text-sm">No new replies can be posted to this thread.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Thread Info */}
            <div className="card p-6" data-testid="thread-info-sidebar">
              <h3 className="font-heading font-bold text-gray-900 mb-4">Thread Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Category</p>
                  <p className="font-semibold text-gray-900" data-testid="thread-category">
                    {thread.category_id}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <p
                    className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
                    data-testid="thread-status"
                  >
                    {thread.status}
                  </p>
                </div>
                {thread.city && thread.state && (
                  <div>
                    <p className="text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900" data-testid="thread-location">
                      {thread.city}, {thread.state}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Share */}
            <div className="card p-6">
              <h3 className="font-heading font-bold text-gray-900 mb-4">Share</h3>
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  data-testid="share-twitter"
                >
                  Twitter
                </button>
                <button
                  className="flex-1 rounded-lg bg-blue-900 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-950 transition-colors"
                  data-testid="share-facebook"
                >
                  Facebook
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
