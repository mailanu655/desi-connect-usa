/**
 * Admin Permission Helpers (Week 14)
 *
 * Role-based access control utilities that use the shared
 * ADMIN_ROLE_PERMISSIONS constant to check whether an admin
 * user is allowed to perform a specific action on a resource.
 */

import type {
  AdminRole,
  AdminResource,
  AdminAction,
  AdminPermission,
} from '@desi-connect/shared';

import { ADMIN_ROLE_PERMISSIONS } from '@desi-connect/shared';

// ── Permission Check ────────────────────────────────────────────

/**
 * Check if a role has a specific action on a resource.
 */
export function hasPermission(
  role: AdminRole,
  resource: AdminResource,
  action: AdminAction,
): boolean {
  const permissions = ADMIN_ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.some(
    (p) => p.resource === resource && p.actions.includes(action),
  );
}

/**
 * Get all permissions for a role.
 */
export function getPermissions(role: AdminRole): AdminPermission[] {
  return ADMIN_ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Get all allowed resources for a role.
 */
export function getAllowedResources(role: AdminRole): AdminResource[] {
  const permissions = ADMIN_ROLE_PERMISSIONS[role] ?? [];
  return [...new Set(permissions.map((p) => p.resource))];
}

/**
 * Get allowed actions for a role on a specific resource.
 */
export function getAllowedActions(
  role: AdminRole,
  resource: AdminResource,
): AdminAction[] {
  const permissions = ADMIN_ROLE_PERMISSIONS[role] ?? [];
  const perm = permissions.find((p) => p.resource === resource);
  return perm?.actions ?? [];
}

/**
 * Check if a role can moderate content (approve/reject/flag).
 */
export function canModerateContent(role: AdminRole): boolean {
  return (
    hasPermission(role, 'businesses', 'approve') ||
    hasPermission(role, 'news', 'approve') ||
    hasPermission(role, 'events', 'approve')
  );
}

/**
 * Check if a role can manage users.
 */
export function canManageUsers(role: AdminRole): boolean {
  return hasPermission(role, 'users', 'update');
}

/**
 * Check if a role can access analytics.
 */
export function canAccessAnalytics(role: AdminRole): boolean {
  return hasPermission(role, 'analytics', 'view');
}

/**
 * Check if a role can perform bulk operations on a resource.
 */
export function canBulkUpdate(role: AdminRole, resource: AdminResource): boolean {
  return hasPermission(role, resource, 'bulk_update');
}

/**
 * Check if a role can export data from a resource.
 */
export function canExportData(role: AdminRole, resource: AdminResource): boolean {
  return hasPermission(role, resource, 'export');
}

/**
 * Check if a role has super-admin level access.
 */
export function isSuperAdmin(role: AdminRole): boolean {
  return role === 'super_admin';
}

// ── Navigation Helpers ──────────────────────────────────────────

export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
  requiredResource: AdminResource;
  requiredAction: AdminAction;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard', requiredResource: 'analytics', requiredAction: 'view' },
  { label: 'Moderation', href: '/admin/moderation', icon: 'Shield', requiredResource: 'businesses', requiredAction: 'approve' },
  { label: 'Users', href: '/admin/users', icon: 'Users', requiredResource: 'users', requiredAction: 'view' },
  { label: 'Content', href: '/admin/content', icon: 'FileText', requiredResource: 'businesses', requiredAction: 'view' },
  { label: 'Approvals', href: '/admin/approvals', icon: 'CheckCircle', requiredResource: 'businesses', requiredAction: 'approve' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'BarChart3', requiredResource: 'analytics', requiredAction: 'view' },
  { label: 'Audit Log', href: '/admin/audit-log', icon: 'ScrollText', requiredResource: 'settings', requiredAction: 'view' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings', requiredResource: 'settings', requiredAction: 'view' },
];

/**
 * Get navigation items visible to a specific admin role.
 */
export function getNavItemsForRole(role: AdminRole): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) =>
    hasPermission(role, item.requiredResource, item.requiredAction),
  );
}
