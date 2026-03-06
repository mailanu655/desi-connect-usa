/**
 * Entity Repositories (Section 4.1)
 *
 * Concrete repository instances for each data model.
 * Each combines the BaseRepository with entity-specific field mappers.
 */

import type {
  User, CreateUserInput,
  Business, CreateBusinessInput,
  Job, CreateJobInput,
  NewsArticle, CreateNewsInput,
  Deal, CreateDealInput,
  Consultancy, CreateConsultancyInput,
  Event, CreateEventInput,
  Review, CreateReviewInput,
} from '@desi-connect/shared';
import { TEABLE_TABLES } from '@desi-connect/shared';

import type { TeableClient } from '../client/teable-client';
import type { NoCodeBackendClient } from '../client/nocodebackend-client';
import { BaseRepository } from './base-repository';
import {
  userFromFields, userToFields,
  businessFromFields, businessToFields,
  jobFromFields, jobToFields,
  newsFromFields, newsToFields,
  dealFromFields, dealToFields,
  consultancyFromFields, consultancyToFields,
  eventFromFields, eventToFields,
  reviewFromFields, reviewToFields,
} from '../client/field-mappers';

// ─── Repository types ────────────────────────────────────────────

export type UserRepository = BaseRepository<User, CreateUserInput>;
export type BusinessRepository = BaseRepository<Business, CreateBusinessInput>;
export type JobRepository = BaseRepository<Job, CreateJobInput>;
export type NewsRepository = BaseRepository<NewsArticle, CreateNewsInput>;
export type DealRepository = BaseRepository<Deal, CreateDealInput>;
export type ConsultancyRepository = BaseRepository<Consultancy, CreateConsultancyInput>;
export type EventRepository = BaseRepository<Event, CreateEventInput>;
export type ReviewRepository = BaseRepository<Review, CreateReviewInput>;

// ─── Factory functions ───────────────────────────────────────────

export interface RepositoryTableIds {
  users: string;
  businesses: string;
  jobs: string;
  news: string;
  deals: string;
  consultancies: string;
  events: string;
  reviews: string;
}

/**
 * Creates all 8 entity repositories wired to the Teable + NoCodeBackend clients.
 *
 * @param teable - Teable REST API client (writes)
 * @param ncb    - NoCodeBackend cache client (reads)
 * @param ids    - Teable table IDs for each entity (from env vars)
 */
export function createRepositories(
  teable: TeableClient,
  ncb: NoCodeBackendClient,
  ids: RepositoryTableIds,
) {
  return {
    users: new BaseRepository<User, CreateUserInput>(teable, ncb, {
      tableId: ids.users,
      collection: TEABLE_TABLES.USERS,
      fromFields: userFromFields,
      toFields: userToFields,
    }),

    businesses: new BaseRepository<Business, CreateBusinessInput>(teable, ncb, {
      tableId: ids.businesses,
      collection: TEABLE_TABLES.BUSINESSES,
      fromFields: businessFromFields,
      toFields: businessToFields,
    }),

    jobs: new BaseRepository<Job, CreateJobInput>(teable, ncb, {
      tableId: ids.jobs,
      collection: TEABLE_TABLES.JOBS,
      fromFields: jobFromFields,
      toFields: jobToFields,
    }),

    news: new BaseRepository<NewsArticle, CreateNewsInput>(teable, ncb, {
      tableId: ids.news,
      collection: TEABLE_TABLES.NEWS,
      fromFields: newsFromFields,
      toFields: newsToFields,
    }),

    deals: new BaseRepository<Deal, CreateDealInput>(teable, ncb, {
      tableId: ids.deals,
      collection: TEABLE_TABLES.DEALS,
      fromFields: dealFromFields,
      toFields: dealToFields,
    }),

    consultancies: new BaseRepository<Consultancy, CreateConsultancyInput>(teable, ncb, {
      tableId: ids.consultancies,
      collection: TEABLE_TABLES.CONSULTANCIES,
      fromFields: consultancyFromFields,
      toFields: consultancyToFields,
    }),

    events: new BaseRepository<Event, CreateEventInput>(teable, ncb, {
      tableId: ids.events,
      collection: TEABLE_TABLES.EVENTS,
      fromFields: eventFromFields,
      toFields: eventToFields,
    }),

    reviews: new BaseRepository<Review, CreateReviewInput>(teable, ncb, {
      tableId: ids.reviews,
      collection: TEABLE_TABLES.REVIEWS,
      fromFields: reviewFromFields,
      toFields: reviewToFields,
    }),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;

export { BaseRepository } from './base-repository';
