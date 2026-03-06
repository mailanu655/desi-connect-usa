/**
 * Base Repository (Section 4.1)
 *
 * Generic typed CRUD repository that combines TeableClient (writes)
 * and NoCodeBackendClient (reads) with field mappers for type-safe
 * data access.
 *
 * Follows the 3-hop sync model:
 *   Write path:  App → TeableClient → Teable (source of truth)
 *   Read path:   App → NoCodeBackendClient → NoCodeBackend (cache)
 */

import type { TeableRecord, TeableListResponse } from '@desi-connect/shared';
import type { TeableClient, TeableQueryParams } from '../client/teable-client';
import type { NoCodeBackendClient, NoCodeBackendQueryParams } from '../client/nocodebackend-client';

export interface RepositoryConfig<TDomain, TCreate> {
  /** Teable table ID (for writes) */
  tableId: string;
  /** NoCodeBackend collection name (for reads) */
  collection: string;
  /** Convert Teable fields → domain type */
  fromFields: (id: string, fields: Record<string, unknown>) => TDomain;
  /** Convert create-input → Teable fields */
  toFields: (input: TCreate) => Record<string, unknown>;
}

/**
 * Generic repository providing typed CRUD over the dual-backend architecture.
 *
 * Reads go through NoCodeBackend (fast, cached).
 * Writes go through Teable (source of truth).
 */
export class BaseRepository<TDomain, TCreate> {
  constructor(
    protected readonly teable: TeableClient,
    protected readonly ncb: NoCodeBackendClient,
    protected readonly config: RepositoryConfig<TDomain, TCreate>,
  ) {}

  // ─── Read (NoCodeBackend cache) ───────────────────────────────

  /**
   * List records from the read cache with optional filtering.
   */
  async list(params?: NoCodeBackendQueryParams): Promise<{ data: TDomain[]; total: number }> {
    const response = await this.ncb.listRecords<Record<string, unknown>>(
      this.config.collection,
      params,
    );

    const data = (response.data ?? []).map((record: any) =>
      this.config.fromFields(record.id ?? record._id ?? '', record),
    );

    return {
      data,
      total: response.count ?? data.length,
    };
  }

  /**
   * Get a single record by ID from the read cache.
   */
  async getById(id: string): Promise<TDomain | null> {
    try {
      const record = await this.ncb.getRecord<Record<string, unknown>>(
        this.config.collection,
        id,
      );
      if (!record) return null;
      return this.config.fromFields(
        (record as any).id ?? (record as any)._id ?? id,
        record,
      );
    } catch (error: any) {
      if (error?.statusCode === 404) return null;
      throw error;
    }
  }

  // ─── Write (Teable source of truth) ───────────────────────────

  /**
   * Create a new record in Teable (source of truth).
   * The sync pipeline will propagate it to the read cache.
   */
  async create(input: TCreate): Promise<TDomain> {
    const fields = this.config.toFields(input);
    const record: TeableRecord = await this.teable.createRecord(
      this.config.tableId,
      { fields },
    );
    return this.config.fromFields(record.id, record.fields);
  }

  /**
   * Create multiple records in a single batch request.
   */
  async batchCreate(inputs: TCreate[]): Promise<TDomain[]> {
    const records = inputs.map((input) => ({
      fields: this.config.toFields(input),
    }));
    const result = await this.teable.batchCreateRecords(
      this.config.tableId,
      { records },
    );
    return result.records.map((r) =>
      this.config.fromFields(r.id, r.fields),
    );
  }

  /**
   * Update an existing record in Teable.
   */
  async update(id: string, fields: Partial<Record<string, unknown>>): Promise<TDomain> {
    const record = await this.teable.updateRecord(
      this.config.tableId,
      id,
      { fields },
    );
    return this.config.fromFields(record.id, record.fields);
  }

  /**
   * Delete a record from Teable (source of truth).
   */
  async delete(id: string): Promise<void> {
    await this.teable.deleteRecord(this.config.tableId, id);
  }

  // ─── Direct Teable reads (admin only) ─────────────────────────

  /**
   * List records directly from Teable (bypasses cache).
   * Use for admin dashboards or when fresh data is required.
   */
  async listFromSource(params?: TeableQueryParams): Promise<TDomain[]> {
    const response: TeableListResponse = await this.teable.listRecords(
      this.config.tableId,
      params,
    );
    return response.records.map((r) =>
      this.config.fromFields(r.id, r.fields),
    );
  }

  /**
   * Get a single record directly from Teable (bypasses cache).
   */
  async getByIdFromSource(id: string): Promise<TDomain | null> {
    try {
      const record = await this.teable.getRecord(this.config.tableId, id);
      return this.config.fromFields(record.id, record.fields);
    } catch (error: any) {
      if (error?.statusCode === 404) return null;
      throw error;
    }
  }
}
