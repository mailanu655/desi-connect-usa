'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import AdminBadge from '@/components/admin/AdminBadge';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminPagination from '@/components/admin/AdminPagination';
import StatsCard from '@/components/admin/StatsCard';
import ApprovalDecisionModal from '@/components/admin/ApprovalDecisionModal';
import type { Column } from '@/components/admin/AdminDataTable';
import type { BadgeVariant } from '@/components/admin/AdminBadge';

interface ApprovalItem {
  request_id: string;
  content_type: string;
  title: string;
  submitted_by_name: string;
  status: string;
  priority: string;
  submitted_at: string;
  review_deadline?: string;
}

interface ApprovalStats {
  pending_approvals: number;
  approved_today: number;
  rejected_today: number;
  avg_review_time_hours: number;
  overdue_count: number;
}

const STATUS_BADGES: Record<string, BadgeVariant> = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
  changes_requested: 'orange',
  escalated: 'blue',
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');

  // Modal state
  const [modalItem, setModalItem] = useState<ApprovalItem | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (contentTypeFilter) params.set('content_type', contentTypeFilter);

      const res = await fetch(`/api/admin/approvals?${params}`);
      if (!res.ok) throw new Error('Failed to fetch approvals');
      const json = await res.json();
      setApprovals(json.data.items);
      setTotalPages(json.data.total_pages);
    } catch (err) {
      console.error('Error fetching approvals:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, contentTypeFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/approvals/stats');
      if (!res.ok) throw new Error('Failed to fetch approval stats');
      const json = await res.json();
      setStats(json.data);
    } catch (err) {
      console.error('Error fetching approval stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
    fetchStats();
  }, [fetchApprovals, fetchStats]);

  // Clear selection when data changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [approvals]);

  const handleDecision = async (requestId: string, decision: string, notes?: string) => {
    await fetch('/api/admin/approvals/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId, decision, notes }),
    });
    fetchApprovals();
    fetchStats();
  };

  const handleModalDecision = async (decision: string, notes: string) => {
    if (!modalItem) return;
    await handleDecision(modalItem.request_id, decision, notes);
  };

  const handleBulkDecision = async (decision: string) => {
    if (selectedIds.size === 0) return;
    try {
      setBulkProcessing(true);
      await fetch('/api/admin/approvals/bulk-decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_ids: Array.from(selectedIds), decision }),
      });
      setSelectedIds(new Set());
      fetchApprovals();
      fetchStats();
    } catch (err) {
      console.error('Bulk decision failed:', err);
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingIds = approvals.filter((a) => a.status === 'pending').map((a) => a.request_id);
    if (selectedIds.size === pendingIds.length && pendingIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };

  const pendingItems = approvals.filter((a) => a.status === 'pending');
  const allPendingSelected = pendingItems.length > 0 && selectedIds.size === pendingItems.length;

  const columns: Column<ApprovalItem>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allPendingSelected}
          onChange={toggleSelectAll}
          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          aria-label="Select all pending"
        />
      ) as unknown as string,
      render: (item) =>
        item.status === 'pending' ? (
          <input
            type="checkbox"
            checked={selectedIds.has(item.request_id)}
            onChange={() => toggleSelect(item.request_id)}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            aria-label={`Select ${item.title}`}
          />
        ) : null,
    },
    { key: 'title', header: 'Title' },
    {
      key: 'content_type',
      header: 'Type',
      render: (item) => (
        <span className="capitalize text-gray-700">{item.content_type.replace(/_/g, ' ')}</span>
      ),
    },
    { key: 'submitted_by_name', header: 'Submitted By' },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <AdminBadge
          label={item.status.replace(/_/g, ' ')}
          variant={STATUS_BADGES[item.status] ?? 'gray'}
        />
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
      render: (item) =>
        item.status === 'pending' ? (
          <button
            onClick={(e) => { e.stopPropagation(); setModalItem(item); }}
            className="text-orange-600 hover:text-orange-700 font-medium text-sm"
          >
            Review
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Requests</h1>
        <p className="text-gray-500 mt-1">Review and process content approval requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard label="Pending" value={stats?.pending_approvals ?? 0} variant="warning" />
        <StatsCard label="Approved Today" value={stats?.approved_today ?? 0} variant="success" />
        <StatsCard label="Rejected Today" value={stats?.rejected_today ?? 0} variant="danger" />
        <StatsCard label="Overdue" value={stats?.overdue_count ?? 0} variant="danger" />
        <StatsCard label="Avg Review Time" value={`${stats?.avg_review_time_hours ?? 0}h`} />
      </div>

      {/* Filters + Bulk Actions */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-center">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="changes_requested">Changes Requested</option>
          <option value="escalated">Escalated</option>
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
          <option value="consultancy">Consultancy</option>
          <option value="job">Job</option>
        </select>

        {/* Bulk actions — shown when items selected */}
        {selectedIds.size > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-600">{selectedIds.size} selected</span>
            <button
              onClick={() => handleBulkDecision('approve')}
              disabled={bulkProcessing}
              className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Bulk Approve
            </button>
            <button
              onClick={() => handleBulkDecision('reject')}
              disabled={bulkProcessing}
              className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Bulk Reject
            </button>
          </div>
        )}
      </div>

      {/* Approvals Table */}
      <AdminDataTable
        columns={columns}
        data={approvals}
        keyExtractor={(item) => item.request_id}
        loading={loading}
        emptyMessage="No approval requests found."
      />

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Decision Modal */}
      <ApprovalDecisionModal
        isOpen={!!modalItem}
        onClose={() => setModalItem(null)}
        onDecision={handleModalDecision}
        itemTitle={modalItem?.title ?? ''}
        itemType={modalItem?.content_type ?? ''}
        submittedBy={modalItem?.submitted_by_name ?? ''}
      />
    </div>
  );
}
