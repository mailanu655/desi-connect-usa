/** @jest-environment node */

import { NextRequest } from 'next/server';

const mockRemoveSavedItem = jest.fn();

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    removeSavedItem: (...args: unknown[]) => mockRemoveSavedItem(...args),
  },
}));

import { DELETE } from '@/app/api/users/saved/[id]/route';

describe('Remove Saved Item API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRemoveSavedItem.mockReset();
  });

  describe('DELETE', () => {
    it('should remove saved item with valid id', async () => {
      const mockResponse = { success: true, message: 'Item removed' };
      mockRemoveSavedItem.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/users/saved/123');
      const response = await DELETE(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResponse);
      expect(mockRemoveSavedItem).toHaveBeenCalledWith('123');
      expect(mockRemoveSavedItem).toHaveBeenCalledTimes(1);
    });

    it('should return 400 error when id is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/saved/');
      const response = await DELETE(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Item ID is required');
      expect(mockRemoveSavedItem).not.toHaveBeenCalled();
    });

    it('should return 500 error on API failure', async () => {
      mockRemoveSavedItem.mockRejectedValue(new Error('API Error'));

      const request = new NextRequest('http://localhost:3000/api/users/saved/123');
      const response = await DELETE(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to remove saved item');
    });

    it('should handle UUID format id', async () => {
      const mockResponse = { success: true };
      mockRemoveSavedItem.mockResolvedValue(mockResponse);

      const id = '550e8400-e29b-41d4-a716-446655440000';
      const request = new NextRequest(
        `http://localhost:3000/api/users/saved/${id}`
      );
      const response = await DELETE(request, { params: { id } });

      expect(response.status).toBe(200);
      expect(mockRemoveSavedItem).toHaveBeenCalledWith(id);
    });

    it('should handle numeric string id', async () => {
      const mockResponse = { success: true };
      mockRemoveSavedItem.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/users/saved/999');
      const response = await DELETE(request, { params: { id: '999' } });

      expect(response.status).toBe(200);
      expect(mockRemoveSavedItem).toHaveBeenCalledWith('999');
    });

    it('should pass error message from API', async () => {
      mockRemoveSavedItem.mockRejectedValue(new Error('Item not found'));

      const request = new NextRequest('http://localhost:3000/api/users/saved/123');
      const response = await DELETE(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to remove saved item');
    });

    it('should handle non-existent item', async () => {
      mockRemoveSavedItem.mockResolvedValue({
        success: false,
        message: 'Item not found',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/users/saved/nonexistent'
      );
      const response = await DELETE(request, {
        params: { id: 'nonexistent' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockRemoveSavedItem).toHaveBeenCalledWith('nonexistent');
    });

    it('should handle whitespace-only id', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/saved/   ');
      const response = await DELETE(request, { params: { id: '   ' } });

      expect(response.status).toBe(400);
      expect(mockRemoveSavedItem).not.toHaveBeenCalled();
    });

    it('should handle special characters in id', async () => {
      const mockResponse = { success: true };
      mockRemoveSavedItem.mockResolvedValue(mockResponse);

      const id = 'item-123-abc';
      const request = new NextRequest(
        `http://localhost:3000/api/users/saved/${id}`
      );
      const response = await DELETE(request, { params: { id } });

      expect(response.status).toBe(200);
      expect(mockRemoveSavedItem).toHaveBeenCalledWith(id);
    });

    it('should handle consecutive DELETE requests for different items', async () => {
      mockRemoveSavedItem.mockResolvedValue({ success: true });

      const request1 = new NextRequest(
        'http://localhost:3000/api/users/saved/item1'
      );
      const response1 = await DELETE(request1, { params: { id: 'item1' } });

      const request2 = new NextRequest(
        'http://localhost:3000/api/users/saved/item2'
      );
      const response2 = await DELETE(request2, { params: { id: 'item2' } });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(mockRemoveSavedItem).toHaveBeenCalledTimes(2);
      expect(mockRemoveSavedItem).toHaveBeenNthCalledWith(1, 'item1');
      expect(mockRemoveSavedItem).toHaveBeenNthCalledWith(2, 'item2');
    });
  });
});
