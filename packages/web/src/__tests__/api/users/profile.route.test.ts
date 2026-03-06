/** @jest-environment node */

import { NextRequest } from 'next/server';

const mockGetUserProfile = jest.fn();
const mockUpdateUserProfile = jest.fn();

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
    updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
  },
}));

import { GET, POST } from '@/app/api/users/profile/route';

describe('User Profile API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserProfile.mockReset();
    mockUpdateUserProfile.mockReset();
  });

  describe('GET', () => {
    it('should return user profile data on success', async () => {
      const mockProfile = {
        id: '1',
        display_name: 'John Doe',
        email: 'john@example.com',
        phone_number: '555-1234',
        city: 'San Francisco',
        state: 'CA',
        preferred_channel: 'email',
        identity_linked: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockGetUserProfile.mockResolvedValue(mockProfile);

      const request = new NextRequest('http://localhost:3000/api/users/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockProfile);
      expect(mockGetUserProfile).toHaveBeenCalledTimes(1);
    });

    it('should return 500 error on API failure', async () => {
      mockGetUserProfile.mockRejectedValue(new Error('API Error'));

      const request = new NextRequest('http://localhost:3000/api/users/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch user profile');
    });

    it('should handle empty profile response', async () => {
      mockGetUserProfile.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/users/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toBeNull();
    });
  });

  describe('POST', () => {
    it('should update profile with valid data', async () => {
      const updateData = {
        display_name: 'Jane Doe',
        city: 'New York',
      };

      const mockResponse = {
        id: '1',
        display_name: 'Jane Doe',
        city: 'New York',
      };

      mockUpdateUserProfile.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'POST',
        body: JSON.stringify(updateData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResponse);
      expect(mockUpdateUserProfile).toHaveBeenCalledWith(updateData);
    });

    it('should return 400 error for empty body', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('At least one field is required to update profile');
    });

    it('should return 400 error for null body', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'POST',
        body: JSON.stringify(null),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('should return 500 error on API failure', async () => {
      const updateData = { display_name: 'Jane Doe' };
      mockUpdateUserProfile.mockRejectedValue(new Error('API Error'));

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'POST',
        body: JSON.stringify(updateData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update user profile');
    });

    it('should handle update with single field', async () => {
      const updateData = { display_name: 'Jane Doe' };
      const mockResponse = { id: '1', display_name: 'Jane Doe' };

      mockUpdateUserProfile.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'POST',
        body: JSON.stringify(updateData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockUpdateUserProfile).toHaveBeenCalledWith(updateData);
    });

    it('should handle update with multiple fields', async () => {
      const updateData = {
        display_name: 'Jane Doe',
        email: 'jane@example.com',
        phone_number: '555-5678',
        city: 'New York',
        state: 'NY',
        preferred_channel: 'whatsapp',
      };

      mockUpdateUserProfile.mockResolvedValue(updateData);

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'POST',
        body: JSON.stringify(updateData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockUpdateUserProfile).toHaveBeenCalledWith(updateData);
    });

    it('should pass through API error messages', async () => {
      const updateData = { display_name: 'Jane Doe' };
      mockUpdateUserProfile.mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'POST',
        body: JSON.stringify(updateData),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});
