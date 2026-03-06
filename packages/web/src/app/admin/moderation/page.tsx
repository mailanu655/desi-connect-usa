'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import AdminBadge from '@/components/admin/AdminBadge';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminPagination from '@/components/admin/AdminPagination';
import ModerationActionModal from '@/components/admin/ModerationActionModal';
import StatsCard from '@/components/admin/StatsCard';
import type { Column } from '@/components/admin/AdminDataTable';
import type { BadgeVariant } from '@/components/admin/AdminBadge';
import type { ModerationAction, ModerationReason } from '@desi-connect/shared';

interface ModerationQueueItem {
  content_id: string;
  content_type: string;
  title: string;
  author_name: string;
  status: string;
  priority: string;
  submitted_at: string;
  flagged_at?: string;
}

interface ModerationStats {
  pending_items: number;
  flagged_items: number;
  approved_today: number;
  rejected_today: number;
  avg_review_time_minutes: number;
}

const STATUS_BADGES: Record<string, BadgeVariant> = {
  pending: 'yellow',
  flagged: 'red',
  approved: 'green',
  rejected: 'red',
  under_review: 'blue',
};

export default function ModerationPage() {
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ModerationQueueItem | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (contentTypeFilter) params.set('content_type', contentTypeFilter);

      const res = await fetch(`/api/admin/moderation/queue?${params}`);
      if (!res.ok) throw new Error('Failed to fetch queue');
      const json = await res.json();
      setQueue(json.data.items);
      setTotalPages(json.data.total_pages);
    } catch (err) {
      console.error('Error fetching moderation queue:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, contentTypeFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/moderation/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const json = await res.json();
      setStats(json.data);
    } catch (err) {
      console.error('Error fetching moderation stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    fetchStats();
  }, [fetchQueue, fetchStats]);

  const handleModerationAction = async (
    action: ModerationAction,
    reason?: ModerationReason,
    notes?: string,
  ) => {
    if (!selectedItem) return;
    try {
      await fetch('/api/admin/moderation/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_id: selectedItem.content_id,
          content_type: selectedItem.content_type,
          action,
          reason,
          notes,
        }),
      });
      setModalOpen(false);
      setSelectedItem(null);
      fetchQueue();
      fetchStats();
    } catch (err) {
      console.error('Error performing moderation action:', err);
    }
  };

  const columns: Column<ModerationQueueItem>[] = [
    { key: 'title', header: 'Title' },
    { key: 'content_type', header: 'Type' },
    { key: 'author_name', header: 'Author' },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <AdminBadge label={item.status} variant={STATUS_BADGES[item.status] ?? 'gray'} />
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (item) => (
        <AdminBadge
          label={item.priority}
          variant={item.priority === 'urgent' ? 'red' : item.priority === 'high' ? 'orange' : 'gray'}
        />
      ),
    },
    {
      key: 'submitted_at',
      header: 'Submitted',
      render: (item) => <span>{new Date(item.submitted_at).toLocaleDateString()}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedItem(item);
            setModalOpen(true);
          }}
          className="text-orange-600 hover:text-orange-700 font-medium text-sm"
        >
          Review
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
        <p className="text-gray-500 mt-1">Review, approve, or reject submitted content</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard label="Pending" value={stats?.pending_items ?? 0} variant="warning" />
        <StatsCard label="Flagged" value={stats?.flagged_items ?? 0} variant="danger" />
        <StatsCard label="Approved Today" value={stats?.approved_today ?? 0} variant="success" />
        <StatsCard label="Rejected Today" value={stats?.rejected_today ?? 0} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
          <option value="under_review">Under Review</option>
        </select>
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
      </div>

      {/* Queue Table */}
      <AdminDataTable
        columns={columns}
        data={queue}
        keyExtractor={(item) => item.content_id}
        loading={loading}
        emptyMessage="No items in the moderation queue."
      />

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Moderation Action Modal */}
      <ModerationActionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedItem(null); }}
        onSubmit={handleModerationAction}
        contentId={selectedItem?.content_id ?? ''}
        contentType={selectedItem?.content_type ?? ''}
        availableActions={['approve', 'reject', 'flag', 'request_changes', 'escalate'] as ModerationAction[]}
      />
    </div>
  );
}
