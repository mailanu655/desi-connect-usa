/**
 * SEO Metadata Generators for Desi Connect USA
 *
 * Provides type-safe helpers for generating Next.js Metadata objects
 * for all page types: businesses, jobs, deals, events, immigration,
 * consultancies, and city landing pages.
 */

import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

// ─── Shared Helpers ──────────────────────────────────────────

/**
 * Truncate a description to SEO-recommended max length (160 chars).
 * Ensures we don't cut in the middle of a word.
 */
export function truncateDescription(text: string, maxLength = 160): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const truncated = trimmed.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

/**
 * Build the canonical URL for a given path.
 */
export function canonicalUrl(path: string): string {
  const base = SITE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

// ─── Page-Level Metadata Generators ──────────────────────────

export interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
  image?: string;
}

/**
 * Base metadata generator — used by all page-specific generators.
 */
export function generatePageMetadata(input: PageMetaInput): Metadata {
  const { title, description, path, keywords, noIndex, image } = input;
  const url = canonicalUrl(path);
  const desc = truncateDescription(description);

  const metadata: Metadata = {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      title,
      description: desc,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
    },
  };

  if (keywords && keywords.length > 0) {
    metadata.keywords = keywords;
  }

  if (noIndex) {
    metadata.robots = { index: false, follow: false };
  }

  if (image) {
    (metadata.openGraph as Record<string, unknown>).images = [
      { url: image, width: 1200, height: 630, alt: title },
    ];
    (metadata.twitter as Record<string, unknown>).images = [image];
  }

  return metadata;
}

// ─── Business Directory ──────────────────────────────────────

export interface BusinessMetaInput {
  name: string;
  category: string;
  city: string;
  state: string;
  description?: string;
  businessId: string;
  image?: string;
}

export function generateBusinessMetadata(input: BusinessMetaInput): Metadata {
  const { name, category, city, state, description, businessId, image } = input;
  return generatePageMetadata({
    title: `${name} — ${category} in ${city}, ${state}`,
    description:
      description ||
      `${name} is a ${category.toLowerCase()} serving the Indian community in ${city}, ${state}. Find reviews, hours, and contact info on ${SITE_NAME}.`,
    path: `/businesses/${businessId}`,
    keywords: [
      name,
      category,
      `Indian ${category.toLowerCase()} ${city}`,
      `desi ${category.toLowerCase()} near me`,
      city,
      state,
    ],
    image,
  });
}

export function generateBusinessDirectoryMetadata(): Metadata {
  return generatePageMetadata({
    title: 'Indian Business Directory',
    description:
      'Discover trusted Indian-owned and Indian-focused businesses across the USA — restaurants, grocery stores, temples, salons, and more.',
    path: '/businesses',
    keywords: [
      'Indian businesses USA',
      'desi business directory',
      'Indian restaurants near me',
      'Indian grocery stores',
      'desi services',
    ],
  });
}

// ─── Jobs ────────────────────────────────────────────────────

export interface JobMetaInput {
  title: string;
  company: string;
  city: string;
  state: string;
  employmentType: string;
  isH1bSponsor?: boolean;
  isOptFriendly?: boolean;
  jobId: string;
}

export function generateJobMetadata(input: JobMetaInput): Metadata {
  const { title, company, city, state, employmentType, isH1bSponsor, isOptFriendly, jobId } = input;
  const tags: string[] = [];
  if (isH1bSponsor) tags.push('H-1B Sponsor');
  if (isOptFriendly) tags.push('OPT-Friendly');
  const tagStr = tags.length > 0 ? ` (${tags.join(', ')})` : '';

  return generatePageMetadata({
    title: `${title} at ${company} — ${city}, ${state}${tagStr}`,
    description: `${employmentType} ${title} position at ${company} in ${city}, ${state}.${tagStr ? ` ${tagStr}.` : ''} Apply now on ${SITE_NAME}.`,
    path: `/jobs/${jobId}`,
    keywords: [
      title,
      company,
      `${title} ${city}`,
      'Indian jobs USA',
      ...(isH1bSponsor ? ['H-1B sponsor jobs'] : []),
      ...(isOptFriendly ? ['OPT jobs'] : []),
    ],
  });
}

export function generateJobBoardMetadata(): Metadata {
  return generatePageMetadata({
    title: 'Jobs for the Indian Diaspora',
    description:
      'Find H-1B sponsor jobs, OPT-friendly positions, and career opportunities for the Indian community in the USA.',
    path: '/jobs',
    keywords: [
      'Indian jobs USA',
      'H-1B sponsor jobs',
      'OPT friendly jobs',
      'desi jobs',
      'Indian tech jobs',
    ],
  });
}

// ─── Deals ───────────────────────────────────────────────────

export interface DealMetaInput {
  title: string;
  businessName: string;
  city: string;
  state: string;
  discountType?: string;
  discountValue?: number;
  dealId: string;
}

export function generateDealMetadata(input: DealMetaInput): Metadata {
  const { title, businessName, city, state, discountType, discountValue, dealId } = input;
  let discountStr = '';
  if (discountValue) {
    discountStr =
      discountType === 'percentage' ? ` — ${discountValue}% off` : ` — $${discountValue} off`;
  }

  return generatePageMetadata({
    title: `${title}${discountStr} at ${businessName}`,
    description: `Save at ${businessName} in ${city}, ${state}${discountStr}. Exclusive deal for the Indian community on ${SITE_NAME}.`,
    path: `/deals/${dealId}`,
    keywords: [
      title,
      businessName,
      `Indian deals ${city}`,
      'desi coupons',
      'Indian store discounts',
    ],
  });
}

export function generateDealsPageMetadata(): Metadata {
  return generatePageMetadata({
    title: 'Deals & Coupons for the Indian Community',
    description:
      'Exclusive deals, coupons, and discounts from Indian businesses across the USA — restaurants, groceries, clothing, and more.',
    path: '/deals',
    keywords: [
      'Indian deals USA',
      'desi coupons',
      'Indian restaurant deals',
      'Indian grocery coupons',
    ],
  });
}

// ─── Events ──────────────────────────────────────────────────

export interface EventMetaInput {
  title: string;
  category: string;
  city: string;
  state: string;
  startDate: string;
  description?: string;
  eventId: string;
  image?: string;
}

export function generateEventMetadata(input: EventMetaInput): Metadata {
  const { title, category, city, state, startDate, description, eventId, image } = input;
  const dateStr = new Date(startDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return generatePageMetadata({
    title: `${title} — ${dateStr} in ${city}, ${state}`,
    description:
      description ||
      `Join ${title}, a ${category.toLowerCase()} event on ${dateStr} in ${city}, ${state}. RSVP on ${SITE_NAME}.`,
    path: `/events/${eventId}`,
    keywords: [
      title,
      `Indian events ${city}`,
      `desi ${category.toLowerCase()} events`,
      'Indian community events',
    ],
    image,
  });
}

export function generateEventsPageMetadata(): Metadata {
  return generatePageMetadata({
    title: 'Indian Community Events',
    description:
      'Discover Indian cultural events, festivals, meetups, and networking events near you across the USA.',
    path: '/events',
    keywords: [
      'Indian events USA',
      'desi events near me',
      'Indian festivals',
      'Indian community meetups',
    ],
  });
}

// ─── Immigration ─────────────────────────────────────────────

export function generateImmigrationMetadata(): Metadata {
  return generatePageMetadata({
    title: 'Immigration Updates & Resources',
    description:
      'Latest H-1B, EB-2, OPT, and green card updates for the Indian diaspora. Trusted immigration news, guides, and consultancy reviews.',
    path: '/immigration',
    keywords: [
      'H-1B visa updates',
      'EB-2 green card',
      'OPT news',
      'Indian immigration USA',
      'USCIS updates 2026',
      'desi immigration resources',
    ],
  });
}

// ─── Consultancies ───────────────────────────────────────────

export interface ConsultancyMetaInput {
  name: string;
  specialization: string;
  city: string;
  state: string;
  isVerified: boolean;
  consultancyId: string;
}

export function generateConsultancyMetadata(input: ConsultancyMetaInput): Metadata {
  const { name, specialization, city, state, isVerified, consultancyId } = input;
  const verified = isVerified ? ' (Verified)' : '';

  return generatePageMetadata({
    title: `${name}${verified} — ${specialization} in ${city}, ${state}`,
    description: `${name} specializes in ${specialization.toLowerCase()} for the Indian community in ${city}, ${state}. Read reviews and ratings on ${SITE_NAME}.`,
    path: `/consultancies/${consultancyId}`,
    keywords: [
      name,
      specialization,
      `Indian ${specialization.toLowerCase()} ${city}`,
      'desi consultancy reviews',
    ],
  });
}

export function generateConsultancyDirectoryMetadata(): Metadata {
  return generatePageMetadata({
    title: 'Immigration Consultancy Reviews',
    description:
      'Find verified immigration consultancies with community reviews and fraud alerts. Make informed decisions about your immigration journey.',
    path: '/consultancies',
    keywords: [
      'immigration consultancy reviews',
      'Indian immigration consultants',
      'desi consultancy fraud alerts',
      'H-1B consultants',
    ],
  });
}

// ─── City Landing Pages ──────────────────────────────────────

export interface CityMetaInput {
  city: string;
  state: string;
  slug: string;
  stateSlug: string;
  businessCount?: number;
  eventCount?: number;
}

export function generateCityMetadata(input: CityMetaInput): Metadata {
  const { city, state, slug, stateSlug, businessCount, eventCount } = input;
  const stats: string[] = [];
  if (businessCount) stats.push(`${businessCount} businesses`);
  if (eventCount) stats.push(`${eventCount} events`);
  const statsStr = stats.length > 0 ? ` Explore ${stats.join(' and ')}.` : '';

  return generatePageMetadata({
    title: `Indian Community in ${city}, ${state}`,
    description: `Your hub for the Indian diaspora in ${city}, ${state} — businesses, jobs, events, deals, and immigration resources.${statsStr}`,
    path: `/cities/${stateSlug}/${slug}`,
    keywords: [
      `Indian community ${city}`,
      `desi ${city}`,
      `Indian restaurants ${city}`,
      `Indian events ${city}`,
      `Indian businesses ${city} ${state}`,
    ],
  });
}

export function generateCitiesIndexMetadata(): Metadata {
  return generatePageMetadata({
    title: 'Indian Communities by City',
    description:
      'Explore the Indian diaspora across the USA — find businesses, events, jobs, and resources in your city.',
    path: '/cities',
    keywords: [
      'Indian community USA',
      'desi communities',
      'Indian diaspora cities',
      'Indian Americans by city',
    ],
  });
}
