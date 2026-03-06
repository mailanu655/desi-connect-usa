'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import AdminBadge from '@/components/admin/AdminBadge';
import AdminDataTable from '@/components/admin/AdminDataTable';
import type { Column } from '@/components/admin/AdminDataTable';
import type { BadgeVariant } from '@/components/admin/AdminBadge';

interface AdminUser {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

const ROLE_BADGES: Record<string, BadgeVariant> = {
  super_admin: 'red',
  content_moderator: 'blue',
  user_manager: 'orange',
  analyst: 'green',
};

export default function SettingsPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', role: 'content_moderator', display_name: '' });
  const [formError, setFormError] = useState('');

  const fetchAdminUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/admin-users');
      if (!res.ok) throw new Error('Failed to fetch admin users');
      const json = await res.json();
      setAdminUsers(json.data);
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminUsers();
  }, [fetchAdminUsers]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await fetch('/api/admin/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to create admin user');
      }
      setShowAddForm(false);
      setNewAdmin({ email: '', role: 'content_moderator', display_name: '' });
      fetchAdminUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteAdmin = async (userId: string) => {
    try {
      await fetch(`/api/admin/admin-users/${userId}`, { method: 'DELETE' });
      fetchAdminUsers();
    } catch (err) {
      console.error('Error deleting admin user:', err);
    }
  };

  const columns: Column<AdminUser>[] = [
    { key: 'display_name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (item) => (
        <AdminBadge
          label={item.role.replace(/_/g, ' ')}
          variant={ROLE_BADGES[item.role] ?? 'gray'}
        />
      ),
    },
    {
      key: 'is_active',
      header: 'Active',
      render: (item) => (
        <AdminBadge label={item.is_active ? 'Active' : 'Inactive'} variant={item.is_active ? 'green' : 'gray'} />
      ),
    },
    {
      key: 'last_login_at',
      header: 'Last Login',
      render: (item) => (
        <span className="text-sm text-gray-500">
          {item.last_login_at ? new Date(item.last_login_at).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleDeleteAdmin(item.user_id); }}
          className="text-red-600 hover:text-red-700 font-medium text-sm"
        >
          Remove
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage admin users and platform settings</p>
      </div>

      {/* Admin Users Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Admin Users</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700"
          >
            {showAddForm ? 'Cancel' : 'Add Admin'}
          </button>
        </div>

        {/* Add Admin Form */}
        {showAddForm && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <form onSubmit={handleAddAdmin} className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newAdmin.display_name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, display_name: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Full name"
                  required
                  aria-label="Admin name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
                  placeholder="admin@example.com"
                  required
                  aria-label="Admin email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
                  aria-label="Admin role"
                >
                  <option value="content_moderator">Content Moderator</option>
                  <option value="user_manager">User Manager</option>
                  <option value="analyst">Analyst</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700"
              >
                Add Admin User
              </button>
            </form>
            {formError && (
              <p className="text-red-600 text-sm mt-2">{formError}</p>
            )}
          </div>
        )}

        <div className="p-6">
          <AdminDataTable
            columns={columns}
            data={adminUsers}
            keyExtractor={(item) => item.user_id}
            loading={loading}
            emptyMessage="No admin users found."
          />
        </div>
      </div>

      {/* Platform Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Auto-moderation</p>
              <p className="text-sm text-gray-500">Automatically flag content based on keywords</p>
            </div>
            <span className="text-sm text-gray-400">Coming soon</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Send email alerts for urgent moderation items</p>
            </div>
            <span className="text-sm text-gray-400">Coming soon</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Data Export</p>
              <p className="text-sm text-gray-500">Schedule automatic data exports</p>
            </div>
            <span className="text-sm text-gray-400">Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
