/** @jest-environment node */

import { NextRequest } from 'next/server';

const mockGetSavedItems = jest.fn();
const mockSaveItem = jest.fn();

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getSavedItems: (...args: unknown[]) => mockGetSavedItems(...args),
    saveItem: (...args: unknown[]) => mockSaveItem(...args),
  },
}));

import { GET, POST } from '@/app/api/users/saved/route';

describe('Saved Items API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSavedItems.mockReset();
    mockSaveItem.mockReset();
  });

  describe('GET', () => {
    it('should return saved items with default parameters', async () => {
      const mockItems = {
        data: [
          {
            saved_id: '1',
            item_id: 'item1',
            item_type: 'business',
            item_title: 'Business 1',
            item_subtitle: null,
            item_image_url: null,
            saved_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockGetSavedItems.mockResolvedValue(mockItems);

      const request = new NextRequest('http://localhost:3000/api/users/saved');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockItems);
      expect(mockGetSavedItems).toHaveBeenCalledWith({
        item_type: undefined,
        page: undefined,
        limit: undefined,
      });
    });

    it('should pass through item_type filter', async () => {
      mockGetSavedItems.mockResolvedValue({ data: [] });

      const request = new NextRequest(
        'http://localhost:3000/api/users/saved?item_type=business'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetSavedItems).toHaveBeenCalledWith({
        item_type: 'business',
        page: undefined,
        limit: undefined,
      });
    });

    it('should parse page parameter as integer', async () => {
      mockGetSavedItems.mockResolvedValue({ data: [] });

      const request = new NextRequest(
        'http://localhost:3000/api/users/saved?page=2'
      );
      const response = await GET(request);

      expect(mockGetSavedItems).toHaveBeenCalledWith({
        item_type: undefined,
        page: 2,
        limit: undefined,
      });
    });

    it('should parse limit parameter as integer', async () => {
      mockGetSavedItems.mockResolvedValue({ data: [] });

      const request = new NextRequest(
        'http://localhost:3000/api/users/saved?limit=25'
      );
      const response = await GET(request);

      expect(mockGetSavedItems).toHaveBeenCalledWith({
        item_type: undefined,
        page: undefined,
        limit: 25,
      });
    });

    it('should handle multiple filters together', async () => {
      mockGetSavedItems.mockResolvedValue({ data: [] });

      const request = new NextRequest(
        'http://localhost:3000/api/users/saved?item_type=deal&page=1&limit=10'
      );
      const response = await GET(request);

      expect(mockGetSavedItems).toHaveBeenCalledWith({
        item_type: 'deal',
        page: 1,
        limit: 10,
      });
    });

    it('should return 500 error on API failure', async () => {
      mockGetSavedItems.mockRejectedValue(new Error('API Error'));

      const request = new NextRequest('http://localhost:3000/api/users/saved');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch saved items');
    });

    it('should handle empty saved items list', async () => {
      mockGetSavedItems.mockResolvedValue({ data: [] });

      const request = new NextRequest('http://localhost:3000/api/users/saved');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(0);
    });
  });

  describe('POST', () => {
    it('should save item with valid data', async () => {
      const saveData = {
        item_type: 'business',
        item_id: 'item1',
      };

      const mockResponse = { saved_id: '1' };
      mockSaveItem.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/users/saved', {
        method: 'POST',
        body: JSON.stringify(saveData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResponse);
      expect(mockSaveItem).toHaveBeenCalledWith('business', 'item1');
    });

    it('should return 400 error when item_type is missing', async () => {
      const saveData = {
        item_id: 'item1',
      };

      const request = new NextRequest('http://localhost:3000/api/users/saved', {
        method: 'POST',
        body: JSON.stringify(saveData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('item_type and item_id are required');
    });

    it('should return 400 error when item_id is missing', async () => {
      const saveData = {
        item_type: 'business',
      };

      const request = new NextRequest('http://localhost:3000/api/users/saved', {
        method: 'POST',
        body: JSON.stringify(saveData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('item_type and item_id are required');
    });

    it('should return 400 error when both item_type and item_id are missing', async () => {
      const saveData = {};

      const request = new NextRequest('http://localhost:3000/api/users/saved', {
        method: 'POST',
        body: JSON.stringify(saveData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('item_type and item_id are required');
    });

    it('should return 500 error on API failure', async () => {
      const saveData = {
        item_type: 'business',
        item_id: 'item1',
      };

      mockSaveItem.mockRejectedValue(new Error('API Error'));

      const request = new NextRequest('http://localhost:3000/api/users/saved', {
        method: 'POST',
        body: JSON.stringify(saveData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save item');
    });

    it('should handle save with additional fields', async () => {
      const saveData = {
        item_type: 'business',
        item_id: 'item1',
        item_title: 'Business Title',
        item_subtitle: 'Subtitle',
      };

      mockSaveItem.mockResolvedValue({ saved_id: '1' });

      const request = new NextRequest('http://localhost:3000/api/users/saved', {
        method: 'POST',
        body: JSON.stringify(saveData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSaveItem).toHaveBeenCalledWith('business', 'item1');
    });

    it('should handle different item types', async () => {
      const types = ['business', 'event', 'deal', 'job'];

      for (const type of types) {
        mockSaveItem.mockResolvedValue({ saved_id: '1' });

        const saveData = {
          item_type: type,
          item_id: `item-${type}`,
        };

        const request = new NextRequest('http://localhost:3000/api/users/saved', {
          method: 'POST',
          body: JSON.stringify(saveData),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });

    it('should handle empty item_type string', async () => {
      const saveData = {
        item_type: '',
        item_id: 'item1',
      };

      const request = new NextRequest('http://localhost:3000/api/users/saved', {
        method: 'POST',
        body: JSON.stringify(saveData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('should handle empty item_id string', async () => {
      const saveData = {
        item_type: 'business',
        item_id: '',
      };

      const request = new NextRequest('http://localhost:3000/api/users/saved', {
        method: 'POST',
        body: JSON.stringify(saveData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });
  });
});
