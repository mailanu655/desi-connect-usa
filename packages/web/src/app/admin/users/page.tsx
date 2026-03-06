'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import AdminBadge from '@/components/admin/AdminBadge';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminPagination from '@/components/admin/AdminPagination';
import type { Column } from '@/components/admin/AdminDataTable';
import type { BadgeVariant } from '@/components/admin/AdminBadge';

interface UserListItem {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  account_status: string;
  created_at: string;
  last_login_at?: string;
  total_content: number;
}

const STATUS_BADGES: Record<string, BadgeVariant> = {
  active: 'green',
  suspended: 'orange',
  banned: 'red',
  deactivated: 'gray',
  pending_verification: 'yellow',
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (searchQuery) params.set('query', searchQuery);
      if (statusFilter) params.set('account_status', statusFilter);
      if (roleFilter) params.set('role', roleFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const json = await res.json();
      setUsers(json.data.items);
      setTotalPages(json.data.total_pages);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleAction = async (userId: string, action: string) => {
    try {
      await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action }),
      });
      fetchUsers();
    } catch (err) {
      console.error('Error performing user action:', err);
    }
  };

  const columns: Column<UserListItem>[] = [
    { key: 'display_name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    {
      key: 'account_status',
      header: 'Status',
      render: (item) => (
        <AdminBadge
          label={item.account_status.replace(/_/g, ' ')}
          variant={STATUS_BADGES[item.account_status] ?? 'gray'}
        />
      ),
    },
    {
      key: 'total_content',
      header: 'Content',
      render: (item) => <span className="text-gray-600">{item.total_content}</span>,
    },
    {
      key: 'created_at',
      header: 'Joined',
      render: (item) => <span>{new Date(item.created_at).toLocaleDateString()}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex gap-2">
          {item.account_status === 'active' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleAction(item.user_id, 'suspend'); }}
              className="text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              Suspend
            </button>
          )}
          {item.account_status === 'suspended' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleAction(item.user_id, 'activate'); }}
              className="text-green-600 hover:text-green-700 font-medium text-sm"
            >
              Activate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 mt-1">Search, view, and manage platform users</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-end">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
            aria-label="Search users"
          />
          <button
            type="submit"
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700"
          >
            Search
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
          <option value="deactivated">Deactivated</option>
          <option value="pending_verification">Pending Verification</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
          aria-label="Filter by role"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="business_owner">Business Owner</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <AdminDataTable
        columns={columns}
        data={users}
        keyExtractor={(item) => item.user_id}
        loading={loading}
        emptyMessage="No users found matching your criteria."
      />

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
