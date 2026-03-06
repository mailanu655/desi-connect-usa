/**
 * BaseRepository Tests
 *
 * Tests the generic repository pattern that combines:
 * - TeableClient (writes) — source of truth
 * - NoCodeBackendClient (reads) — cached data
 * - Field mappers — type-safe conversion
 *
 * Uses mocked clients to test repository logic in isolation.
 */

import { BaseRepository } from '../../../packages/database/src/repositories/base-repository';

// ─── Mock types ─────────────────────────────────────────────────

interface TestEntity {
  id: string;
  name: string;
  status: string;
}

interface CreateTestInput {
  name: string;
  status?: string;
}

// ─── Mock mappers ───────────────────────────────────────────────

function testFromFields(id: string, fields: Record<string, unknown>): TestEntity {
  return {
    id,
    name: String(fields.name ?? ''),
    status: String(fields.status ?? 'active'),
  };
}

function testToFields(input: CreateTestInput): Record<string, unknown> {
  const fields: Record<string, unknown> = { name: input.name };
  if (input.status !== undefined) fields.status = input.status;
  return fields;
}

// ─── Mock clients ───────────────────────────────────────────────

function createMockTeableClient() {
  return {
    listRecords: jest.fn(),
    getRecord: jest.fn(),
    createRecord: jest.fn(),
    batchCreateRecords: jest.fn(),
    updateRecord: jest.fn(),
    deleteRecord: jest.fn(),
  };
}

function createMockNcbClient() {
  return {
    listRecords: jest.fn(),
    getRecord: jest.fn(),
    upsertRecord: jest.fn(),
    deleteRecord: jest.fn(),
  };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('BaseRepository', () => {
  let teable: ReturnType<typeof createMockTeableClient>;
  let ncb: ReturnType<typeof createMockNcbClient>;
  let repo: BaseRepository<TestEntity, CreateTestInput>;

  beforeEach(() => {
    teable = createMockTeableClient();
    ncb = createMockNcbClient();
    repo = new BaseRepository(teable as any, ncb as any, {
      tableId: 'tbl_test',
      collection: 'tests',
      fromFields: testFromFields,
      toFields: testToFields,
    });
  });

  // ─── Read operations (NoCodeBackend) ────────────────────────

  describe('list()', () => {
    it('fetches from NoCodeBackend and maps results', async () => {
      ncb.listRecords.mockResolvedValue({
        data: [
          { id: '1', name: 'First', status: 'active' },
          { id: '2', name: 'Second', status: 'pending' },
        ],
        count: 2,
        page: 1,
        pages: 1,
      });

      const result = await repo.list();
      expect(ncb.listRecords).toHaveBeenCalledWith('tests', undefined);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('First');
      expect(result.data[1].name).toBe('Second');
      expect(result.total).toBe(2);
    });

    it('passes query params through to NCB', async () => {
      ncb.listRecords.mockResolvedValue({ data: [], count: 0 });
      await repo.list({ page: 2, limit: 10 });
      expect(ncb.listRecords).toHaveBeenCalledWith('tests', { page: 2, limit: 10 });
    });

    it('falls back to data.length when count is missing', async () => {
      ncb.listRecords.mockResolvedValue({
        data: [{ id: '1', name: 'Only' }],
      });
      const result = await repo.list();
      expect(result.total).toBe(1);
    });

    it('handles empty response', async () => {
      ncb.listRecords.mockResolvedValue({ data: [], count: 0 });
      const result = await repo.list();
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('handles missing data array', async () => {
      ncb.listRecords.mockResolvedValue({});
      const result = await repo.list();
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('uses _id fallback when id is missing', async () => {
      ncb.listRecords.mockResolvedValue({
        data: [{ _id: 'mongo-1', name: 'Test' }],
        count: 1,
      });
      const result = await repo.list();
      expect(result.data[0].id).toBe('mongo-1');
    });
  });

  describe('getById()', () => {
    it('fetches single record from NoCodeBackend', async () => {
      ncb.getRecord.mockResolvedValue({ id: '1', name: 'Test', status: 'active' });
      const result = await repo.getById('1');
      expect(ncb.getRecord).toHaveBeenCalledWith('tests', '1');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Test');
    });

    it('returns null when record not found (null response)', async () => {
      ncb.getRecord.mockResolvedValue(null);
      const result = await repo.getById('nonexistent');
      expect(result).toBeNull();
    });

    it('returns null on 404 error', async () => {
      ncb.getRecord.mockRejectedValue({ statusCode: 404 });
      const result = await repo.getById('nonexistent');
      expect(result).toBeNull();
    });

    it('throws on non-404 errors', async () => {
      ncb.getRecord.mockRejectedValue(new Error('Server error'));
      await expect(repo.getById('1')).rejects.toThrow('Server error');
    });
  });

  // ─── Write operations (Teable) ──────────────────────────────

  describe('create()', () => {
    it('creates record via Teable and returns mapped entity', async () => {
      teable.createRecord.mockResolvedValue({
        id: 'rec-new',
        fields: { name: 'New Entity', status: 'active' },
      });

      const result = await repo.create({ name: 'New Entity' });
      expect(teable.createRecord).toHaveBeenCalledWith('tbl_test', {
        fields: { name: 'New Entity' },
      });
      expect(result.id).toBe('rec-new');
      expect(result.name).toBe('New Entity');
    });

    it('includes optional fields in create payload', async () => {
      teable.createRecord.mockResolvedValue({
        id: 'rec-new',
        fields: { name: 'Test', status: 'pending' },
      });

      await repo.create({ name: 'Test', status: 'pending' });
      const call = teable.createRecord.mock.calls[0];
      expect(call[1].fields.status).toBe('pending');
    });
  });

  describe('batchCreate()', () => {
    it('creates multiple records in one call', async () => {
      teable.batchCreateRecords.mockResolvedValue({
        records: [
          { id: 'rec-1', fields: { name: 'A' } },
          { id: 'rec-2', fields: { name: 'B' } },
        ],
      });

      const result = await repo.batchCreate([
        { name: 'A' },
        { name: 'B' },
      ]);

      expect(teable.batchCreateRecords).toHaveBeenCalledWith('tbl_test', {
        records: [
          { fields: { name: 'A' } },
          { fields: { name: 'B' } },
        ],
      });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('A');
      expect(result[1].name).toBe('B');
    });
  });

  describe('update()', () => {
    it('updates record via Teable', async () => {
      teable.updateRecord.mockResolvedValue({
        id: 'rec-1',
        fields: { name: 'Updated', status: 'active' },
      });

      const result = await repo.update('rec-1', { name: 'Updated' });
      expect(teable.updateRecord).toHaveBeenCalledWith('tbl_test', 'rec-1', {
        fields: { name: 'Updated' },
      });
      expect(result.name).toBe('Updated');
    });
  });

  describe('delete()', () => {
    it('deletes record via Teable', async () => {
      teable.deleteRecord.mockResolvedValue(undefined);
      await repo.delete('rec-1');
      expect(teable.deleteRecord).toHaveBeenCalledWith('tbl_test', 'rec-1');
    });
  });

  // ─── Direct Teable reads ────────────────────────────────────

  describe('listFromSource()', () => {
    it('fetches directly from Teable (bypasses cache)', async () => {
      teable.listRecords.mockResolvedValue({
        records: [{ id: 'rec-1', fields: { name: 'Direct', status: 'active' } }],
      });

      const result = await repo.listFromSource();
      expect(teable.listRecords).toHaveBeenCalledWith('tbl_test', undefined);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Direct');
    });

    it('passes query params to Teable', async () => {
      teable.listRecords.mockResolvedValue({ records: [] });
      await repo.listFromSource({ filter: 'status=active' });
      expect(teable.listRecords).toHaveBeenCalledWith('tbl_test', { filter: 'status=active' });
    });
  });

  describe('getByIdFromSource()', () => {
    it('fetches single record directly from Teable', async () => {
      teable.getRecord.mockResolvedValue({
        id: 'rec-1',
        fields: { name: 'Direct', status: 'active' },
      });

      const result = await repo.getByIdFromSource('rec-1');
      expect(teable.getRecord).toHaveBeenCalledWith('tbl_test', 'rec-1');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Direct');
    });

    it('returns null on 404', async () => {
      teable.getRecord.mockRejectedValue({ statusCode: 404 });
      const result = await repo.getByIdFromSource('nonexistent');
      expect(result).toBeNull();
    });

    it('throws on non-404 errors', async () => {
      teable.getRecord.mockRejectedValue(new Error('Connection failed'));
      await expect(repo.getByIdFromSource('rec-1')).rejects.toThrow('Connection failed');
    });
  });

  // ─── Write → Read integration ──────────────────────────────

  describe('Dual-backend architecture validation', () => {
    it('reads use NCB, writes use Teable — never cross', async () => {
      // Read
      ncb.listRecords.mockResolvedValue({ data: [], count: 0 });
      await repo.list();
      expect(ncb.listRecords).toHaveBeenCalled();
      expect(teable.listRecords).not.toHaveBeenCalled();

      // Write
      teable.createRecord.mockResolvedValue({ id: 'new', fields: { name: 'x' } });
      await repo.create({ name: 'x' });
      expect(teable.createRecord).toHaveBeenCalled();
      expect(ncb.upsertRecord).not.toHaveBeenCalled();
    });

    it('listFromSource bypasses NCB and uses Teable directly', async () => {
      teable.listRecords.mockResolvedValue({ records: [] });
      await repo.listFromSource();
      expect(teable.listRecords).toHaveBeenCalled();
      expect(ncb.listRecords).not.toHaveBeenCalled();
    });
  });
});
