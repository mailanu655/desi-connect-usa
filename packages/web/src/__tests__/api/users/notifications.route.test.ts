/** @jest-environment node */

import { NextRequest } from 'next/server';

const mockGetNotificationPreferences = jest.fn();
const mockUpdateNotificationPreferences = jest.fn();

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getNotificationPreferences: (...args: unknown[]) =>
      mockGetNotificationPreferences(...args),
    updateNotificationPreferences: (...args: unknown[]) =>
      mockUpdateNotificationPreferences(...args),
  },
}));

import { GET, POST } from '@/app/api/users/notifications/route';

describe('Notification Preferences API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNotificationPreferences.mockReset();
    mockUpdateNotificationPreferences.mockReset();
  });

  describe('GET', () => {
    it('should return notification preferences on success', async () => {
      const mockPreferences = {
        preferences: [
          {
            type: 'new_deals',
            label: 'New Deals',
            description: 'Get notified about deals',
            enabled: true,
            frequency: 'daily',
            channels: ['email', 'in_app'],
          },
        ],
      };

      mockGetNotificationPreferences.mockResolvedValue(mockPreferences);

      const request = new NextRequest(
        'http://localhost:3000/api/users/notifications'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPreferences);
      expect(mockGetNotificationPreferences).toHaveBeenCalledTimes(1);
    });

    it('should return 500 error on API failure', async () => {
      mockGetNotificationPreferences.mockRejectedValue(new Error('API Error'));

      const request = new NextRequest(
        'http://localhost:3000/api/users/notifications'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch notification preferences');
    });

    it('should handle empty preferences', async () => {
      mockGetNotificationPreferences.mockResolvedValue({ preferences: [] });

      const request = new NextRequest(
        'http://localhost:3000/api/users/notifications'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences).toHaveLength(0);
    });

    it('should handle multiple preferences', async () => {
      const mockPreferences = {
        preferences: [
          {
            type: 'new_deals',
            label: 'New Deals',
            enabled: true,
            frequency: 'daily',
            channels: ['email'],
          },
          {
            type: 'new_events',
            label: 'New Events',
            enabled: false,
            frequency: 'weekly',
            channels: ['in_app'],
          },
        ],
      };

      mockGetNotificationPreferences.mockResolvedValue(mockPreferences);

      const request = new NextRequest(
        'http://localhost:3000/api/users/notifications'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences).toHaveLength(2);
    });
  });

  describe('POST', () => {
    it('should update preferences with valid data', async () => {
      const updateData = {
        preferences: [
          {
            type: 'new_deals',
            label: 'New Deals',
            enabled: true,
            frequency: 'daily',
            channels: ['email', 'whatsapp'],
          },
        ],
      };

      const mockResponse = { success: true };
      mockUpdateNotificationPreferences.mockResolvedValue(mockResponse);

      const request = new NextRequest(
        'http://localhost:3000/api/users/notifications',
        {
          method: 'POST',
          body: JSON.stringify(updateData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResponse);
      expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith(
        updateData.preferences
      );
    });

    it('should return 400 error when preferences is not an array', async () => {
      const updateData = {
        preferences: {
          type: 'new_deals',
          label: 'New Deals',
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/users/notifications',
        {
          method: 'POST',
          body: JSON.stringify(updateData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('preferences must be an array');
    });

    it('should return 400 error when preferences is missing', async () => {
      const updateData = {};

      const request = new NextRequest(
        'http://localhost:3000/api/users/notifications',
        {
          method: 'POST',
          body: JSON.stringify(updateData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('preferences must be an array');
    });

    it('should return 400 error when preferences is null', async () => {
      const updateData = {
        preferences: null,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/users/notifications',
        {
          method: 'POST',
          body: JSON.stringify(updateData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('should return 500 error on API failure', async () => {
      const updateData = {
        preferences: [
          {
            type: 'new_deals',
            label: 'New Deals',
            enabled: true,
            frequency: 'daily',
            channels: ['email'],
          },
        ],
      };

      mockUpdateNotificationPreferences.mockRejectedValue(new Error('API Error'));

      const request = new NextRequest(
        'http://localhost:3000/api/users/notifications',
        {
          method: 'POST',
          body: JSON.stringify(updateData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update notification preferences');
    });

    it('should handle empty preferences array', async () => {
      const updateData = {
        preferences: [],
      };

      mockUpdateNotificationPreferences.mockResolvedValue({ success: true });

      const request = new NextRequest(
        'http://localhost:3000/api/users/notifications',
        {
          method: 'POST',
          body: JSON.stringify(updateData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith([]);
    });

    it('should handle multiple preferences', async () => {
      const updateData = {
        preferences: [
          {
            type: 'new_deals',
            label: 'New Deals',
            enabled: true,
            frequency: 'daily',
            channels: ['email'],
          },
          {
            type: 'new_events',
            label: 'New Events',
            enabled: false,
            frequency: 'weekly',
            channels: ['in_app', 'whatsapp'],
          },
          {
            type: 'job_alerts',
            label: 'Job Alerts',
            enabled: true,
            frequency: 'immediate',
            channels: ['email', 'push'],
          },
        ],
      };

      mockUpdateNotificationPreferences.mockResolvedValue({ success: true });

      const request = new NextRequest(
        'http://localhost:3000/api/users/notifications',
        {
          method: 'POST',
          body: JSON.stringify(updateData),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith(
        updateData.preferences
      );
    });

    it('should return 400 error when preferences is a string', async () => {
      const updateData = {
        preferences: 'not an array',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/users/notifications',
        {
          method: 'POST',
          body: JSON.stringify(updateData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('preferences must be an array');
    });

    it('should return 400 error when preferences is a number', async () => {
      const updateData = {
        preferences: 123,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/users/notifications',
        {
          method: 'POST',
          body: JSON.stringify(updateData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('should pass preferences exactly as provided', async () => {
      const updateData = {
        preferences: [
          {
            type: 'new_deals',
            label: 'New Deals',
            description: 'Get notified about deals',
            enabled: true,
            frequency: 'daily',
            channels: ['email', 'whatsapp', 'in_app'],
          },
        ],
      };

      mockUpdateNotificationPreferences.mockResolvedValue({ success: true });

      const request = new NextRequest(
        'http://localhost:3000/api/users/notifications',
        {
          method: 'POST',
          body: JSON.stringify(updateData),
        }
      );

      const response = await POST(request);

      expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith(
        updateData.preferences
      );
    });
  });
});
