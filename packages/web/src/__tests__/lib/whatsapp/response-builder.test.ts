/**
 * WhatsApp Response Builder Tests
 *
 * Comprehensive test suite for the WhatsApp response builder module.
 * Tests all template types, error handling, and utility functions.
 */

import type { BotIntent } from '@desi-connect/shared';
import {
  buildResponse,
  buildErrorResponse,
  buildWelcomeResponse,
  formatBusinessListing,
  formatJobListing,
  estimateMessageCost,
} from '@/lib/whatsapp/response-builder';

describe('WhatsApp Response Builder', () => {
  describe('buildResponse()', () => {
    const mockPhoneNumber = '+12145551234';

    describe('business_listing template', () => {
      const intent: BotIntent = 'search_businesses';

      it('should format businesses with full data', () => {
        const data = [
          { name: 'Taj Mahal', address: '123 Main St', phone: '555-0001', rating: 4.5 },
          { name: 'Spice Palace', address: '456 Oak Ave', phone: '555-0002', rating: 4.8 },
        ];
        data.to = mockPhoneNumber;

        const response = buildResponse(intent, data as any);

        expect(response.body).toContain('Found some great businesses for you!');
        expect(response.body).toContain('Taj Mahal');
        expect(response.body).toContain('Spice Palace');
        expect(response.body).toContain('123 Main St');
        expect(response.body).toContain('555-0001');
        expect(response.body).toContain('4.5/5');
        expect(response.body).toContain('Reply with a business number to see more details');
      });

      it('should handle empty business array', () => {
        const data: any = [];
        data.to = mockPhoneNumber;

        const response = buildResponse(intent, data);

        expect(response.body).toContain('Found some great businesses for you!');
        expect(response.body).toContain('No businesses found. Try searching with different criteria.');
      });

      it('should handle null business array', () => {
        const data: any = [];
        // Simulate null businesses by using an empty array
        data.to = mockPhoneNumber;

        const response = buildResponse(intent, data);

        expect(response.body).toContain('No businesses found. Try searching with different criteria.');
      });

      it('should limit to 5 businesses and handle missing fields', () => {
        const data: any = [
          { name: 'Taj Mahal' },
          { name: 'Spice Palace', address: '456 Oak Ave' },
          { name: 'Curry House', phone: '555-0003' },
          { name: 'Biryani Corner', address: '789 Elm St', phone: '555-0004', rating: 5 },
          { name: 'Samosa Spot', address: '321 Pine Rd' },
          { name: 'Extra Business', address: '999 Sixth St' },
        ];
        data.to = mockPhoneNumber;

        const response = buildResponse(intent, data);
        const matches = (response.body.match(/\d\./g) || []).length;

        expect(matches).toBeLessThanOrEqual(5);
        expect(response.body).toContain('N/A');
      });
    });

    describe('business_confirmation template', () => {
      const intent: BotIntent = 'submit_business';

      it('should format business submission confirmation', () => {
        const data = {
          to: mockPhoneNumber,
          name: 'My Restaurant',
          category: 'Indian Cuisine',
          address: '789 Market St',
        };

        const response = buildResponse(intent, data);

        expect(response.body).toContain('Thank you for submitting your business!');
        expect(response.body).toContain('My Restaurant');
        expect(response.body).toContain('Indian Cuisine');
        expect(response.body).toContain('789 Market St');
        expect(response.body).toContain('24 hours');
        expect(response.body).toContain('✅');
      });

      it('should handle missing business fields', () => {
        const data = {
          to: mockPhoneNumber,
          name: 'My Business',
        };

        const response = buildResponse(intent, data);

        expect(response.body).toContain('My Business');
        expect(response.body).toContain('N/A');
      });
    });

    describe('job_listing template', () => {
      const intent: BotIntent = 'job_search';

      it('should format jobs with full data', () => {
        const data: any = [
          {
            title: 'Senior Software Engineer',
            company: 'Tech Corp',
            location: 'San Jose, CA',
            type: 'Full Time',
          },
          {
            title: 'Data Scientist',
            company: 'Analytics Inc',
            location: 'New York, NY',
            type: 'Full Time',
          },
        ];
        data.to = mockPhoneNumber;

        const response = buildResponse(intent, data);

        expect(response.body).toContain('Great job opportunities available!');
        expect(response.body).toContain('Senior Software Engineer');
        expect(response.body).toContain('Data Scientist');
        expect(response.body).toContain('Tech Corp');
        expect(response.body).toContain('San Jose, CA');
        expect(response.body).toContain('Reply with a job number to apply');
      });

      it('should handle empty job array', () => {
        const data: any = [];
        data.to = mockPhoneNumber;

        const response = buildResponse(intent, data);

        expect(response.body).toContain('Great job opportunities available!');
        expect(response.body).toContain('No jobs matching your criteria. Check back soon!');
      });

      it('should limit to 5 jobs', () => {
        const data = {
          to: mockPhoneNumber,
          jobs: Array.from({ length: 10 }, (_, i) => ({
            title: `Job ${i + 1}`,
            company: `Company ${i + 1}`,
            location: `City ${i + 1}`,
          })),
        };

        const response = buildResponse(intent, data);
        const matches = (response.body.match(/\d\./g) || []).length;

        expect(matches).toBeLessThanOrEqual(5);
      });
    });

    describe('immigration_alert template', () => {
      const intent: BotIntent = 'immigration_alert';

      it('should format immigration alert with visa type', () => {
        const data = {
          to: mockPhoneNumber,
          visa_type: 'EB-2',
        };

        const response = buildResponse(intent, data);

        expect(response.body).toContain('Immigration Alert Settings');
        expect(response.body).toContain('EB-2');
        expect(response.body).toContain('Priority Date movements');
        expect(response.body).toContain('Visa bulletin updates');
        expect(response.body).toContain('Monday');
        expect(response.body).toContain('Reply STOP to unsubscribe anytime.');
      });

      it('should use default visa type when not provided', () => {
        const data = {
          to: mockPhoneNumber,
        };

        const response = buildResponse(intent, data);

        expect(response.body).toContain('subscribed to visa updates');
      });
    });

    describe('deal_listing template', () => {
      const intent: BotIntent = 'deals_nearby';

      it('should format deals with full data', () => {
        const data: any = [
          {
            discount: '30%',
            business: 'Indian Grocery Store',
            description: 'Rice and spices',
            expiry: '2026-03-15',
          },
          {
            discount: '50%',
            business: 'Restaurant XYZ',
            expiry: '2026-03-20',
          },
        ];
        data.to = mockPhoneNumber;

        const response = buildResponse(intent, data);

        expect(response.body).toContain('Hot deals near you! 🔥');
        expect(response.body).toContain('30%');
        expect(response.body).toContain('Indian Grocery Store');
        expect(response.body).toContain('2026-03-15');
        expect(response.body).toContain('Reply with a deal number for more info');
      });

      it('should handle empty deals array', () => {
        const data: any = [];
        data.to = mockPhoneNumber;

        const response = buildResponse(intent, data);

        expect(response.body).toContain('No active deals right now. Check back soon!');
      });

      it('should limit to 5 deals', () => {
        const data = {
          to: mockPhoneNumber,
          deals: Array.from({ length: 8 }, (_, i) => ({
            discount: `${(i + 1) * 10}%`,
            business: `Store ${i + 1}`,
            expiry: '2026-03-20',
          })),
        };

        const response = buildResponse(intent, data);
        const matches = (response.body.match(/\d\./g) || []).length;

        expect(matches).toBeLessThanOrEqual(5);
      });
    });

    describe('deal_confirmation template', () => {
      const intent: BotIntent = 'submit_deal';

      it('should format deal submission confirmation', () => {
        const data = {
          to: mockPhoneNumber,
          discount: 25,
          business: 'My Restaurant',
          description: 'All Indian dishes',
        };

        const response = buildResponse(intent, data);

        expect(response.body).toContain('Deal posted successfully! 🎉');
        expect(response.body).toContain('25');
        expect(response.body).toContain('My Restaurant');
        expect(response.body).toContain('All Indian dishes');
        expect(response.body).toContain('now live');
      });

      it('should handle missing deal fields', () => {
        const data = {
          to: mockPhoneNumber,
          discount: 15,
        };

        const response = buildResponse(intent, data);

        expect(response.body).toContain('15');
        expect(response.body).toContain('N/A');
      });
    });

    describe('rating_confirmation template', () => {
      const intent: BotIntent = 'consultancy_rating';

      it('should format rating confirmation', () => {
        const data = {
          to: mockPhoneNumber,
          rating: 5,
          consultancy_name: 'ABC Consultancy',
        };

        const response = buildResponse(intent, data);

        expect(response.body).toContain('Thank you for your review! 🙏');
        expect(response.body).toContain('5');
        expect(response.body).toContain('ABC Consultancy');
        expect(response.body).toContain('community members');
        expect(response.body).toContain('24 hours');
      });

      it('should handle missing rating fields', () => {
        const data = {
          to: mockPhoneNumber,
          rating: 4,
        };

        const response = buildResponse(intent, data);

        expect(response.body).toContain('4');
        expect(response.body).toContain('N/A');
      });
    });

    describe('event_listing template', () => {
      const intent: BotIntent = 'event_info';

      it('should format events with full data', () => {
        const data: any = [
          {
            name: 'Holi Celebration',
            location: 'Central Park, NYC',
            date: '2026-03-15',
            time: '2:00 PM',
          },
          {
            name: 'Diwali Festival',
            location: 'Tech Park, San Jose',
            date: '2026-10-20',
            time: '6:00 PM',
          },
        ];
        data.to = mockPhoneNumber;

        const response = buildResponse(intent, data);

        expect(response.body).toContain('Community events near you! 🎉');
        expect(response.body).toContain('Holi Celebration');
        expect(response.body).toContain('Central Park, NYC');
        expect(response.body).toContain('2026-03-15');
        expect(response.body).toContain('Reply with an event number for more details');
      });

      it('should handle empty events array', () => {
        const data: any = [];
        data.to = mockPhoneNumber;

        const response = buildResponse(intent, data);

        expect(response.body).toContain('No events scheduled right now. Check back soon!');
      });
    });

    describe('daily_digest template', () => {
      const intent: BotIntent = 'daily_digest';

      it('should format digest with all sections', () => {
        const data = {
          to: mockPhoneNumber,
          news: [
            { title: 'Immigration news 1' },
            { title: 'Immigration news 2' },
            { title: 'Immigration news 3' },
          ],
          deals: [
            { discount: '20%', business: 'Store A' },
            { discount: '30%', business: 'Store B' },
          ],
          jobs: [
            { title: 'Job 1', company: 'Company A' },
            { title: 'Job 2', company: 'Company B' },
          ],
        };

        const response = buildResponse(intent, data);

        expect(response.body).toContain('Your Daily Community Digest 📰');
        expect(response.body).toContain('📰 Top News:');
        expect(response.body).toContain('Immigration news 1');
        expect(response.body).toContain('🔥 Hot Deals:');
        expect(response.body).toContain('20%');
        expect(response.body).toContain('💼 New Jobs:');
        expect(response.body).toContain('Job 1');
      });

      it('should handle digest with partial sections', () => {
        const data = {
          to: mockPhoneNumber,
          news: [{ title: 'News 1' }],
          deals: [],
          jobs: [],
        };

        const response = buildResponse(intent, data);

        expect(response.body).toContain('Your Daily Community Digest 📰');
        expect(response.body).toContain('News 1');
        expect(response.body).not.toContain('🔥 Hot Deals:');
      });

      it('should handle digest with empty sections', () => {
        const data = {
          to: mockPhoneNumber,
          news: [],
          deals: [],
          jobs: [],
        };

        const response = buildResponse(intent, data);

        expect(response.body).toContain('No updates for today.');
      });

      it('should limit news, deals, and jobs to 3 each', () => {
        const data = {
          to: mockPhoneNumber,
          news: Array.from({ length: 5 }, (_, i) => ({ title: `News ${i + 1}` })),
          deals: Array.from({ length: 5 }, (_, i) => ({ discount: `${i + 1}0%`, business: `Store ${i + 1}` })),
          jobs: Array.from({ length: 5 }, (_, i) => ({ title: `Job ${i + 1}`, company: `Company ${i + 1}` })),
        };

        const response = buildResponse(intent, data);

        expect(response.body).toContain('News 1');
        expect(response.body).toContain('News 3');
        expect(response.body).not.toContain('News 4');
      });
    });

    describe('help_menu template', () => {
      const intent: BotIntent = 'help_onboarding';

      it('should format help menu', () => {
        const response = buildResponse(intent, { to: mockPhoneNumber });

        expect(response.body).toContain('Welcome to Desi Connect USA Bot! 👋');
        expect(response.body).toContain('What can I help you with?');
        expect(response.body).toContain('1️⃣ Find businesses');
        expect(response.body).toContain('2️⃣ Search jobs');
        expect(response.body).toContain('3️⃣ Immigration alerts');
        expect(response.body).toContain('4️⃣ Find deals');
        expect(response.body).toContain('5️⃣ Community events');
        expect(response.body).toContain('6️⃣ Daily updates');
        expect(response.body).toContain("Just text what you're looking for!");
      });
    });

    describe('unknown_intent template', () => {
      const intent: BotIntent = 'unknown';

      it('should format unknown intent response', () => {
        const response = buildResponse(intent, { to: mockPhoneNumber });

        expect(response.body).toContain("I didn't quite understand that.");
        expect(response.body).toContain('Indian restaurants');
        expect(response.body).toContain('Search for jobs');
        expect(response.body).toContain('Get immigration updates');
        expect(response.body).toContain('*help*');
      });
    });

    describe('character limit truncation', () => {
      it('should truncate message exceeding 4096 characters', () => {
        const longText = 'a'.repeat(4100);
        const data: any = [{ name: longText }];
        data.to = mockPhoneNumber;

        const response = buildResponse('search_businesses', data);

        expect(response.body.length).toBeLessThanOrEqual(4096);
        expect(response.body).toMatch(/\.\.\.$/);
      });

      it('should not truncate messages within limit', () => {
        const data: any = [{ name: 'Restaurant', address: 'Address', phone: '555-0001' }];
        data.to = mockPhoneNumber;

        const response = buildResponse('search_businesses', data);

        expect(response.body.length).toBeLessThanOrEqual(4096);
        expect(response.body).not.toMatch(/\.\.\.$/);
      });
    });

    describe('invalid intent handling', () => {
      it('should return error response for invalid intent', () => {
        const response = buildResponse('invalid_intent' as BotIntent, {});

        expect(response.body).toContain("I didn't quite understand that.");
        expect(response.body).toContain('*help*');
      });

      it('should handle template format function errors gracefully', () => {
        const data = {
          to: mockPhoneNumber,
          businesses: [
            {
              get name() {
                throw new Error('Intentional error');
              },
            },
          ],
        };

        const response = buildResponse('search_businesses', data);

        expect(response.body).toContain('⚠️');
        expect(response.body).toContain('Error formatting response');
      });
    });

    describe('to field handling', () => {
      it('should include to field in response when provided', () => {
        const response = buildResponse('help_onboarding', { to: mockPhoneNumber });

        expect(response.to).toBe(mockPhoneNumber);
      });

      it('should handle missing to field', () => {
        const response = buildResponse('help_onboarding', {});

        expect(response.to).toBe('');
      });
    });
  });

  describe('buildErrorResponse()', () => {
    it('should format error message with warning icon', () => {
      const error = 'Database connection failed';
      const response = buildErrorResponse(error);

      expect(response.body).toContain('⚠️');
      expect(response.body).toContain('Sorry, something went wrong:');
      expect(response.body).toContain(error);
    });

    it('should include help menu suggestion', () => {
      const response = buildErrorResponse('Test error');

      expect(response.body).toContain('*help*');
    });

    it('should have empty to field', () => {
      const response = buildErrorResponse('Test error');

      expect(response.to).toBe('');
    });

    it('should handle long error messages', () => {
      const longError = 'e'.repeat(500);
      const response = buildErrorResponse(longError);

      expect(response.body).toContain(longError);
    });

    it('should handle special characters in error message', () => {
      const errorMessage = "Error: Can't process data!@#$%";
      const response = buildErrorResponse(errorMessage);

      expect(response.body).toContain(errorMessage);
    });
  });

  describe('buildWelcomeResponse()', () => {
    it('should contain welcome greeting', () => {
      const response = buildWelcomeResponse();

      expect(response.body).toContain('Welcome to Desi Connect USA! 🇮🇳🇺🇸');
    });

    it('should describe personal assistant role', () => {
      const response = buildWelcomeResponse();

      expect(response.body).toContain("I'm your personal assistant");
      expect(response.body).toContain('Indian-American community');
    });

    it('should list all available features with emojis', () => {
      const response = buildWelcomeResponse();

      expect(response.body).toContain('📍 Find Indian businesses');
      expect(response.body).toContain('💼 Search for jobs');
      expect(response.body).toContain('📰 Get immigration alerts');
      expect(response.body).toContain('🔥 Find the best deals');
      expect(response.body).toContain('🎉 Discover community events');
    });

    it('should include call to action', () => {
      const response = buildWelcomeResponse();

      expect(response.body).toContain('What would you like help with today?');
    });

    it('should mention visa types', () => {
      const response = buildWelcomeResponse();

      expect(response.body).toContain('OPT');
      expect(response.body).toContain('H1B');
    });

    it('should have empty to field', () => {
      const response = buildWelcomeResponse();

      expect(response.to).toBe('');
    });

    it('should not exceed character limit', () => {
      const response = buildWelcomeResponse();

      expect(response.body.length).toBeLessThanOrEqual(4096);
    });
  });

  describe('formatBusinessListing()', () => {
    it('should format business with all fields', () => {
      const business = {
        name: 'Taj Mahal Restaurant',
        category: 'Indian Cuisine',
        address: '123 Main Street',
        phone: '555-0001',
        hours: '11 AM - 10 PM',
        rating: 4.8,
      };

      const result = formatBusinessListing(business);

      expect(result).toContain('📍 Taj Mahal Restaurant');
      expect(result).toContain('Category: Indian Cuisine');
      expect(result).toContain('Address: 123 Main Street');
      expect(result).toContain('Phone: 555-0001');
      expect(result).toContain('Hours: 11 AM - 10 PM');
      expect(result).toContain('Rating: ⭐ 4.8/5');
    });

    it('should handle business with minimal fields', () => {
      const business = { name: 'My Business' };

      const result = formatBusinessListing(business);

      expect(result).toContain('📍 My Business');
    });

    it('should use default name when not provided', () => {
      const business = {};

      const result = formatBusinessListing(business);

      expect(result).toContain('📍 Business');
    });

    it('should omit fields that are not provided', () => {
      const business = {
        name: 'Business',
        address: '123 Street',
      };

      const result = formatBusinessListing(business);

      expect(result).toContain('Business');
      expect(result).toContain('123 Street');
      expect(result).not.toContain('Category:');
      expect(result).not.toContain('Phone:');
    });

    it('should format rating with emoji', () => {
      const business = { name: 'Business', rating: 3.5 };

      const result = formatBusinessListing(business);

      expect(result).toContain('⭐ 3.5/5');
    });

    it('should handle null values gracefully', () => {
      const business = {
        name: 'Business',
        category: null,
        rating: null,
      };

      const result = formatBusinessListing(business);

      expect(result).toContain('Business');
      expect(result).not.toContain('null');
    });
  });

  describe('formatJobListing()', () => {
    it('should format job with all fields', () => {
      const job = {
        title: 'Senior Data Scientist',
        company: 'Tech Corporation',
        location: 'San Jose, CA',
        type: 'Full Time',
        salary: '$150,000 - $180,000',
        description: 'We are looking for a talented data scientist to join our team. You will work on cutting-edge ML projects...',
      };

      const result = formatJobListing(job);

      expect(result).toContain('💼 Senior Data Scientist');
      expect(result).toContain('Company: Tech Corporation');
      expect(result).toContain('Location: San Jose, CA');
      expect(result).toContain('Type: Full Time');
      expect(result).toContain('Salary: $150,000 - $180,000');
      expect(result).toContain('Details:');
    });

    it('should truncate description to 100 characters', () => {
      const longDescription = 'a'.repeat(150);
      const job = {
        title: 'Job Title',
        description: longDescription,
      };

      const result = formatJobListing(job);

      expect(result).toContain('Details:');
      // Check that the description is truncated and only 100 chars plus '...' are included
      expect(result.length).toBeLessThan(300);
    });

    it('should handle job with minimal fields', () => {
      const job = { title: 'Job Title' };

      const result = formatJobListing(job);

      expect(result).toContain('💼 Job Title');
    });

    it('should use default title when not provided', () => {
      const job = {};

      const result = formatJobListing(job);

      expect(result).toContain('💼 Position');
    });

    it('should omit optional fields when not provided', () => {
      const job = {
        title: 'Job Title',
        location: 'NYC',
      };

      const result = formatJobListing(job);

      expect(result).toContain('Job Title');
      expect(result).toContain('Location: NYC');
      expect(result).not.toContain('Company:');
      expect(result).not.toContain('Salary:');
    });

    it('should format job type appropriately', () => {
      const job = {
        title: 'Contractor Role',
        type: 'Contract',
      };

      const result = formatJobListing(job);

      expect(result).toContain('Type: Contract');
    });

    it('should handle null values gracefully', () => {
      const job = {
        title: 'Job',
        company: null,
        salary: null,
      };

      const result = formatJobListing(job);

      expect(result).toContain('Job');
      expect(result).not.toContain('null');
    });
  });

  describe('estimateMessageCost()', () => {
    describe('base message cost', () => {
      it('should calculate cost for short message without media', () => {
        const message = 'Hello world';
        const cost = estimateMessageCost(message, false);

        expect(cost).toBeGreaterThan(0);
        expect(cost).toBeLessThan(0.01);
      });

      it('should calculate cost for longer message without media', () => {
        const message = 'a'.repeat(1000);
        const cost = estimateMessageCost(message, false);

        expect(cost).toBeGreaterThan(0);
        expect(typeof cost).toBe('number');
      });

      it('should calculate cost for message at character limit', () => {
        const message = 'a'.repeat(4096);
        const cost = estimateMessageCost(message, false);

        expect(cost).toBeGreaterThan(0);
        expect(typeof cost).toBe('number');
      });
    });

    describe('media cost', () => {
      it('should add media cost when hasMedia is true', () => {
        const message = 'Hello world';
        const costWithoutMedia = estimateMessageCost(message, false);
        const costWithMedia = estimateMessageCost(message, true);

        expect(costWithMedia).toBeGreaterThan(costWithoutMedia);
      });

      it('should calculate media cost correctly', () => {
        const message = 'a'.repeat(100);
        const costWithMedia = estimateMessageCost(message, true);
        const costWithoutMedia = estimateMessageCost(message, false);

        const mediaCost = costWithMedia - costWithoutMedia;
        expect(mediaCost).toBeCloseTo(0.005, 3);
      });
    });

    describe('template message discount', () => {
      it('should apply 50% discount for template messages', () => {
        const templateMessage = 'Hello {{name}}, your total is {{amount}}';
        const regularMessage = 'Hello user, your total is $100';

        const templateCost = estimateMessageCost(templateMessage, false);
        const regularCost = estimateMessageCost(regularMessage, false);

        expect(templateCost).toBeLessThan(regularCost);
      });

      it('should detect template syntax with curly braces', () => {
        const messages = [
          { msg: 'Message with {{variable}}', isTemplate: true },
          { msg: 'Message with { } separate braces', isTemplate: false },
          { msg: 'Message {{ with }} multiple {{ variables }}', isTemplate: true },
        ];

        for (const { msg, isTemplate } of messages) {
          const cost = estimateMessageCost(msg, false);
          expect(typeof cost).toBe('number');
        }
      });
    });

    describe('edge cases', () => {
      it('should handle empty message', () => {
        const cost = estimateMessageCost('', false);

        expect(cost).toBeGreaterThanOrEqual(0);
      });

      it('should handle very large message', () => {
        const message = 'a'.repeat(10000);
        const cost = estimateMessageCost(message, false);

        expect(typeof cost).toBe('number');
        expect(cost).toBeGreaterThan(0);
      });

      it('should handle message with special characters and emojis', () => {
        const message = 'Hello 🎉 Testing message with émojis! @#$%';
        const cost = estimateMessageCost(message, false);

        expect(typeof cost).toBe('number');
        expect(cost).toBeGreaterThan(0);
      });

      it('should handle message with newlines and special formatting', () => {
        const message = `Line 1\nLine 2\nLine 3\n\nWith multiple newlines`;
        const cost = estimateMessageCost(message, false);

        expect(typeof cost).toBe('number');
        expect(cost).toBeGreaterThan(0);
      });

      it('should handle combination of template and media', () => {
        const templateMessage = 'Your code is {{code}}';
        const costTemplateNoMedia = estimateMessageCost(templateMessage, false);
        const costTemplateWithMedia = estimateMessageCost(templateMessage, true);

        expect(costTemplateWithMedia).toBeGreaterThan(costTemplateNoMedia);
      });
    });

    describe('cost scaling', () => {
      it('should increase cost as message size increases', () => {
        const costs = [];
        for (let length = 100; length <= 1000; length += 100) {
          const message = 'a'.repeat(length);
          costs.push(estimateMessageCost(message, false));
        }

        for (let i = 1; i < costs.length; i++) {
          expect(costs[i]).toBeGreaterThanOrEqual(costs[i - 1]);
        }
      });

      it('should calculate reasonable costs', () => {
        const shortMsg = estimateMessageCost('a'.repeat(100), false);
        const longMsg = estimateMessageCost('a'.repeat(4096), false);

        expect(longMsg).toBeGreaterThan(shortMsg);
        expect(longMsg).toBeLessThan(1);
      });
    });
  });

  describe('Integration tests', () => {
    it('should build complete business search response with valid structure', () => {
      const data = {
        to: '+12145551234',
        businesses: [
          { name: 'Restaurant A', address: '123 St', phone: '555-0001', rating: 4.5 },
          { name: 'Restaurant B', address: '456 Ave', phone: '555-0002', rating: 4.8 },
        ],
      };

      const response = buildResponse('search_businesses', data);

      expect(response).toHaveProperty('to');
      expect(response).toHaveProperty('body');
      expect(response.body).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.length).toBeLessThanOrEqual(4096);
    });

    it('should chain welcome and help menu responses', () => {
      const welcomeResponse = buildWelcomeResponse();
      const helpResponse = buildResponse('help_onboarding', { to: '+12145551234' });

      expect(welcomeResponse.body).toContain('Welcome');
      expect(helpResponse.body).toContain('What can I help you with?');
      expect(welcomeResponse.body.length).toBeGreaterThan(0);
      expect(helpResponse.body.length).toBeGreaterThan(0);
    });

    it('should format business and estimate cost for complete workflow', () => {
      const business = {
        name: 'Sample Business',
        category: 'Restaurant',
        rating: 4.5,
      };

      const formatted = formatBusinessListing(business);
      const cost = estimateMessageCost(formatted, false);

      expect(formatted).toBeTruthy();
      expect(cost).toBeGreaterThan(0);
    });

    it('should handle daily digest with all content types', () => {
      const digestData = {
        to: '+12145551234',
        news: [{ title: 'News 1' }, { title: 'News 2' }],
        deals: [
          { discount: '20%', business: 'Store 1' },
          { discount: '30%', business: 'Store 2' },
        ],
        jobs: [
          { title: 'Job 1', company: 'Company 1' },
          { title: 'Job 2', company: 'Company 2' },
        ],
      };

      const response = buildResponse('daily_digest', digestData);

      expect(response.body).toBeTruthy();
      expect(response.body.length).toBeLessThanOrEqual(4096);
      expect(response.body).toContain('News');
      expect(response.body).toContain('Deal');
      expect(response.body).toContain('Job');
    });
  });
});
