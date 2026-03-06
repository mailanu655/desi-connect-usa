'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminBadge from '@/components/admin/AdminBadge';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminPagination from '@/components/admin/AdminPagination';
import type { Column } from '@/components/admin/AdminDataTable';
import type { BadgeVariant } from '@/components/admin/AdminBadge';

interface ContentItem {
  content_id: string;
  content_type: string;
  title: string;
  author_name: string;
  current_status: string;
  created_at: string;
  updated_at: string;
  view_count: number;
}

const STATUS_BADGES: Record<string, BadgeVariant> = {
  published: 'green',
  active: 'green',
  approved: 'green',
  pending: 'yellow',
  draft: 'yellow',
  flagged: 'red',
  rejected: 'red',
  archived: 'gray',
  expired: 'gray',
};

export default function ContentPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (contentTypeFilter) params.set('content_type', contentTypeFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/content?${params}`);
      if (!res.ok) throw new Error('Failed to fetch content');
      const json = await res.json();
      setContent(json.data.items);
      setTotalPages(json.data.total_pages);
    } catch (err) {
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  }, [page, contentTypeFilter, statusFilter]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const columns: Column<ContentItem>[] = [
    { key: 'title', header: 'Title' },
    {
      key: 'content_type',
      header: 'Type',
      render: (item) => (
        <span className="capitalize text-gray-700">{item.content_type.replace(/_/g, ' ')}</span>
      ),
    },
    { key: 'author_name', header: 'Author' },
    {
      key: 'current_status',
      header: 'Status',
      render: (item) => (
        <AdminBadge
          label={item.current_status.replace(/_/g, ' ')}
          variant={STATUS_BADGES[item.current_status] ?? 'gray'}
        />
      ),
    },
    {
      key: 'view_count',
      header: 'Views',
      render: (item) => <span className="text-gray-600">{item.view_count.toLocaleString()}</span>,
    },
    {
      key: 'updated_at',
      header: 'Last Updated',
      render: (item) => <span>{new Date(item.updated_at).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
        <p className="text-gray-500 mt-1">Browse and manage all platform content</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4">
        <select
          value={contentTypeFilter}
          onChange={(e) => { setContentTypeFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
          aria-label="Filter by content type"
        >
          <option value="">All Types</option>
          <option value="business">Business</option>
          <option value="news">News</option>
          <option value="event">Event</option>
          <option value="deal">Deal</option>
          <option value="review">Review</option>
          <option value="forum_thread">Forum Thread</option>
          <option value="forum_reply">Forum Reply</option>
          <option value="consultancy">Consultancy</option>
          <option value="job">Job</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="pending">Pending</option>
          <option value="draft">Draft</option>
          <option value="flagged">Flagged</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Content Table */}
      <AdminDataTable
        columns={columns}
        data={content}
        keyExtractor={(item) => item.content_id}
        loading={loading}
        emptyMessage="No content found matching your criteria."
      />

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
