import {
  hasPermission,
  getPermissions,
  getAllowedResources,
  getAllowedActions,
  canModerateContent,
  canManageUsers,
  canAccessAnalytics,
  canBulkUpdate,
  canExportData,
  isSuperAdmin,
  getNavItemsForRole,
} from '@/lib/admin/permissions';
import type { AdminRole, AdminResource, AdminAction } from '@desi-connect-usa/shared';

describe('Admin Permissions', () => {
  describe('hasPermission', () => {
    it('grants super_admin full access to all resources and actions', () => {
      const resources: AdminResource[] = [
        'users', 'businesses', 'news', 'events', 'deals', 'reviews', 'forum', 'consultancies', 'jobs', 'analytics', 'settings',
      ];

      // super_admin should have view on every resource
      for (const resource of resources) {
        expect(hasPermission('super_admin', resource, 'view')).toBe(true);
      }

      // super_admin should have bulk_update on most content resources
      expect(hasPermission('super_admin', 'businesses', 'bulk_update')).toBe(true);
      expect(hasPermission('super_admin', 'users', 'bulk_update')).toBe(true);
      expect(hasPermission('super_admin', 'businesses', 'export')).toBe(true);
      expect(hasPermission('super_admin', 'settings', 'update')).toBe(true);
    });

    it('grants content_moderator access to businesses view and approve', () => {
      expect(hasPermission('content_moderator', 'businesses', 'view')).toBe(true);
      expect(hasPermission('content_moderator', 'businesses', 'approve')).toBe(true);
      expect(hasPermission('content_moderator', 'businesses', 'update')).toBe(true);
    });

    it('denies content_moderator access to user management', () => {
      expect(hasPermission('content_moderator', 'users', 'update')).toBe(false);
      expect(hasPermission('content_moderator', 'users', 'delete')).toBe(false);
    });

    it('grants user_manager access to user view and update', () => {
      expect(hasPermission('user_manager', 'users', 'view')).toBe(true);
      expect(hasPermission('user_manager', 'users', 'update')).toBe(true);
    });

    it('denies user_manager access to settings', () => {
      expect(hasPermission('user_manager', 'settings', 'update')).toBe(false);
    });

    it('grants analyst access to analytics view and export', () => {
      expect(hasPermission('analyst', 'analytics', 'view')).toBe(true);
      expect(hasPermission('analyst', 'analytics', 'export')).toBe(true);
    });

    it('denies analyst access to businesses update', () => {
      expect(hasPermission('analyst', 'businesses', 'update')).toBe(false);
    });
  });

  describe('getPermissions', () => {
    it('returns all permissions for super_admin', () => {
      const perms = getPermissions('super_admin');
      expect(perms.length).toBeGreaterThan(0);
      expect(perms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ resource: 'businesses', actions: expect.arrayContaining(['view', 'approve']) }),
          expect.objectContaining({ resource: 'users', actions: expect.arrayContaining(['view', 'delete']) }),
          expect.objectContaining({ resource: 'settings', actions: expect.arrayContaining(['update']) }),
        ])
      );
    });

    it('returns limited permissions for analyst', () => {
      const perms = getPermissions('analyst');
      const resources = [...new Set(perms.map((p) => p.resource))];
      expect(resources).toContain('analytics');
    });
  });

  describe('getAllowedResources', () => {
    it('returns all resources for super_admin', () => {
      const resources = getAllowedResources('super_admin');
      expect(resources).toContain('businesses');
      expect(resources).toContain('users');
      expect(resources).toContain('news');
      expect(resources).toContain('analytics');
      expect(resources).toContain('events');
      expect(resources).toContain('settings');
      expect(resources).toContain('deals');
    });

    it('returns subset for content_moderator', () => {
      const resources = getAllowedResources('content_moderator');
      expect(resources).toContain('businesses');
      expect(resources).toContain('news');
      expect(resources).toContain('events');
    });
  });

  describe('getAllowedActions', () => {
    it('returns all actions for super_admin on businesses', () => {
      const actions = getAllowedActions('super_admin', 'businesses');
      expect(actions).toContain('view');
      expect(actions).toContain('update');
      expect(actions).toContain('delete');
      expect(actions).toContain('approve');
    });

    it('returns limited actions for content_moderator on businesses', () => {
      const actions = getAllowedActions('content_moderator', 'businesses');
      expect(actions).toContain('view');
      expect(actions).toContain('update');
      expect(actions).toContain('approve');
    });
  });

  describe('role-based helper functions', () => {
    it('canModerateContent returns true for super_admin and content_moderator', () => {
      expect(canModerateContent('super_admin')).toBe(true);
      expect(canModerateContent('content_moderator')).toBe(true);
    });

    it('canModerateContent returns false for analyst', () => {
      expect(canModerateContent('analyst')).toBe(false);
    });

    it('canManageUsers returns true for super_admin and user_manager', () => {
      expect(canManageUsers('super_admin')).toBe(true);
      expect(canManageUsers('user_manager')).toBe(true);
    });

    it('canManageUsers returns false for content_moderator', () => {
      expect(canManageUsers('content_moderator')).toBe(false);
    });

    it('canAccessAnalytics returns true for super_admin and analyst', () => {
      expect(canAccessAnalytics('super_admin')).toBe(true);
      expect(canAccessAnalytics('analyst')).toBe(true);
    });

    it('canBulkUpdate returns true for super_admin on businesses', () => {
      expect(canBulkUpdate('super_admin', 'businesses')).toBe(true);
      expect(canBulkUpdate('super_admin', 'users')).toBe(true);
    });

    it('canExportData returns true for roles with export permission', () => {
      expect(canExportData('super_admin', 'analytics')).toBe(true);
      expect(canExportData('analyst', 'analytics')).toBe(true);
    });

    it('isSuperAdmin returns true only for super_admin', () => {
      expect(isSuperAdmin('super_admin')).toBe(true);
      expect(isSuperAdmin('content_moderator')).toBe(false);
      expect(isSuperAdmin('user_manager')).toBe(false);
      expect(isSuperAdmin('analyst')).toBe(false);
    });
  });

  describe('getNavItemsForRole', () => {
    it('returns navigation items accessible to the role', () => {
      const items = getNavItemsForRole('super_admin');
      expect(items.length).toBeGreaterThan(0);
      expect(items[0]).toHaveProperty('label');
      expect(items[0]).toHaveProperty('href');
      expect(items[0]).toHaveProperty('icon');
      expect(items[0]).toHaveProperty('requiredResource');
      expect(items[0]).toHaveProperty('requiredAction');
    });

    it('returns fewer items for limited roles', () => {
      const superItems = getNavItemsForRole('super_admin');
      const analystItems = getNavItemsForRole('analyst');
      expect(analystItems.length).toBeLessThanOrEqual(superItems.length);
    });

    it('only includes items the role has permission for', () => {
      const items = getNavItemsForRole('analyst');
      for (const item of items) {
        expect(
          hasPermission('analyst', item.requiredResource, item.requiredAction)
        ).toBe(true);
      }
    });
  });
});
