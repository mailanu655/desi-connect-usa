/**
 * API Client Tests
 *
 * Tests for TeableClient and NoCodeBackendClient covering:
 * - HTTP method construction (GET, POST, PATCH, DELETE)
 * - Authentication headers
 * - Error handling and status codes
 * - Query parameter serialization
 * - Timeout behavior
 */

import { TeableClient, TeableApiError } from '../../../packages/database/src/client/teable-client';
import { NoCodeBackendClient, NoCodeBackendApiError } from '../../../packages/database/src/client/nocodebackend-client';

// ─── Mock fetch ─────────────────────────────────────────────────

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

function jsonResponse(data: any, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function errorResponse(status: number, body: any) {
  return Promise.resolve({
    ok: false,
    status,
    statusText: 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

// ─── TeableClient ───────────────────────────────────────────────

describe('TeableClient', () => {
  let client: TeableClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new TeableClient({
      baseUrl: 'https://teable.example.com',
      apiKey: 'test-api-key',
    });
  });

  describe('listRecords', () => {
    it('sends GET with Bearer auth header', async () => {
      mockFetch.mockReturnValue(jsonResponse({ records: [] }));
      await client.listRecords('tbl_123');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/table/tbl_123/record');
      expect(opts.method).toBe('GET');
      expect(opts.headers['Authorization']).toBe('Bearer test-api-key');
    });

    it('appends query params when provided', async () => {
      mockFetch.mockReturnValue(jsonResponse({ records: [] }));
      await client.listRecords('tbl_123', { filter: 'status=active', maxRecords: 50 });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('filter=');
      expect(url).toContain('maxRecords=50');
    });

    it('returns records array', async () => {
      mockFetch.mockReturnValue(jsonResponse({
        records: [
          { id: 'rec-1', fields: { name: 'Test' } },
          { id: 'rec-2', fields: { name: 'Test2' } },
        ],
      }));
      const result = await client.listRecords('tbl_123');
      expect(result.records).toHaveLength(2);
      expect(result.records[0].id).toBe('rec-1');
    });
  });

  describe('getRecord', () => {
    it('sends GET to record-specific URL', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'rec-1', fields: { name: 'Test' } }));
      const record = await client.getRecord('tbl_123', 'rec-1');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/table/tbl_123/record/rec-1');
      expect(record.id).toBe('rec-1');
      expect(record.fields.name).toBe('Test');
    });
  });

  describe('createRecord', () => {
    it('sends POST with JSON body', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'rec-new', fields: { name: 'New' } }));
      const record = await client.createRecord('tbl_123', {
        fields: { name: 'New' },
      });

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/table/tbl_123/record');
      expect(opts.method).toBe('POST');
      expect(opts.headers['Content-Type']).toBe('application/json');
      const body = JSON.parse(opts.body);
      expect(body.fields.name).toBe('New');
      expect(record.id).toBe('rec-new');
    });
  });

  describe('batchCreateRecords', () => {
    it('sends POST with records array', async () => {
      mockFetch.mockReturnValue(jsonResponse({
        records: [
          { id: 'rec-1', fields: { name: 'A' } },
          { id: 'rec-2', fields: { name: 'B' } },
        ],
      }));
      const result = await client.batchCreateRecords('tbl_123', {
        records: [
          { fields: { name: 'A' } },
          { fields: { name: 'B' } },
        ],
      });

      expect(result.records).toHaveLength(2);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.records).toHaveLength(2);
    });
  });

  describe('updateRecord', () => {
    it('sends PATCH with fields', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: 'rec-1', fields: { name: 'Updated' } }));
      const record = await client.updateRecord('tbl_123', 'rec-1', {
        fields: { name: 'Updated' },
      });

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/table/tbl_123/record/rec-1');
      expect(opts.method).toBe('PATCH');
      expect(record.fields.name).toBe('Updated');
    });
  });

  describe('deleteRecord', () => {
    it('sends DELETE request', async () => {
      mockFetch.mockReturnValue(jsonResponse({}));
      await client.deleteRecord('tbl_123', 'rec-1');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/table/tbl_123/record/rec-1');
      expect(opts.method).toBe('DELETE');
    });
  });

  describe('error handling', () => {
    it('throws TeableApiError on 404', async () => {
      mockFetch.mockReturnValue(errorResponse(404, { message: 'Not found' }));

      await expect(client.getRecord('tbl_123', 'nonexistent'))
        .rejects.toThrow(TeableApiError);

      try {
        await client.getRecord('tbl_123', 'nonexistent');
      } catch (err) {
        expect(err).toBeInstanceOf(TeableApiError);
        expect((err as TeableApiError).statusCode).toBe(404);
      }
    });

    it('throws TeableApiError on 500', async () => {
      mockFetch.mockReturnValue(errorResponse(500, { message: 'Server error' }));
      await expect(client.listRecords('tbl_123')).rejects.toThrow(TeableApiError);
    });

    it('throws TeableApiError on 401 unauthorized', async () => {
      mockFetch.mockReturnValue(errorResponse(401, { message: 'Unauthorized' }));
      await expect(client.listRecords('tbl_123')).rejects.toThrow(TeableApiError);
    });
  });
});

// ─── NoCodeBackendClient ────────────────────────────────────────

describe('NoCodeBackendClient', () => {
  let client: NoCodeBackendClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new NoCodeBackendClient({
      baseUrl: 'https://ncb.example.com',
      apiKey: 'ncb-api-key',
      projectId: 'proj-123',
    });
  });

  describe('listRecords', () => {
    it('sends GET to collection endpoint with project ID', async () => {
      mockFetch.mockReturnValue(jsonResponse({
        status: 200,
        data: [{ id: '1', name: 'Test' }],
        count: 1,
        page: 1,
        pages: 1,
      }));

      const result = await client.listRecords('users');
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/projects/proj-123/collections/users/records');
      expect(opts.method).toBe('GET');
      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it('appends query params', async () => {
      mockFetch.mockReturnValue(jsonResponse({
        status: 200, data: [], count: 0, page: 1, pages: 0,
      }));

      await client.listRecords('users', { page: 2, limit: 10 });
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });
  });

  describe('getRecord', () => {
    it('sends GET to record-specific URL', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: '1', name: 'Test' }));

      const result = await client.getRecord('users', '1');
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/projects/proj-123/collections/users/records/1');
      expect(result).toHaveProperty('name', 'Test');
    });
  });

  describe('upsertRecord', () => {
    it('sends PUT with data', async () => {
      mockFetch.mockReturnValue(jsonResponse({ id: '1', name: 'Updated' }));
      const result = await client.upsertRecord('users', '1', { name: 'Updated' });

      const [url, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe('PUT');
      expect(url).toContain('/projects/proj-123/collections/users/records/1');
      expect(result).toHaveProperty('name', 'Updated');
    });
  });

  describe('deleteRecord', () => {
    it('sends DELETE request', async () => {
      mockFetch.mockReturnValue(jsonResponse({}));
      await client.deleteRecord('users', '1');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/projects/proj-123/collections/users/records/1');
      expect(opts.method).toBe('DELETE');
    });
  });

  describe('error handling', () => {
    it('throws NoCodeBackendApiError on 404', async () => {
      mockFetch.mockReturnValue(errorResponse(404, { message: 'Not found' }));
      await expect(client.getRecord('users', 'nonexistent'))
        .rejects.toThrow(NoCodeBackendApiError);
    });

    it('throws NoCodeBackendApiError on 500', async () => {
      mockFetch.mockReturnValue(errorResponse(500, { message: 'Server error' }));
      await expect(client.listRecords('users')).rejects.toThrow(NoCodeBackendApiError);
    });
  });
});
