/**
 * JSON-LD Structured Data Builders for Desi Connect USA
 *
 * Generates Schema.org structured data for rich search results.
 * Each builder returns a plain object that should be serialised
 * inside a <script type="application/ld+json"> tag.
 */

import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { canonicalUrl } from './metadata';

// ─── Shared Types ──────────────────────────────────────────

export interface WithContext {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: unknown;
}

// ─── Organisation (site-wide) ──────────────────────────────

export function buildOrganizationJsonLd(): WithContext {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL.replace(/\/$/, '')}/logo.png`,
    sameAs: [],
  };
}

// ─── WebSite (site-wide search action) ─────────────────────

export function buildWebSiteJsonLd(): WithContext {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL.replace(/\/$/, '')}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ─── BreadcrumbList ────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): WithContext {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

// ─── LocalBusiness ─────────────────────────────────────────

export interface LocalBusinessJsonLdInput {
  name: string;
  category: string;
  description?: string;
  address: {
    street?: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
  businessId: string;
  priceRange?: string;
  openingHours?: string[];
}

export function buildLocalBusinessJsonLd(input: LocalBusinessJsonLdInput): WithContext {
  const {
    name,
    category,
    description,
    address,
    phone,
    website,
    rating,
    reviewCount,
    image,
    businessId,
    priceRange,
    openingHours,
  } = input;

  const jsonLd: WithContext = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    description: description || `${name} — ${category} serving the Indian community in ${address.city}, ${address.state}.`,
    url: canonicalUrl(`/businesses/${businessId}`),
    address: {
      '@type': 'PostalAddress',
      addressLocality: address.city,
      addressRegion: address.state,
      addressCountry: 'US',
      ...(address.street && { streetAddress: address.street }),
      ...(address.zipCode && { postalCode: address.zipCode }),
    },
  };

  if (phone) jsonLd.telephone = phone;
  if (website) jsonLd.sameAs = [website];
  if (image) jsonLd.image = image;
  if (priceRange) jsonLd.priceRange = priceRange;
  if (openingHours && openingHours.length > 0) jsonLd.openingHours = openingHours;

  if (rating && reviewCount && reviewCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return jsonLd;
}

// ─── JobPosting ────────────────────────────────────────────

export interface JobPostingJsonLdInput {
  title: string;
  company: string;
  description: string;
  city: string;
  state: string;
  employmentType: string;
  datePosted: string;
  salaryRange?: string;
  isRemote?: boolean;
  jobId: string;
}

export function buildJobPostingJsonLd(input: JobPostingJsonLdInput): WithContext {
  const {
    title,
    company,
    description,
    city,
    state,
    employmentType,
    datePosted,
    salaryRange,
    isRemote,
    jobId,
  } = input;

  // Map our employment types to Schema.org values
  const schemaEmploymentType = mapEmploymentType(employmentType);

  const jsonLd: WithContext = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    url: canonicalUrl(`/jobs/${jobId}`),
    datePosted,
    employmentType: schemaEmploymentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressRegion: state,
        addressCountry: 'US',
      },
    },
  };

  if (isRemote) {
    jsonLd.jobLocationType = 'TELECOMMUTE';
  }

  if (salaryRange) {
    jsonLd.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: {
        '@type': 'QuantitativeValue',
        value: salaryRange,
        unitText: 'YEAR',
      },
    };
  }

  return jsonLd;
}

function mapEmploymentType(type: string): string {
  const mapping: Record<string, string> = {
    'full-time': 'FULL_TIME',
    'full time': 'FULL_TIME',
    fulltime: 'FULL_TIME',
    'part-time': 'PART_TIME',
    'part time': 'PART_TIME',
    parttime: 'PART_TIME',
    contract: 'CONTRACTOR',
    contractor: 'CONTRACTOR',
    intern: 'INTERN',
    internship: 'INTERN',
    temporary: 'TEMPORARY',
    temp: 'TEMPORARY',
  };
  return mapping[type.toLowerCase()] || 'FULL_TIME';
}

// ─── Event ─────────────────────────────────────────────────

export interface EventJsonLdInput {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  city: string;
  state: string;
  venue?: string;
  image?: string;
  eventId: string;
  isOnline?: boolean;
  ticketUrl?: string;
  price?: number;
}

export function buildEventJsonLd(input: EventJsonLdInput): WithContext {
  const {
    title,
    description,
    startDate,
    endDate,
    city,
    state,
    venue,
    image,
    eventId,
    isOnline,
    ticketUrl,
    price,
  } = input;

  const jsonLd: WithContext = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    url: canonicalUrl(`/events/${eventId}`),
    startDate,
    eventAttendanceMode: isOnline
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    organizer: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  if (description) jsonLd.description = description;
  if (endDate) jsonLd.endDate = endDate;
  if (image) jsonLd.image = image;

  if (isOnline) {
    jsonLd.location = {
      '@type': 'VirtualLocation',
      url: canonicalUrl(`/events/${eventId}`),
    };
  } else {
    jsonLd.location = {
      '@type': 'Place',
      name: venue || `${city}, ${state}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressRegion: state,
        addressCountry: 'US',
      },
    };
  }

  if (ticketUrl || price !== undefined) {
    jsonLd.offers = {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      ...(ticketUrl && { url: ticketUrl }),
      ...(price !== undefined && { price: price.toString(), priceCurrency: 'USD' }),
      ...(price === 0 && { price: '0', priceCurrency: 'USD' }),
    };
  }

  return jsonLd;
}

// ─── Review (for consultancies) ────────────────────────────

export interface ReviewJsonLdInput {
  consultancyName: string;
  consultancyId: string;
  rating: number;
  reviewCount: number;
}

export function buildAggregateReviewJsonLd(input: ReviewJsonLdInput): WithContext {
  const { consultancyName, consultancyId, rating, reviewCount } = input;

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: consultancyName,
    url: canonicalUrl(`/consultancies/${consultancyId}`),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

// ─── ItemList (for directory / listing pages) ──────────────

export interface ItemListJsonLdInput {
  name: string;
  description: string;
  items: Array<{ name: string; url: string }>;
}

export function buildItemListJsonLd(input: ItemListJsonLdInput): WithContext {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: input.name,
    description: input.description,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

// ─── FAQPage (for immigration / info pages) ────────────────

export interface FaqItem {
  question: string;
  answer: string;
}

export function buildFaqJsonLd(items: FaqItem[]): WithContext {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

// ─── Helper: Render to script tag ──────────────────────────

/**
 * Serialise one or more JSON-LD objects for embedding in HTML.
 * Returns the raw JSON string (caller wraps in <script> tag).
 */
export function jsonLdScriptContent(data: WithContext | WithContext[]): string {
  return JSON.stringify(Array.isArray(data) ? data : [data]);
}
