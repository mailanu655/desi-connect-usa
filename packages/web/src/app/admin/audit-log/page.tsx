'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import AdminBadge from '@/components/admin/AdminBadge';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminPagination from '@/components/admin/AdminPagination';
import ExportButton from '@/components/admin/ExportButton';
import AuditLogDetailModal from '@/components/admin/AuditLogDetailModal';
import type { Column } from '@/components/admin/AdminDataTable';
import type { BadgeVariant } from '@/components/admin/AdminBadge';
import type { AuditLogDetailEntry } from '@/components/admin/AuditLogDetailModal';

interface AuditLogEntry {
  log_id: string;
  admin_name: string;
  action: string;
  resource: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

const ACTION_BADGES: Record<string, BadgeVariant> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  approve: 'green',
  reject: 'red',
  flag: 'orange',
  login: 'gray',
  export: 'yellow',
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Detail modal
  const [detailEntry, setDetailEntry] = useState<AuditLogDetailEntry | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (actionFilter) params.set('action', actionFilter);
      if (resourceFilter) params.set('resource', resourceFilter);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      if (debouncedQuery) params.set('q', debouncedQuery);

      const res = await fetch(`/api/admin/audit-log?${params}`);
      if (!res.ok) throw new Error('Failed to fetch audit log');
      const json = await res.json();
      setEntries(json.data.items);
      setTotalPages(json.data.total_pages);
    } catch (err) {
      console.error('Error fetching audit log:', err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, resourceFilter, startDate, endDate, debouncedQuery]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Export handler — fetches all matching rows (up to 1000)
  const getExportData = useCallback(async (): Promise<string[][]> => {
    try {
      const params = new URLSearchParams({ page: '1', limit: '1000' });
      if (actionFilter) params.set('action', actionFilter);
      if (resourceFilter) params.set('resource', resourceFilter);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      if (debouncedQuery) params.set('q', debouncedQuery);

      const res = await fetch(`/api/admin/audit-log?${params}`);
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data.items as AuditLogEntry[]).map((e) => [
        new Date(e.created_at).toISOString(),
        e.admin_name,
        e.action,
        e.resource,
        e.target_id ?? '',
        e.details ?? '',
        e.ip_address ?? '',
      ]);
    } catch {
      return [];
    }
  }, [actionFilter, resourceFilter, startDate, endDate, debouncedQuery]);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (item) => (
        <span className="text-sm text-gray-600">
          {new Date(item.created_at).toLocaleString()}
        </span>
      ),
    },
    { key: 'admin_name', header: 'Admin' },
    {
      key: 'action',
      header: 'Action',
      render: (item) => (
        <AdminBadge label={item.action} variant={ACTION_BADGES[item.action] ?? 'gray'} />
      ),
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (item) => (
        <span className="capitalize text-gray-700">{item.resource.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'target_id',
      header: 'Target',
      render: (item) => (
        <span className="text-sm text-gray-500 font-mono">{item.target_id ?? '—'}</span>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (item) => (
        <span className="text-sm text-gray-500 truncate max-w-[200px] block">
          {item.details ?? '—'}
        </span>
      ),
    },
    {
      key: 'view',
      header: '',
      render: (item) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDetailEntry(item); }}
          className="text-orange-600 hover:text-orange-700 text-sm font-medium"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-500 mt-1">Track all administrative actions and changes</p>
        </div>
        <ExportButton
          getData={getExportData}
          headers={['Timestamp', 'Admin', 'Action', 'Resource', 'Target ID', 'Details', 'IP Address']}
          filename="audit-log"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by admin, target, details..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
            aria-label="Search audit log"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
          aria-label="Filter by action"
        >
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="approve">Approve</option>
          <option value="reject">Reject</option>
          <option value="flag">Flag</option>
          <option value="login">Login</option>
          <option value="export">Export</option>
        </select>
        <select
          value={resourceFilter}
          onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
          aria-label="Filter by resource"
        >
          <option value="">All Resources</option>
          <option value="users">Users</option>
          <option value="content">Content</option>
          <option value="moderation">Moderation</option>
          <option value="approvals">Approvals</option>
          <option value="settings">Settings</option>
        </select>
        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
            aria-label="Start date"
          />
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
            aria-label="End date"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <AdminDataTable
        columns={columns}
        data={entries}
        keyExtractor={(item) => item.log_id}
        loading={loading}
        emptyMessage="No audit log entries found."
      />

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Detail Modal */}
      <AuditLogDetailModal
        isOpen={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        entry={detailEntry}
      />
    </div>
  );
}
