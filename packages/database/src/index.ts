/**
 * @desi-connect/database — Database Package Barrel Export
 *
 * Provides the complete data access layer:
 *   - TeableClient: Write operations (source of truth)
 *   - NoCodeBackendClient: Read operations (API cache)
 *   - Field mappers: Type-safe bidirectional conversion
 *   - Repositories: Typed CRUD wrappers per entity
 */

// Clients
export { TeableClient, TeableApiError } from './client/teable-client';
export type {
  TeableClientConfig,
  TeableQueryParams,
  TeableCreatePayload,
  TeableUpdatePayload,
  TeableBatchCreatePayload,
} from './client/teable-client';

export { NoCodeBackendClient, NoCodeBackendApiError } from './client/nocodebackend-client';
export type {
  NoCodeBackendConfig,
  NoCodeBackendQueryParams,
} from './client/nocodebackend-client';

// Field Mappers
export {
  userFromFields, userToFields,
  businessFromFields, businessToFields,
  jobFromFields, jobToFields,
  newsFromFields, newsToFields,
  dealFromFields, dealToFields,
  consultancyFromFields, consultancyToFields,
  eventFromFields, eventToFields,
  reviewFromFields, reviewToFields,
} from './client/field-mappers';

// Repositories
export { BaseRepository } from './repositories/base-repository';
export type { RepositoryConfig } from './repositories/base-repository';

export { createRepositories } from './repositories';
export type {
  Repositories,
  RepositoryTableIds,
  UserRepository,
  BusinessRepository,
  JobRepository,
  NewsRepository,
  DealRepository,
  ConsultancyRepository,
  EventRepository,
  ReviewRepository,
} from './repositories';
