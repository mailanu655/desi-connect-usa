/** @jest-environment node */

import { NextRequest } from 'next/server';

import { GET } from '@/app/api/analytics/overview/route';

describe('Analytics Overview API Route', () => {
  describe('GET', () => {
    it('should return analytics overview data', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/overview'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('total_users');
      expect(data).toHaveProperty('total_businesses');
      expect(data).toHaveProperty('total_events');
      expect(data).toHaveProperty('total_deals');
      expect(data).toHaveProperty('total_jobs');
      expect(data).toHaveProperty('total_consultancies');
      expect(data).toHaveProperty('active_users_30d');
      expect(data).toHaveProperty('new_users_30d');
    });

    it('should return correct data types', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/overview'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(typeof data.total_users).toBe('number');
      expect(typeof data.total_businesses).toBe('number');
      expect(typeof data.total_events).toBe('number');
      expect(typeof data.total_deals).toBe('number');
      expect(typeof data.total_jobs).toBe('number');
      expect(typeof data.total_consultancies).toBe('number');
      expect(typeof data.active_users_30d).toBe('number');
      expect(typeof data.new_users_30d).toBe('number');
    });

    it('should return positive numbers for all metrics', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/overview'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.total_users).toBeGreaterThan(0);
      expect(data.total_businesses).toBeGreaterThan(0);
      expect(data.total_events).toBeGreaterThan(0);
      expect(data.total_deals).toBeGreaterThan(0);
      expect(data.total_jobs).toBeGreaterThan(0);
      expect(data.total_consultancies).toBeGreaterThan(0);
      expect(data.active_users_30d).toBeGreaterThan(0);
      expect(data.new_users_30d).toBeGreaterThan(0);
    });

    it('should return active_users_30d less than total_users', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/overview'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.active_users_30d).toBeLessThanOrEqual(data.total_users);
    });

    it('should return new_users_30d less than or equal to total_users', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/overview'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.new_users_30d).toBeLessThanOrEqual(data.total_users);
    });

    it('should return valid content-type header', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/overview'
      );
      const response = await GET(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should return all properties with consistent values', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/overview'
      );
      const response = await GET(request);
      const data = await response.json();

      // Sum of specific content types should not exceed total
      const contentTypeSum = data.total_businesses +
        data.total_events +
        data.total_deals +
        data.total_jobs +
        data.total_consultancies;

      expect(contentTypeSum).toBeLessThanOrEqual(data.total_users);
    });

    it('should be consistent across multiple requests', async () => {
      const request1 = new NextRequest(
        'http://localhost:3000/api/analytics/overview'
      );
      const response1 = await GET(request1);
      const data1 = await response1.json();

      const request2 = new NextRequest(
        'http://localhost:3000/api/analytics/overview'
      );
      const response2 = await GET(request2);
      const data2 = await response2.json();

      expect(data1).toEqual(data2);
    });

    it('should return exactly 8 properties', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/overview'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(Object.keys(data)).toHaveLength(8);
    });

    it('should have integer values for all metrics', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/overview'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(Number.isInteger(data.total_users)).toBe(true);
      expect(Number.isInteger(data.total_businesses)).toBe(true);
      expect(Number.isInteger(data.total_events)).toBe(true);
      expect(Number.isInteger(data.total_deals)).toBe(true);
      expect(Number.isInteger(data.total_jobs)).toBe(true);
      expect(Number.isInteger(data.total_consultancies)).toBe(true);
      expect(Number.isInteger(data.active_users_30d)).toBe(true);
      expect(Number.isInteger(data.new_users_30d)).toBe(true);
    });
  });
});
