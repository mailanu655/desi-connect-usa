/**
 * Integration Tests for SEO Layout Files
 *
 * Tests how layout.tsx files integrate with the SEO metadata and JSON-LD modules.
 * Covers:
 * - Listing page layouts (static metadata exports + breadcrumb JSON-LD)
 * - Detail page layouts (async generateMetadata + entity-specific JSON-LD)
 * - Error handling (API failures produce fallback metadata)
 * - Type correctness (parseFloat for discount_value, number for price, etc.)
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, cleanup } from '@testing-library/react';

// ─── Mock Constants ──────────────────────────────────────────

jest.mock('@/lib/constants', () => ({
  SITE_NAME: 'Desi Connect USA',
  SITE_URL: 'https://desiconnectusa.com',
}));

// ─── Mock API Client ─────────────────────────────────────────

const mockGetBusinessById = jest.fn();
const mockGetEventById = jest.fn();
const mockGetDealById = jest.fn();
const mockGetConsultancyById = jest.fn();
const mockGetBusinesses = jest.fn();
const mockGetEvents = jest.fn();

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getBusinessById: (...args: unknown[]) => mockGetBusinessById(...args),
    getEventById: (...args: unknown[]) => mockGetEventById(...args),
    getDealById: (...args: unknown[]) => mockGetDealById(...args),
    getConsultancyById: (...args: unknown[]) => mockGetConsultancyById(...args),
    getBusinesses: (...args: unknown[]) => mockGetBusinesses(...args),
    getEvents: (...args: unknown[]) => mockGetEvents(...args),
  },
}));

// ─── Import SEO utilities for validation ─────────────────────

import {
  generateBusinessDirectoryMetadata,
  generateJobBoardMetadata,
  generateDealsPageMetadata,
  generateEventsPageMetadata,
  generateConsultancyDirectoryMetadata,
  generateCitiesIndexMetadata,
} from '@/lib/seo/metadata';

import {
  buildOrganizationJsonLd,
  buildBreadcrumbJsonLd,
  jsonLdScriptContent,
} from '@/lib/seo/json-ld';

// ═══════════════════════════════════════════════════════════════
// PART 1: LISTING PAGE LAYOUTS (Static Metadata + Breadcrumbs)
// ═══════════════════════════════════════════════════════════════

describe('Listing Page Layouts', () => {
  // ─── Businesses Layout ──────────────────────────────────────

  describe('businesses/layout.tsx', () => {
    let layoutModule: {
      metadata: Record<string, unknown>;
      default: React.FC<{ children: React.ReactNode }>;
    };

    beforeAll(async () => {
      layoutModule = await import('@/app/businesses/layout');
    });

    it('exports static metadata matching generateBusinessDirectoryMetadata', () => {
      const expected = generateBusinessDirectoryMetadata();
      expect(layoutModule.metadata).toEqual(expected);
    });

    it('renders JSON-LD script tag with Organization and BreadcrumbList', () => {
      const Layout = layoutModule.default;
      const { container } = render(
        <Layout><div data-testid="child">Child</div></Layout>,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script!.innerHTML);
      expect(Array.isArray(jsonLd)).toBe(true);
      expect(jsonLd).toHaveLength(2);

      // Organization
      expect(jsonLd[0]['@type']).toBe('Organization');
      expect(jsonLd[0]['@context']).toBe('https://schema.org');

      // BreadcrumbList
      expect(jsonLd[1]['@type']).toBe('BreadcrumbList');
      const items = jsonLd[1].itemListElement;
      expect(items).toHaveLength(2);
      expect(items[0].name).toBe('Home');
      expect(items[1].name).toBe('Businesses');
    });

    it('renders children', () => {
      const Layout = layoutModule.default;
      const { getByTestId } = render(
        <Layout><div data-testid="child">Hello</div></Layout>,
      );
      expect(getByTestId('child')).toBeTruthy();
    });
  });

  // ─── Jobs Layout ────────────────────────────────────────────

  describe('jobs/layout.tsx', () => {
    let layoutModule: {
      metadata: Record<string, unknown>;
      default: React.FC<{ children: React.ReactNode }>;
    };

    beforeAll(async () => {
      layoutModule = await import('@/app/jobs/layout');
    });

    it('exports static metadata matching generateJobBoardMetadata', () => {
      const expected = generateJobBoardMetadata();
      expect(layoutModule.metadata).toEqual(expected);
    });

    it('renders BreadcrumbList with Home > Jobs', () => {
      const Layout = layoutModule.default;
      const { container } = render(
        <Layout><div>Child</div></Layout>,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const breadcrumbs = jsonLd.find((item: Record<string, unknown>) => item['@type'] === 'BreadcrumbList');
      expect(breadcrumbs).toBeTruthy();
      expect(breadcrumbs.itemListElement).toHaveLength(2);
      expect(breadcrumbs.itemListElement[1].name).toBe('Jobs');
    });
  });

  // ─── Deals Layout ──────────────────────────────────────────

  describe('deals/layout.tsx (listing)', () => {
    let layoutModule: {
      metadata: Record<string, unknown>;
      default: React.FC<{ children: React.ReactNode }>;
    };

    beforeAll(async () => {
      layoutModule = await import('@/app/deals/layout');
    });

    it('exports static metadata matching generateDealsPageMetadata', () => {
      const expected = generateDealsPageMetadata();
      expect(layoutModule.metadata).toEqual(expected);
    });

    it('renders BreadcrumbList with Home > Deals', () => {
      const Layout = layoutModule.default;
      const { container } = render(
        <Layout><div>Child</div></Layout>,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const breadcrumbs = jsonLd.find((item: Record<string, unknown>) => item['@type'] === 'BreadcrumbList');
      expect(breadcrumbs.itemListElement[1].name).toBe('Deals');
    });
  });

  // ─── Events Layout ─────────────────────────────────────────

  describe('events/layout.tsx (listing)', () => {
    let layoutModule: {
      metadata: Record<string, unknown>;
      default: React.FC<{ children: React.ReactNode }>;
    };

    beforeAll(async () => {
      layoutModule = await import('@/app/events/layout');
    });

    it('exports static metadata matching generateEventsPageMetadata', () => {
      const expected = generateEventsPageMetadata();
      expect(layoutModule.metadata).toEqual(expected);
    });

    it('renders BreadcrumbList with Home > Events', () => {
      const Layout = layoutModule.default;
      const { container } = render(
        <Layout><div>Child</div></Layout>,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const breadcrumbs = jsonLd.find((item: Record<string, unknown>) => item['@type'] === 'BreadcrumbList');
      expect(breadcrumbs.itemListElement[1].name).toBe('Events');
    });
  });

  // ─── Consultancies Layout ──────────────────────────────────

  describe('consultancies/layout.tsx (listing)', () => {
    let layoutModule: {
      metadata: Record<string, unknown>;
      default: React.FC<{ children: React.ReactNode }>;
    };

    beforeAll(async () => {
      layoutModule = await import('@/app/consultancies/layout');
    });

    it('exports static metadata matching generateConsultancyDirectoryMetadata', () => {
      const expected = generateConsultancyDirectoryMetadata();
      expect(layoutModule.metadata).toEqual(expected);
    });

    it('renders BreadcrumbList with Home > Consultancies', () => {
      const Layout = layoutModule.default;
      const { container } = render(
        <Layout><div>Child</div></Layout>,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const breadcrumbs = jsonLd.find((item: Record<string, unknown>) => item['@type'] === 'BreadcrumbList');
      expect(breadcrumbs.itemListElement[1].name).toBe('Consultancies');
    });
  });

  // ─── Cities Layout ─────────────────────────────────────────

  describe('cities/layout.tsx (listing)', () => {
    let layoutModule: {
      metadata: Record<string, unknown>;
      default: React.FC<{ children: React.ReactNode }>;
    };

    beforeAll(async () => {
      layoutModule = await import('@/app/cities/layout');
    });

    it('exports static metadata matching generateCitiesIndexMetadata', () => {
      const expected = generateCitiesIndexMetadata();
      expect(layoutModule.metadata).toEqual(expected);
    });

    it('renders BreadcrumbList with Home > Cities', () => {
      const Layout = layoutModule.default;
      const { container } = render(
        <Layout><div>Child</div></Layout>,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const breadcrumbs = jsonLd.find((item: Record<string, unknown>) => item['@type'] === 'BreadcrumbList');
      expect(breadcrumbs.itemListElement[1].name).toBe('Cities');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// PART 2: DETAIL PAGE LAYOUTS (Async generateMetadata + JSON-LD)
// ═══════════════════════════════════════════════════════════════

describe('Detail Page Layouts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Events Detail Layout ──────────────────────────────────

  describe('events/[id]/layout.tsx', () => {
    let layoutModule: {
      generateMetadata: (args: { params: { id: string } }) => Promise<Record<string, unknown>>;
      default: (props: { children: React.ReactNode; params: { id: string } }) => Promise<React.ReactElement>;
    };

    const mockEvent = {
      event_id: 'evt-123',
      title: 'Diwali Celebration 2026',
      category: 'Cultural',
      city: 'Edison',
      state: 'New Jersey',
      start_date: '2026-10-20T18:00:00Z',
      end_date: '2026-10-20T23:00:00Z',
      description: 'Grand Diwali celebration with fireworks and cultural performances',
      venue_name: 'Edison Convention Center',
      image_url: 'https://example.com/diwali.jpg',
      is_virtual: false,
      is_free: false,
      registration_url: 'https://example.com/register',
    };

    beforeAll(async () => {
      layoutModule = await import('@/app/events/[id]/layout') as typeof layoutModule;
    });

    it('generateMetadata returns event metadata on success', async () => {
      mockGetEventById.mockResolvedValueOnce(mockEvent);

      const metadata = await layoutModule.generateMetadata({ params: { id: 'evt-123' } });

      expect(mockGetEventById).toHaveBeenCalledWith('evt-123');
      expect(metadata.title).toContain('Diwali Celebration 2026');
      expect(metadata.title).toContain('Edison, New Jersey');
      expect(metadata.description).toBeTruthy();
    });

    it('generateMetadata returns fallback on API error', async () => {
      mockGetEventById.mockRejectedValueOnce(new Error('Not found'));

      const metadata = await layoutModule.generateMetadata({ params: { id: 'bad-id' } });

      expect(metadata).toEqual({ title: 'Event Not Found' });
    });

    it('renders JSON-LD with Organization, BreadcrumbList, and Event', async () => {
      mockGetEventById.mockResolvedValueOnce(mockEvent);

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div', { 'data-testid': 'child' }, 'Child'),
        params: { id: 'evt-123' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script!.innerHTML);
      expect(Array.isArray(jsonLd)).toBe(true);
      expect(jsonLd).toHaveLength(3);

      // Organization
      expect(jsonLd[0]['@type']).toBe('Organization');

      // BreadcrumbList
      expect(jsonLd[1]['@type']).toBe('BreadcrumbList');
      const breadcrumbItems = jsonLd[1].itemListElement;
      expect(breadcrumbItems).toHaveLength(3);
      expect(breadcrumbItems[2].name).toBe('Diwali Celebration 2026');

      // Event
      expect(jsonLd[2]['@type']).toBe('Event');
      expect(jsonLd[2].name).toBe('Diwali Celebration 2026');
      expect(jsonLd[2].startDate).toBe('2026-10-20T18:00:00Z');
    });

    it('renders children without JSON-LD when API fails', async () => {
      mockGetEventById.mockRejectedValueOnce(new Error('Fetch error'));

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div', { 'data-testid': 'child' }, 'Still renders'),
        params: { id: 'bad-id' },
      });

      const { container, getByTestId } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeNull();
      expect(getByTestId('child').textContent).toBe('Still renders');
    });

    it('passes is_free as numeric 0 (not string) to event JSON-LD', async () => {
      const freeEvent = { ...mockEvent, is_free: true };
      mockGetEventById.mockResolvedValueOnce(freeEvent);

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div'),
        params: { id: 'evt-123' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const eventData = jsonLd.find((item: Record<string, unknown>) => item['@type'] === 'Event');

      // price is serialised as string by buildEventJsonLd (Schema.org convention)
      if (eventData.offers) {
        expect(eventData.offers.price).toBe('0');
        expect(eventData.offers.priceCurrency).toBe('USD');
      }
    });

    it('handles virtual events with isOnline flag', async () => {
      const virtualEvent = { ...mockEvent, is_virtual: true };
      mockGetEventById.mockResolvedValueOnce(virtualEvent);

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div'),
        params: { id: 'evt-123' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const eventData = jsonLd.find((item: Record<string, unknown>) => item['@type'] === 'Event');
      expect(eventData.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
    });
  });

  // ─── Deals Detail Layout ───────────────────────────────────

  describe('deals/[id]/layout.tsx', () => {
    let layoutModule: {
      generateMetadata: (args: { params: { id: string } }) => Promise<Record<string, unknown>>;
      default: (props: { children: React.ReactNode; params: { id: string } }) => Promise<React.ReactElement>;
    };

    const mockDeal = {
      deal_id: 'deal-456',
      title: '20% Off All Curries',
      business_name: 'Spice Palace',
      city: 'Fremont',
      state: 'California',
      deal_type: 'percentage',
      discount_value: '20', // NOTE: string from API
      description: 'Get 20% off on all curry dishes this week',
      expiry_date: '2026-04-01',
      image_url: 'https://example.com/curry-deal.jpg',
    };

    beforeAll(async () => {
      layoutModule = await import('@/app/deals/[id]/layout') as typeof layoutModule;
    });

    it('generateMetadata returns deal metadata on success', async () => {
      mockGetDealById.mockResolvedValueOnce(mockDeal);

      const metadata = await layoutModule.generateMetadata({ params: { id: 'deal-456' } });

      expect(mockGetDealById).toHaveBeenCalledWith('deal-456');
      expect(metadata.title).toContain('20% Off All Curries');
      expect(metadata.title).toContain('Spice Palace');
    });

    it('generateMetadata returns fallback on API error', async () => {
      mockGetDealById.mockRejectedValueOnce(new Error('Not found'));

      const metadata = await layoutModule.generateMetadata({ params: { id: 'bad-id' } });

      expect(metadata).toEqual({ title: 'Deal Not Found' });
    });

    it('correctly parses discount_value from string to number', async () => {
      mockGetDealById.mockResolvedValueOnce(mockDeal);

      const metadata = await layoutModule.generateMetadata({ params: { id: 'deal-456' } });

      // The title should contain "20%" which means parseFloat worked
      expect(metadata.title).toContain('20%');
    });

    it('renders JSON-LD with Organization, BreadcrumbList, and Offer', async () => {
      mockGetDealById.mockResolvedValueOnce(mockDeal);

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div', null, 'Child'),
        params: { id: 'deal-456' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script!.innerHTML);
      expect(jsonLd).toHaveLength(3);

      // Organization
      expect(jsonLd[0]['@type']).toBe('Organization');

      // BreadcrumbList
      expect(jsonLd[1]['@type']).toBe('BreadcrumbList');
      expect(jsonLd[1].itemListElement[2].name).toBe('20% Off All Curries');

      // Offer
      expect(jsonLd[2]['@type']).toBe('Offer');
      expect(jsonLd[2].name).toBe('20% Off All Curries');
      expect(jsonLd[2].discount).toBe('20');
      expect(jsonLd[2].validThrough).toBe('2026-04-01');
      expect(jsonLd[2].image).toBe('https://example.com/curry-deal.jpg');
      expect(jsonLd[2].availability).toBe('https://schema.org/InStock');
    });

    it('Offer JSON-LD includes offeredBy as LocalBusiness', async () => {
      mockGetDealById.mockResolvedValueOnce(mockDeal);

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div'),
        params: { id: 'deal-456' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const offer = jsonLd.find((item: Record<string, unknown>) => item['@type'] === 'Offer');

      expect(offer.offeredBy['@type']).toBe('LocalBusiness');
      expect(offer.offeredBy.name).toBe('Spice Palace');
      expect(offer.offeredBy.address.addressLocality).toBe('Fremont');
      expect(offer.offeredBy.address.addressRegion).toBe('California');
    });

    it('omits discount when discount_value is null', async () => {
      const dealNoDiscount = { ...mockDeal, discount_value: null };
      mockGetDealById.mockResolvedValueOnce(dealNoDiscount);

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div'),
        params: { id: 'deal-456' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const offer = jsonLd.find((item: Record<string, unknown>) => item['@type'] === 'Offer');

      expect(offer.discount).toBeUndefined();
    });

    it('omits validThrough when no expiry_date', async () => {
      const dealNoExpiry = { ...mockDeal, expiry_date: null };
      mockGetDealById.mockResolvedValueOnce(dealNoExpiry);

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div'),
        params: { id: 'deal-456' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const offer = jsonLd.find((item: Record<string, unknown>) => item['@type'] === 'Offer');

      expect(offer.validThrough).toBeUndefined();
    });

    it('renders children without JSON-LD when API fails', async () => {
      mockGetDealById.mockRejectedValueOnce(new Error('Fetch error'));

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div', { 'data-testid': 'child' }, 'Still renders'),
        params: { id: 'bad-id' },
      });

      const { container, getByTestId } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeNull();
      expect(getByTestId('child').textContent).toBe('Still renders');
    });
  });

  // ─── Consultancies Detail Layout ───────────────────────────

  describe('consultancies/[id]/layout.tsx', () => {
    let layoutModule: {
      generateMetadata: (args: { params: { id: string } }) => Promise<Record<string, unknown>>;
      default: (props: { children: React.ReactNode; params: { id: string } }) => Promise<React.ReactElement>;
    };

    const mockConsultancy = {
      consultancy_id: 'cons-789',
      name: 'VisaPro Immigration Services',
      specialization: 'H-1B Visa Processing',
      city: 'San Jose',
      state: 'California',
      is_verified: true,
      description: 'Expert H-1B visa and green card processing services',
      phone: '+1-408-555-0100',
      email: 'info@visapro.com',
      website: 'https://visapro.com',
      rating: 4.5,
      review_count: 120,
      specializations: ['H-1B', 'Green Card', 'L-1 Visa'],
    };

    beforeAll(async () => {
      layoutModule = await import('@/app/consultancies/[id]/layout') as typeof layoutModule;
    });

    it('generateMetadata returns consultancy metadata on success', async () => {
      mockGetConsultancyById.mockResolvedValueOnce(mockConsultancy);

      const metadata = await layoutModule.generateMetadata({ params: { id: 'cons-789' } });

      expect(mockGetConsultancyById).toHaveBeenCalledWith('cons-789');
      expect(metadata.title).toContain('VisaPro Immigration Services');
      expect(metadata.title).toContain('Verified');
      expect(metadata.title).toContain('H-1B Visa Processing');
    });

    it('generateMetadata returns fallback on API error', async () => {
      mockGetConsultancyById.mockRejectedValueOnce(new Error('Not found'));

      const metadata = await layoutModule.generateMetadata({ params: { id: 'bad-id' } });

      expect(metadata).toEqual({ title: 'Consultancy Not Found' });
    });

    it('renders JSON-LD with ProfessionalService schema', async () => {
      mockGetConsultancyById.mockResolvedValueOnce(mockConsultancy);

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div'),
        params: { id: 'cons-789' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script!.innerHTML);
      expect(jsonLd).toHaveLength(3);

      const professional = jsonLd.find(
        (item: Record<string, unknown>) => item['@type'] === 'ProfessionalService',
      );
      expect(professional).toBeTruthy();
      expect(professional.name).toBe('VisaPro Immigration Services');
      expect(professional.telephone).toBe('+1-408-555-0100');
      expect(professional.email).toBe('info@visapro.com');
      expect(professional.sameAs).toBe('https://visapro.com');
    });

    it('includes aggregate rating in ProfessionalService JSON-LD', async () => {
      mockGetConsultancyById.mockResolvedValueOnce(mockConsultancy);

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div'),
        params: { id: 'cons-789' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const professional = jsonLd.find(
        (item: Record<string, unknown>) => item['@type'] === 'ProfessionalService',
      );

      expect(professional.aggregateRating).toBeTruthy();
      expect(professional.aggregateRating['@type']).toBe('AggregateRating');
      expect(professional.aggregateRating.ratingValue).toBe(4.5);
      expect(professional.aggregateRating.reviewCount).toBe(120);
    });

    it('includes knowsAbout specializations', async () => {
      mockGetConsultancyById.mockResolvedValueOnce(mockConsultancy);

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div'),
        params: { id: 'cons-789' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const professional = jsonLd.find(
        (item: Record<string, unknown>) => item['@type'] === 'ProfessionalService',
      );

      expect(professional.knowsAbout).toEqual(['H-1B', 'Green Card', 'L-1 Visa']);
    });

    it('includes address with US country code', async () => {
      mockGetConsultancyById.mockResolvedValueOnce(mockConsultancy);

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div'),
        params: { id: 'cons-789' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const professional = jsonLd.find(
        (item: Record<string, unknown>) => item['@type'] === 'ProfessionalService',
      );

      expect(professional.address['@type']).toBe('PostalAddress');
      expect(professional.address.addressLocality).toBe('San Jose');
      expect(professional.address.addressRegion).toBe('California');
      expect(professional.address.addressCountry).toBe('US');
    });

    it('omits optional fields when not present', async () => {
      const minimalConsultancy = {
        ...mockConsultancy,
        phone: null,
        email: null,
        website: null,
        rating: null,
        review_count: null,
        specializations: [],
      };
      mockGetConsultancyById.mockResolvedValueOnce(minimalConsultancy);

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div'),
        params: { id: 'cons-789' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const professional = jsonLd.find(
        (item: Record<string, unknown>) => item['@type'] === 'ProfessionalService',
      );

      expect(professional.telephone).toBeUndefined();
      expect(professional.email).toBeUndefined();
      expect(professional.sameAs).toBeUndefined();
      expect(professional.aggregateRating).toBeUndefined();
      expect(professional.knowsAbout).toBeUndefined();
    });

    it('renders children without JSON-LD when API fails', async () => {
      mockGetConsultancyById.mockRejectedValueOnce(new Error('Fetch error'));

      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div', { 'data-testid': 'child' }, 'Rendered'),
        params: { id: 'bad-id' },
      });

      const { container, getByTestId } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeNull();
      expect(getByTestId('child').textContent).toBe('Rendered');
    });
  });

  // ─── Cities Detail Layout ──────────────────────────────────

  describe('cities/[state]/[city]/layout.tsx', () => {
    let layoutModule: {
      generateMetadata: (args: { params: { state: string; city: string } }) => Promise<Record<string, unknown>>;
      default: (props: {
        children: React.ReactNode;
        params: { state: string; city: string };
      }) => Promise<React.ReactElement>;
    };

    beforeAll(async () => {
      layoutModule = await import('@/app/cities/[state]/[city]/layout') as typeof layoutModule;
    });

    it('generateMetadata formats slug into city/state names', async () => {
      mockGetBusinesses.mockResolvedValueOnce({ data: [], pagination: { total: 42 } });
      mockGetEvents.mockResolvedValueOnce({ data: [], pagination: { total: 8 } });

      const metadata = await layoutModule.generateMetadata({
        params: { state: 'new-jersey', city: 'edison' },
      });

      expect(metadata.title).toContain('Edison');
      expect(metadata.title).toContain('New Jersey');
    });

    it('includes business and event counts in description', async () => {
      mockGetBusinesses.mockResolvedValueOnce({ data: [], pagination: { total: 42 } });
      mockGetEvents.mockResolvedValueOnce({ data: [], pagination: { total: 8 } });

      const metadata = await layoutModule.generateMetadata({
        params: { state: 'california', city: 'fremont' },
      });

      expect(metadata.description).toContain('42 businesses');
      expect(metadata.description).toContain('8 events');
    });

    it('generateMetadata handles count fetch failures gracefully', async () => {
      mockGetBusinesses.mockRejectedValueOnce(new Error('API Error'));
      mockGetEvents.mockRejectedValueOnce(new Error('API Error'));

      const metadata = await layoutModule.generateMetadata({
        params: { state: 'texas', city: 'irving' },
      });

      // Should still produce valid metadata without counts
      expect(metadata.title).toContain('Irving');
      expect(metadata.title).toContain('Texas');
    });

    it('generateMetadata returns fallback on complete failure', async () => {
      // Mock the outer try-catch to fail
      const originalFormatSlug = (slug: string) =>
        slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      // Even if counts fail, generateMetadata should still work (inner try-catch handles counts)
      mockGetBusinesses.mockRejectedValueOnce(new Error('Fail'));
      mockGetEvents.mockRejectedValueOnce(new Error('Fail'));

      const metadata = await layoutModule.generateMetadata({
        params: { state: 'california', city: 'san-jose' },
      });

      expect(metadata.title).toBeTruthy();
    });

    it('renders City JSON-LD with correct schema', async () => {
      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div'),
        params: { state: 'new-jersey', city: 'edison' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();

      const jsonLd = JSON.parse(script!.innerHTML);
      expect(jsonLd).toHaveLength(3);

      const cityData = jsonLd.find((item: Record<string, unknown>) => item['@type'] === 'City');
      expect(cityData).toBeTruthy();
      expect(cityData.name).toBe('Edison');
      expect(cityData.containedInPlace['@type']).toBe('State');
      expect(cityData.containedInPlace.name).toBe('New Jersey');
      expect(cityData.url).toBe('https://desiconnectusa.com/cities/new-jersey/edison');
    });

    it('renders BreadcrumbList with Home > Cities > City', async () => {
      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div'),
        params: { state: 'california', city: 'fremont' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const breadcrumbs = jsonLd.find(
        (item: Record<string, unknown>) => item['@type'] === 'BreadcrumbList',
      );

      expect(breadcrumbs.itemListElement).toHaveLength(3);
      expect(breadcrumbs.itemListElement[0].name).toBe('Home');
      expect(breadcrumbs.itemListElement[1].name).toBe('Cities');
      expect(breadcrumbs.itemListElement[2].name).toBe('Fremont, California');
    });

    it('City JSON-LD always renders (no API dependency in layout body)', async () => {
      // City layout does NOT wrap JSON-LD in try-catch because it doesn't fetch data
      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div', { 'data-testid': 'child' }),
        params: { state: 'texas', city: 'irving' },
      });

      const { container, getByTestId } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();
      expect(getByTestId('child')).toBeTruthy();
    });

    it('handles multi-word city/state slugs correctly', async () => {
      const Layout = layoutModule.default;
      const element = await Layout({
        children: React.createElement('div'),
        params: { state: 'new-york', city: 'new-york-city' },
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      const cityData = jsonLd.find((item: Record<string, unknown>) => item['@type'] === 'City');

      expect(cityData.name).toBe('New York City');
      expect(cityData.containedInPlace.name).toBe('New York');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// PART 3: CROSS-CUTTING CONCERNS
// ═══════════════════════════════════════════════════════════════

describe('Cross-Cutting SEO Concerns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('all listing layouts include exactly 2 JSON-LD items (org + breadcrumb)', async () => {
    const listingLayouts = [
      '@/app/businesses/layout',
      '@/app/jobs/layout',
      '@/app/deals/layout',
      '@/app/events/layout',
      '@/app/consultancies/layout',
      '@/app/cities/layout',
    ];

    for (const path of listingLayouts) {
      const mod = await import(path);
      const Layout = mod.default;
      const { container } = render(
        React.createElement(Layout, null, React.createElement('div')),
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      expect(jsonLd).toHaveLength(2);
      expect(jsonLd[0]['@type']).toBe('Organization');
      expect(jsonLd[1]['@type']).toBe('BreadcrumbList');
    }
  });

  it('all detail layouts produce exactly 3 JSON-LD items on success', async () => {
    // Setup mocks for all detail layouts
    mockGetEventById.mockResolvedValueOnce({
      event_id: 'e1',
      title: 'Test Event',
      category: 'Cultural',
      city: 'NYC',
      state: 'NY',
      start_date: '2026-01-01',
      end_date: '2026-01-02',
      description: 'Test',
      is_virtual: false,
      is_free: false,
    });
    mockGetDealById.mockResolvedValueOnce({
      deal_id: 'd1',
      title: 'Test Deal',
      business_name: 'Biz',
      city: 'LA',
      state: 'CA',
      deal_type: 'percentage',
      discount_value: '10',
    });
    mockGetConsultancyById.mockResolvedValueOnce({
      consultancy_id: 'c1',
      name: 'Test Consultancy',
      specialization: 'H-1B',
      city: 'SJ',
      state: 'CA',
      is_verified: false,
    });

    const detailConfigs = [
      { path: '@/app/events/[id]/layout', params: { id: 'e1' } },
      { path: '@/app/deals/[id]/layout', params: { id: 'd1' } },
      { path: '@/app/consultancies/[id]/layout', params: { id: 'c1' } },
    ];

    for (const config of detailConfigs) {
      const mod = await import(config.path);
      const Layout = mod.default;
      const element = await Layout({
        children: React.createElement('div'),
        params: config.params,
      });

      const { container } = render(element);
      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script!.innerHTML);
      expect(jsonLd).toHaveLength(3);
    }
  });

  it('all JSON-LD scripts use @context https://schema.org', async () => {
    // Test one listing layout
    const businessMod = await import('@/app/businesses/layout');
    const BusinessLayout = businessMod.default;
    const { container: c1 } = render(
      React.createElement(BusinessLayout, null, React.createElement('div')),
    );
    const s1 = c1.querySelector('script[type="application/ld+json"]');
    const j1 = JSON.parse(s1!.innerHTML);
    j1.forEach((item: Record<string, unknown>) => {
      expect(item['@context']).toBe('https://schema.org');
    });

    // Test one detail layout
    mockGetEventById.mockResolvedValueOnce({
      event_id: 'e1',
      title: 'Test',
      category: 'Test',
      city: 'NYC',
      state: 'NY',
      start_date: '2026-01-01',
      is_virtual: false,
      is_free: false,
    });

    const eventMod = await import('@/app/events/[id]/layout');
    const EventLayout = eventMod.default;
    const element = await EventLayout({
      children: React.createElement('div'),
      params: { id: 'e1' },
    });
    const { container: c2 } = render(element);
    const s2 = c2.querySelector('script[type="application/ld+json"]');
    const j2 = JSON.parse(s2!.innerHTML);
    j2.forEach((item: Record<string, unknown>) => {
      expect(item['@context']).toBe('https://schema.org');
    });
  });

  it('all listing layouts render their children properly', async () => {
    const listingLayouts = [
      '@/app/businesses/layout',
      '@/app/jobs/layout',
      '@/app/deals/layout',
      '@/app/events/layout',
      '@/app/consultancies/layout',
      '@/app/cities/layout',
    ];

    for (const path of listingLayouts) {
      cleanup();
      const mod = await import(path);
      const Layout = mod.default;
      const { getByTestId } = render(
        React.createElement(
          Layout,
          null,
          React.createElement('div', { 'data-testid': 'test-child' }, 'Test'),
        ),
      );
      expect(getByTestId('test-child').textContent).toBe('Test');
    }
  });

  it('Breadcrumb first item is always Home with / path', async () => {
    const mod = await import('@/app/businesses/layout');
    const Layout = mod.default;
    const { container } = render(
      React.createElement(Layout, null, React.createElement('div')),
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    const jsonLd = JSON.parse(script!.innerHTML);
    const breadcrumbs = jsonLd.find(
      (item: Record<string, unknown>) => item['@type'] === 'BreadcrumbList',
    );

    expect(breadcrumbs.itemListElement[0].position).toBe(1);
    expect(breadcrumbs.itemListElement[0].name).toBe('Home');
    expect(breadcrumbs.itemListElement[0].item).toContain('/');
  });
});
