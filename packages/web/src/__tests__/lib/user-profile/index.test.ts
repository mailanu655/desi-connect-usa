/**
 * Tests for User Profile Utility Library
 */

import {
  formatUserDisplayName,
  getProfileCompletionPercentage,
  getUserInitials,
  isProfileComplete,
  formatJoinDate,
} from '@/lib/user-profile';
import type { User } from '@desi-connect/shared';

describe('User Profile Utilities', () => {
  // formatUserDisplayName tests
  describe('formatUserDisplayName', () => {
    it('should return display name when user exists with display_name', () => {
      const user: User = {
        id: '1',
        display_name: 'John Doe',
        email: 'john@example.com',
        phone_number: null,
        city: null,
        state: null,
        preferred_channel: null,
        identity_linked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(formatUserDisplayName(user)).toBe('John Doe');
    });

    it('should return "Anonymous User" when user is null', () => {
      expect(formatUserDisplayName(null)).toBe('Anonymous User');
    });

    it('should return "Anonymous User" when user is undefined', () => {
      expect(formatUserDisplayName(undefined)).toBe('Anonymous User');
    });

    it('should return "Anonymous User" when display_name is empty string', () => {
      const user: User = {
        id: '1',
        display_name: '',
        email: 'john@example.com',
        phone_number: null,
        city: null,
        state: null,
        preferred_channel: null,
        identity_linked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(formatUserDisplayName(user)).toBe('Anonymous User');
    });

    it('should return "Anonymous User" when display_name is null', () => {
      const user: User = {
        id: '1',
        display_name: null,
        email: 'john@example.com',
        phone_number: null,
        city: null,
        state: null,
        preferred_channel: null,
        identity_linked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(formatUserDisplayName(user)).toBe('Anonymous User');
    });
  });

  // getProfileCompletionPercentage tests
  describe('getProfileCompletionPercentage', () => {
    it('should return 0 when user is null', () => {
      expect(getProfileCompletionPercentage(null)).toBe(0);
    });

    it('should return 0 when user is undefined', () => {
      expect(getProfileCompletionPercentage(undefined)).toBe(0);
    });

    it('should return 0 when all fields are empty', () => {
      const user: User = {
        id: '1',
        display_name: null,
        email: null,
        phone_number: null,
        city: null,
        state: null,
        preferred_channel: null,
        identity_linked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(getProfileCompletionPercentage(user)).toBe(0);
    });

    it('should return 20 when one of five fields is filled', () => {
      const user: User = {
        id: '1',
        display_name: 'John Doe',
        email: null,
        phone_number: null,
        city: null,
        preferred_channel: null,
        identity_linked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(getProfileCompletionPercentage(user)).toBe(20);
    });

    it('should return 60 when three of five fields are filled', () => {
      const user: User = {
        id: '1',
        display_name: 'John Doe',
        email: 'john@example.com',
        phone_number: '555-1234',
        city: null,
        preferred_channel: null,
        identity_linked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(getProfileCompletionPercentage(user)).toBe(60);
    });

    it('should return 100 when all fields are filled', () => {
      const user: User = {
        id: '1',
        display_name: 'John Doe',
        email: 'john@example.com',
        phone_number: '555-1234',
        city: 'San Francisco',
        preferred_channel: 'email',
        identity_linked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(getProfileCompletionPercentage(user)).toBe(100);
    });

    it('should treat empty strings as unfilled', () => {
      const user: User = {
        id: '1',
        display_name: '',
        email: 'john@example.com',
        phone_number: '',
        city: 'San Francisco',
        preferred_channel: '',
        identity_linked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(getProfileCompletionPercentage(user)).toBe(40);
    });
  });

  // getUserInitials tests
  describe('getUserInitials', () => {
    it('should return "U" for empty string', () => {
      expect(getUserInitials('')).toBe('U');
    });

    it('should return first letter capitalized for single name', () => {
      expect(getUserInitials('john')).toBe('J');
    });

    it('should return first letters of first two names', () => {
      expect(getUserInitials('John Doe')).toBe('JD');
    });

    it('should return first letters ignoring additional names', () => {
      expect(getUserInitials('John Michael Doe')).toBe('JM');
    });

    it('should capitalize lowercase initials', () => {
      expect(getUserInitials('john doe')).toBe('JD');
    });

    it('should handle names with extra spaces', () => {
      expect(getUserInitials('John  Doe')).toBe('JD');
    });

    it('should handle single character names', () => {
      expect(getUserInitials('J D')).toBe('JD');
    });
  });

  // isProfileComplete tests
  describe('isProfileComplete', () => {
    it('should return false when user is null', () => {
      expect(isProfileComplete(null)).toBe(false);
    });

    it('should return false when user is undefined', () => {
      expect(isProfileComplete(undefined)).toBe(false);
    });

    it('should return false when required fields are missing', () => {
      const user: User = {
        id: '1',
        display_name: 'John Doe',
        email: 'john@example.com',
        phone_number: null,
        city: 'San Francisco',
        preferred_channel: 'email',
        identity_linked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(isProfileComplete(user)).toBe(false);
    });

    it('should return true when all required fields are filled (without identity_linked)', () => {
      const user: User = {
        id: '1',
        display_name: 'John Doe',
        email: 'john@example.com',
        phone_number: '555-1234',
        city: 'San Francisco',
        preferred_channel: 'email',
        identity_linked: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(isProfileComplete(user)).toBe(true);
    });

    it('should return false when identity_linked is false', () => {
      const user: User = {
        id: '1',
        display_name: 'John Doe',
        email: 'john@example.com',
        phone_number: '555-1234',
        city: 'San Francisco',
        preferred_channel: 'email',
        identity_linked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(isProfileComplete(user)).toBe(false);
    });

    it('should return false when empty strings are provided', () => {
      const user: User = {
        id: '1',
        display_name: '',
        email: 'john@example.com',
        phone_number: '555-1234',
        city: 'San Francisco',
        preferred_channel: 'email',
        identity_linked: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(isProfileComplete(user)).toBe(false);
    });
  });

  // formatJoinDate tests
  describe('formatJoinDate', () => {
    it('should return "Unknown" for empty string', () => {
      expect(formatJoinDate('')).toBe('Unknown');
    });

    it('should format valid ISO date string', () => {
      const dateStr = '2024-01-15T10:30:00Z';
      const result = formatJoinDate(dateStr);
      expect(result).toMatch(/January 15, 2024/);
    });

    it('should handle different month formats', () => {
      const dateStr = '2024-06-20T10:30:00Z';
      const result = formatJoinDate(dateStr);
      expect(result).toMatch(/June 20, 2024/);
    });

    it('should return "Unknown" for invalid date string', () => {
      expect(formatJoinDate('invalid-date')).toBe('Unknown');
    });

    it('should handle dates with different timezones', () => {
      const dateStr = '2024-01-15T10:30:00+05:30';
      const result = formatJoinDate(dateStr);
      expect(result).toMatch(/January 15, 2024/);
    });

    it('should format dates correctly with different years', () => {
      const dateStr = '2023-12-25T00:00:00Z';
      const result = formatJoinDate(dateStr);
      expect(result).toMatch(/December 25, 2023/);
    });
  });
});
