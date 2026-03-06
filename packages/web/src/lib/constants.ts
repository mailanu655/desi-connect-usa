/**
 * Website constants for Desi Connect USA
 */

export const SITE_NAME = 'Desi Connect USA';
export const SITE_DESCRIPTION =
  'The #1 hub for the Indian diaspora in America — community news, business directory, jobs, immigration updates, and deals.';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://desiconnectusa.com';

export const METRO_AREAS = [
  { slug: 'nyc', name: 'New York City', state: 'NY' },
  { slug: 'bay-area', name: 'Bay Area', state: 'CA' },
  { slug: 'dallas', name: 'Dallas-Fort Worth', state: 'TX' },
  { slug: 'chicago', name: 'Chicago', state: 'IL' },
  { slug: 'atlanta', name: 'Atlanta', state: 'GA' },
  { slug: 'houston', name: 'Houston', state: 'TX' },
  { slug: 'seattle', name: 'Seattle', state: 'WA' },
  { slug: 'los-angeles', name: 'Los Angeles', state: 'CA' },
  { slug: 'new-jersey', name: 'New Jersey', state: 'NJ' },
  { slug: 'dc', name: 'Washington DC', state: 'DC' },
] as const;

export const BUSINESS_CATEGORIES = [
  { value: 'restaurant', label: 'Restaurants', icon: '🍛' },
  { value: 'grocery', label: 'Grocery Stores', icon: '🛒' },
  { value: 'temple', label: 'Temples & Religious', icon: '🛕' },
  { value: 'salon', label: 'Salons & Beauty', icon: '💇' },
  { value: 'clothing', label: 'Clothing & Jewelry', icon: '👗' },
  { value: 'jewelry', label: 'Jewelry', icon: '💍' },
  { value: 'medical', label: 'Medical & Health', icon: '🏥' },
  { value: 'legal', label: 'Legal Services', icon: '⚖️' },
  { value: 'tax_accounting', label: 'Tax & Accounting', icon: '📊' },
  { value: 'real_estate', label: 'Real Estate', icon: '🏠' },
  { value: 'travel', label: 'Travel Agencies', icon: '✈️' },
  { value: 'education', label: 'Education & Tutoring', icon: '📚' },
  { value: 'other', label: 'Other', icon: '📌' },
] as const;

export const NEWS_CATEGORIES = [
  { value: 'immigration', label: 'Immigration', color: 'blue' },
  { value: 'community', label: 'Community', color: 'green' },
  { value: 'business', label: 'Business', color: 'amber' },
  { value: 'technology', label: 'Technology', color: 'purple' },
  { value: 'lifestyle', label: 'Lifestyle', color: 'pink' },
  { value: 'events', label: 'Events', color: 'orange' },
  { value: 'deals', label: 'Deals', color: 'red' },
  { value: 'politics', label: 'Politics', color: 'gray' },
] as const;

export const JOB_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
] as const;

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/businesses', label: 'Directory' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/news', label: 'News' },
  { href: '/immigration', label: 'Immigration' },
  { href: '/deals', label: 'Deals' },
  { href: '/events', label: 'Events' },
] as const;

export const WHATSAPP_BOT_URL = 'https://wa.me/1234567890?text=Hi';
export const DEFAULT_PAGE_SIZE = 20;
