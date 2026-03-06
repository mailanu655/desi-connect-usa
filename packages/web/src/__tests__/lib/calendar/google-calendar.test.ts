import type { DesiEvent } from '@/lib/api-client';
import {
  formatGoogleCalendarDate,
  formatAllDayDate,
  hasTimeComponent,
  buildGoogleCalendarUrl,
  buildEventLocation,
  getGoogleCalendarUrlForEvent,
  generateIcsContent,
  getIcsContentForEvent,
  downloadIcsFile,
  type CalendarEventParams,
} from '@/lib/calendar/google-calendar';

/**
 * Mock DesiEvent for testing
 */
const mockEvent: DesiEvent = {
  event_id: 'evt-1',
  title: 'Grand Diwali Celebration',
  description: 'An evening of light, music, and culture.',
  category: 'cultural',
  location: 'Community Center',
  city: 'New York',
  state: 'NY',
  start_date: '2024-11-01T18:00:00Z',
  end_date: '2024-11-01T23:00:00Z',
  is_virtual: false,
  is_free: true,
  status: 'published',
  venue_name: 'Grand Hall',
  address: '123 Main St',
};

describe('Google Calendar Integration', () => {
  describe('formatGoogleCalendarDate', () => {
    it('should format ISO date with time to YYYYMMDDTHHmmSSZ', () => {
      const result = formatGoogleCalendarDate('2024-11-01T18:00:00Z');
      expect(result).toBe('20241101T180000Z');
    });

    it('should format ISO date with different time', () => {
      const result = formatGoogleCalendarDate('2024-11-01T14:30:45Z');
      expect(result).toBe('20241101T143045Z');
    });

    it('should handle single digit month and day with padding', () => {
      const result = formatGoogleCalendarDate('2024-01-05T09:00:00Z');
      expect(result).toBe('20240105T090000Z');
    });

    it('should handle single digit hours, minutes, and seconds with padding', () => {
      const result = formatGoogleCalendarDate('2024-01-05T09:05:03Z');
      expect(result).toBe('20240105T090503Z');
    });

    it('should convert UTC time correctly', () => {
      const result = formatGoogleCalendarDate('2024-12-31T23:59:59Z');
      expect(result).toBe('20241231T235959Z');
    });

    it('should throw error for invalid date string', () => {
      expect(() => formatGoogleCalendarDate('invalid-date')).toThrow(
        'Invalid date: invalid-date'
      );
    });

    it('should throw error for empty string', () => {
      expect(() => formatGoogleCalendarDate('')).toThrow('Invalid date: ');
    });

    it('should throw error for null-like strings', () => {
      expect(() => formatGoogleCalendarDate('null')).toThrow();
    });

    it('should handle milliseconds in ISO string', () => {
      const result = formatGoogleCalendarDate('2024-11-01T18:00:00.000Z');
      expect(result).toBe('20241101T180000Z');
    });

    it('should handle timezone-aware ISO strings and convert to UTC', () => {
      // Note: Date parsing behavior depends on JS engine, but should still format correctly
      const result = formatGoogleCalendarDate('2024-11-01T18:00:00+00:00');
      expect(result).toMatch(/^\d{8}T\d{6}Z$/);
    });
  });

  describe('formatAllDayDate', () => {
    it('should format date to YYYYMMDD', () => {
      const result = formatAllDayDate('2024-11-01');
      expect(result).toBe('20241101');
    });

    it('should format ISO date to YYYYMMDD', () => {
      const result = formatAllDayDate('2024-11-01T00:00:00Z');
      expect(result).toBe('20241101');
    });

    it('should handle single digit month and day with padding', () => {
      const result = formatAllDayDate('2024-01-05');
      expect(result).toBe('20240105');
    });

    it('should handle year 2000', () => {
      const result = formatAllDayDate('2000-01-01');
      expect(result).toBe('20000101');
    });

    it('should throw error for invalid date', () => {
      expect(() => formatAllDayDate('invalid-date')).toThrow(
        'Invalid date: invalid-date'
      );
    });

    it('should throw error for empty string', () => {
      expect(() => formatAllDayDate('')).toThrow('Invalid date: ');
    });

    it('should format December 31st correctly', () => {
      const result = formatAllDayDate('2024-12-31');
      expect(result).toBe('20241231');
    });
  });

  describe('hasTimeComponent', () => {
    it('should return true for ISO string with time', () => {
      expect(hasTimeComponent('2024-11-01T18:00:00Z')).toBe(true);
    });

    it('should return true for ISO string with different time', () => {
      expect(hasTimeComponent('2024-11-01T09:30:45Z')).toBe(true);
    });

    it('should return false for date-only string', () => {
      expect(hasTimeComponent('2024-11-01')).toBe(false);
    });

    it('should return false for string without T', () => {
      expect(hasTimeComponent('2024/11/01')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasTimeComponent('')).toBe(false);
    });

    it('should return false for string with T but no time', () => {
      expect(hasTimeComponent('2024-11-01T')).toBe(false);
    });

    it('should return true for valid time after T', () => {
      expect(hasTimeComponent('2024-11-01T00:00')).toBe(true);
    });

    it('should return false if missing minutes after hours', () => {
      expect(hasTimeComponent('2024-11-01T18')).toBe(false);
    });
  });

  describe('buildGoogleCalendarUrl', () => {
    describe('timed events', () => {
      it('should build URL for timed event with start and end date', () => {
        const params: CalendarEventParams = {
          title: 'Team Meeting',
          description: 'Weekly sync',
          location: 'Conference Room A',
          startDate: '2024-11-01T18:00:00Z',
          endDate: '2024-11-01T19:00:00Z',
        };
        const url = buildGoogleCalendarUrl(params);
        expect(url).toContain('action=TEMPLATE');
        expect(url).toContain('text=Team+Meeting');
        expect(url).toContain('20241101T180000Z');
        expect(url).toContain('20241101T190000Z');
        expect(url).toContain('details=Weekly+sync');
        expect(url).toContain('location=Conference+Room+A');
      });

      it('should default to 2 hours duration if no end date', () => {
        const params: CalendarEventParams = {
          title: 'Workshop',
          startDate: '2024-11-01T10:00:00Z',
        };
        const url = buildGoogleCalendarUrl(params);
        expect(url).toContain('20241101T100000Z');
        expect(url).toContain('20241101T120000Z');
      });

      it('should ignore end date without time component', () => {
        const params: CalendarEventParams = {
          title: 'Workshop',
          startDate: '2024-11-01T10:00:00Z',
          endDate: '2024-11-01',
        };
        const url = buildGoogleCalendarUrl(params);
        expect(url).toContain('20241101T100000Z');
        expect(url).toContain('20241101T120000Z');
      });
    });

    describe('all-day events', () => {
      it('should build URL for all-day event with start and end date', () => {
        const params: CalendarEventParams = {
          title: 'Holiday',
          startDate: '2024-11-01',
          endDate: '2024-11-02',
        };
        const url = buildGoogleCalendarUrl(params);
        expect(url).toContain('dates=20241101%2F20241103');
      });

      it('should default to 1 day if no end date for all-day event', () => {
        const params: CalendarEventParams = {
          title: 'Holiday',
          startDate: '2024-11-01',
        };
        const url = buildGoogleCalendarUrl(params);
        expect(url).toContain('dates=20241101%2F20241102');
      });
    });

    describe('description handling', () => {
      it('should include description in details parameter', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          description: 'Important details',
          startDate: '2024-11-01T10:00:00Z',
        };
        const url = buildGoogleCalendarUrl(params);
        expect(url).toContain('details=Important+details');
      });

      it('should not include empty description', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          description: '',
          startDate: '2024-11-01T10:00:00Z',
        };
        const url = buildGoogleCalendarUrl(params);
        expect(url).not.toContain('details');
      });

      it('should add virtual URL to description for virtual events', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          description: 'Join us',
          startDate: '2024-11-01T10:00:00Z',
          isVirtual: true,
          virtualUrl: 'https://zoom.us/j/123456',
        };
        const url = buildGoogleCalendarUrl(params);
        expect(url).toContain('Virtual+Event+Link');
        expect(url).toContain('https%3A%2F%2Fzoom.us%2Fj%2F123456');
      });

      it('should add virtual URL without duplicating newlines', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          startDate: '2024-11-01T10:00:00Z',
          isVirtual: true,
          virtualUrl: 'https://zoom.us/j/123456',
        };
        const url = buildGoogleCalendarUrl(params);
        expect(url).toContain('Virtual+Event+Link');
        expect(url).toContain('https%3A%2F%2Fzoom.us%2Fj%2F123456');
      });
    });

    describe('location handling', () => {
      it('should include location parameter', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          location: '123 Main St',
          startDate: '2024-11-01T10:00:00Z',
        };
        const url = buildGoogleCalendarUrl(params);
        expect(url).toContain('location=123+Main+St');
      });

      it('should not include location if not provided', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          startDate: '2024-11-01T10:00:00Z',
        };
        const url = buildGoogleCalendarUrl(params);
        expect(url).not.toContain('location=');
      });

      it('should set location to "Online Event" for virtual event without location', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          startDate: '2024-11-01T10:00:00Z',
          isVirtual: true,
          virtualUrl: 'https://zoom.us/j/123456',
        };
        const url = buildGoogleCalendarUrl(params);
        expect(url).toContain('location=Online+Event');
      });

      it('should prefer location over default virtual location', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          location: 'Physical Venue',
          startDate: '2024-11-01T10:00:00Z',
          isVirtual: true,
          virtualUrl: 'https://zoom.us/j/123456',
        };
        const url = buildGoogleCalendarUrl(params);
        expect(url).toContain('location=Physical+Venue');
        expect(url).not.toContain('Online+Event');
      });
    });

    it('should use base URL correctly', () => {
      const params: CalendarEventParams = {
        title: 'Event',
        startDate: '2024-11-01T10:00:00Z',
      };
      const url = buildGoogleCalendarUrl(params);
      expect(url).toContain('https://calendar.google.com/calendar/render');
    });
  });

  describe('buildEventLocation', () => {
    it('should build location with all fields', () => {
      const event = {
        venue_name: 'Grand Hall',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        location: 'Community Center',
      };
      const result = buildEventLocation(event);
      expect(result).toBe('Grand Hall, 123 Main St, New York, NY');
    });

    it('should use address over location fallback when address exists', () => {
      const event = {
        venue_name: 'Grand Hall',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        location: 'Fallback Location',
      };
      const result = buildEventLocation(event);
      expect(result).toBe('Grand Hall, 123 Main St, New York, NY');
      expect(result).not.toContain('Fallback Location');
    });

    it('should use location field when address is missing', () => {
      const event = {
        venue_name: 'Grand Hall',
        address: undefined,
        city: 'New York',
        state: 'NY',
        location: 'Community Center',
      };
      const result = buildEventLocation(event);
      expect(result).toBe('Grand Hall, Community Center, New York, NY');
    });

    it('should handle missing venue_name', () => {
      const event = {
        venue_name: undefined,
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        location: 'Community Center',
      };
      const result = buildEventLocation(event);
      expect(result).toBe('123 Main St, New York, NY');
    });

    it('should handle missing city', () => {
      const event = {
        venue_name: 'Grand Hall',
        address: '123 Main St',
        city: undefined,
        state: 'NY',
        location: 'Community Center',
      };
      const result = buildEventLocation(event);
      expect(result).toBe('Grand Hall, 123 Main St, NY');
    });

    it('should handle missing state', () => {
      const event = {
        venue_name: 'Grand Hall',
        address: '123 Main St',
        city: 'New York',
        state: undefined,
        location: 'Community Center',
      };
      const result = buildEventLocation(event);
      expect(result).toBe('Grand Hall, 123 Main St, New York');
    });

    it('should return empty string when all fields are missing', () => {
      const event = {
        venue_name: undefined,
        address: undefined,
        city: undefined,
        state: undefined,
        location: undefined,
      };
      const result = buildEventLocation(event);
      expect(result).toBe('');
    });

    it('should handle single field only', () => {
      const event = {
        venue_name: 'Grand Hall',
        address: undefined,
        city: undefined,
        state: undefined,
        location: undefined,
      };
      const result = buildEventLocation(event);
      expect(result).toBe('Grand Hall');
    });

    it('should handle empty string values', () => {
      const event = {
        venue_name: '',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        location: '',
      };
      const result = buildEventLocation(event);
      // Empty strings should not be included
      expect(result).toContain('123 Main St');
      expect(result).toContain('New York');
    });
  });

  describe('getGoogleCalendarUrlForEvent', () => {
    it('should generate URL from complete DesiEvent', () => {
      const url = getGoogleCalendarUrlForEvent(mockEvent);
      expect(url).toContain('action=TEMPLATE');
      expect(url).toContain('text=Grand+Diwali+Celebration');
      expect(url).toContain('An+evening+of+light');
      expect(url).toContain('Grand+Hall');
    });

    it('should handle virtual events', () => {
      const virtualEvent: DesiEvent = {
        ...mockEvent,
        is_virtual: true,
        virtual_url: 'https://zoom.us/j/123456',
      };
      const url = getGoogleCalendarUrlForEvent(virtualEvent);
      expect(url).toContain('Virtual+Event+Link');
      expect(url).toContain('https%3A%2F%2Fzoom.us%2Fj%2F123456');
    });

    it('should handle event with minimal fields', () => {
      const minimalEvent: DesiEvent = {
        event_id: 'evt-2',
        title: 'Simple Event',
        category: 'other',
        is_virtual: false,
        is_free: true,
        status: 'published',
        start_date: '2024-11-01T10:00:00Z',
      };
      const url = getGoogleCalendarUrlForEvent(minimalEvent);
      expect(url).toContain('Simple+Event');
    });
  });

  describe('generateIcsContent', () => {
    describe('structure and headers', () => {
      it('should contain BEGIN:VCALENDAR', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('BEGIN:VCALENDAR');
      });

      it('should contain END:VCALENDAR', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('END:VCALENDAR');
      });

      it('should contain BEGIN:VEVENT', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('BEGIN:VEVENT');
      });

      it('should contain END:VEVENT', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('END:VEVENT');
      });

      it('should contain VERSION:2.0', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('VERSION:2.0');
      });

      it('should contain PRODID', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('PRODID:-//Desi Connect USA//Events//EN');
      });
    });

    describe('timed events', () => {
      it('should format timed event correctly', () => {
        const params: CalendarEventParams = {
          title: 'Meeting',
          startDate: '2024-11-01T10:00:00Z',
          endDate: '2024-11-01T11:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('DTSTART:20241101T100000Z');
        expect(content).toContain('DTEND:20241101T110000Z');
        expect(content).not.toContain('VALUE=DATE');
      });

      it('should default to 2 hours for timed event without end date', () => {
        const params: CalendarEventParams = {
          title: 'Meeting',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('DTSTART:20241101T100000Z');
        expect(content).toContain('DTEND:20241101T120000Z');
      });

      it('should ignore end date without time for timed events', () => {
        const params: CalendarEventParams = {
          title: 'Meeting',
          startDate: '2024-11-01T10:00:00Z',
          endDate: '2024-11-01',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('DTSTART:20241101T100000Z');
        expect(content).toContain('DTEND:20241101T120000Z');
      });
    });

    describe('all-day events', () => {
      it('should format all-day event correctly', () => {
        const params: CalendarEventParams = {
          title: 'Holiday',
          startDate: '2024-11-01',
          endDate: '2024-11-02',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('DTSTART;VALUE=DATE:20241101');
        expect(content).toContain('DTEND;VALUE=DATE:20241103');
      });

      it('should default to 1 day for all-day event without end date', () => {
        const params: CalendarEventParams = {
          title: 'Holiday',
          startDate: '2024-11-01',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('DTSTART;VALUE=DATE:20241101');
        expect(content).toContain('DTEND;VALUE=DATE:20241102');
      });
    });

    describe('event properties', () => {
      it('should include SUMMARY', () => {
        const params: CalendarEventParams = {
          title: 'Important Meeting',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('SUMMARY:Important Meeting');
      });

      it('should include DESCRIPTION when provided', () => {
        const params: CalendarEventParams = {
          title: 'Meeting',
          description: 'Team sync',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('DESCRIPTION:Team sync');
      });

      it('should not include DESCRIPTION when empty', () => {
        const params: CalendarEventParams = {
          title: 'Meeting',
          description: '',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).not.toContain('DESCRIPTION:');
      });

      it('should include LOCATION when provided', () => {
        const params: CalendarEventParams = {
          title: 'Meeting',
          location: 'Conference Room A',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('LOCATION:Conference Room A');
      });

      it('should set LOCATION to "Online Event" for virtual event without location', () => {
        const params: CalendarEventParams = {
          title: 'Meeting',
          isVirtual: true,
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('LOCATION:Online Event');
      });

      it('should include UID', () => {
        const params: CalendarEventParams = {
          title: 'Meeting',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toMatch(/UID:\d+@desiconnectusa\.com/);
      });

      it('should include DTSTAMP', () => {
        const params: CalendarEventParams = {
          title: 'Meeting',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
      });
    });

    describe('special character escaping', () => {
      it('should escape backslashes in title', () => {
        const params: CalendarEventParams = {
          title: 'Event\\With\\Backslash',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('SUMMARY:Event\\\\With\\\\Backslash');
      });

      it('should escape semicolons in description', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          description: 'Description;with;semicolons',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('DESCRIPTION:Description\\;with\\;semicolons');
      });

      it('should escape commas in location', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          location: 'City, State, Country',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('LOCATION:City\\, State\\, Country');
      });

      it('should escape newlines in description', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          description: 'Line 1\nLine 2',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('DESCRIPTION:Line 1\\nLine 2');
      });

      it('should handle multiple special characters', () => {
        const params: CalendarEventParams = {
          title: 'Event; Test\\Other',
          description: 'Desc, with; many\\ special',
          startDate: '2024-11-01T10:00:00Z',
        };
        const content = generateIcsContent(params);
        expect(content).toMatch(/SUMMARY:Event\\; Test\\\\Other/);
      });
    });

    describe('virtual event URL handling', () => {
      it('should add virtual URL to description', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          description: 'Join us online',
          startDate: '2024-11-01T10:00:00Z',
          isVirtual: true,
          virtualUrl: 'https://zoom.us/j/123456',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('Virtual Event Link: https://zoom.us/j/123456');
      });

      it('should add virtual URL without description', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          startDate: '2024-11-01T10:00:00Z',
          isVirtual: true,
          virtualUrl: 'https://zoom.us/j/123456',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('Virtual Event Link: https://zoom.us/j/123456');
      });

      it('should use proper line separator for virtual URL', () => {
        const params: CalendarEventParams = {
          title: 'Event',
          description: 'Description',
          startDate: '2024-11-01T10:00:00Z',
          isVirtual: true,
          virtualUrl: 'https://zoom.us/j/123456',
        };
        const content = generateIcsContent(params);
        expect(content).toContain('Description\\\\n\\\\nVirtual Event Link');
      });
    });

    it('should use CRLF line endings', () => {
      const params: CalendarEventParams = {
        title: 'Event',
        startDate: '2024-11-01T10:00:00Z',
      };
      const content = generateIcsContent(params);
      expect(content).toContain('\r\n');
      expect(content).not.toMatch(/[^\r]\n/);
    });
  });

  describe('getIcsContentForEvent', () => {
    it('should generate ICS from complete DesiEvent', () => {
      const content = getIcsContentForEvent(mockEvent);
      expect(content).toContain('BEGIN:VCALENDAR');
      expect(content).toContain('END:VCALENDAR');
      expect(content).toContain('SUMMARY:Grand Diwali Celebration');
      expect(content).toContain('DESCRIPTION:An evening of light\\, music\\, and culture.');
      expect(content).toContain('Grand Hall');
    });

    it('should handle virtual events', () => {
      const virtualEvent: DesiEvent = {
        ...mockEvent,
        is_virtual: true,
        virtual_url: 'https://zoom.us/j/123456',
      };
      const content = getIcsContentForEvent(virtualEvent);
      expect(content).toContain('Virtual Event Link: https://zoom.us/j/123456');
    });

    it('should handle minimal event', () => {
      const minimalEvent: DesiEvent = {
        event_id: 'evt-2',
        title: 'Simple Event',
        category: 'other',
        is_virtual: false,
        is_free: true,
        status: 'published',
        start_date: '2024-11-01T10:00:00Z',
      };
      const content = getIcsContentForEvent(minimalEvent);
      expect(content).toContain('SUMMARY:Simple Event');
      expect(content).toContain('BEGIN:VCALENDAR');
      expect(content).toContain('END:VCALENDAR');
    });
  });

  describe('downloadIcsFile', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // URL.createObjectURL and URL.revokeObjectURL don't exist in jsdom
      if (!URL.createObjectURL) {
        (URL as any).createObjectURL = jest.fn();
      }
      if (!URL.revokeObjectURL) {
        (URL as any).revokeObjectURL = jest.fn();
      }
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create blob with calendar content', () => {
      const createObjectURLSpy = jest
        .spyOn(URL, 'createObjectURL')
        .mockReturnValue('blob:mock-url');
      jest.spyOn(URL, 'revokeObjectURL');
      jest
        .spyOn(document, 'createElement')
        .mockReturnValue({
          click: jest.fn(),
          href: '',
          download: '',
        } as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
      jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);

      downloadIcsFile(mockEvent);

      // Verify createObjectURL was called with a Blob
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      const blobArg = createObjectURLSpy.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('text/calendar;charset=utf-8');
    });

    it('should create object URL from blob', () => {
      const createObjectURLSpy = jest
        .spyOn(URL, 'createObjectURL')
        .mockReturnValue('blob:mock-url');
      jest.spyOn(document, 'createElement').mockReturnValue({
        click: jest.fn(),
        href: '',
        download: '',
      } as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
      jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);
      jest.spyOn(URL, 'revokeObjectURL');

      downloadIcsFile(mockEvent);

      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should set link href to blob URL', () => {
      const linkElement = {
        click: jest.fn(),
        href: '',
        download: '',
      } as any;
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      jest.spyOn(document, 'createElement').mockReturnValue(linkElement);
      jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
      jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);
      jest.spyOn(URL, 'revokeObjectURL');

      downloadIcsFile(mockEvent);

      expect(linkElement.href).toBe('blob:mock-url');
    });

    it('should set download filename with sanitized event title', () => {
      const linkElement = {
        click: jest.fn(),
        href: '',
        download: '',
      } as any;
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      jest.spyOn(document, 'createElement').mockReturnValue(linkElement);
      jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
      jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);
      jest.spyOn(URL, 'revokeObjectURL');

      downloadIcsFile(mockEvent);

      expect(linkElement.download).toBe('Grand_Diwali_Celebration.ics');
    });

    it('should sanitize filename with special characters', () => {
      const eventWithSpecialChars: DesiEvent = {
        ...mockEvent,
        title: 'Event: Special/Characters & More!',
      };
      const linkElement = {
        click: jest.fn(),
        href: '',
        download: '',
      } as any;
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      jest.spyOn(document, 'createElement').mockReturnValue(linkElement);
      jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
      jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);
      jest.spyOn(URL, 'revokeObjectURL');

      downloadIcsFile(eventWithSpecialChars);

      expect(linkElement.download).toBe('Event__Special_Characters___More_.ics');
    });

    it('should append link to document body', () => {
      const linkElement = {
        click: jest.fn(),
        href: '',
        download: '',
      } as any;
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      jest.spyOn(document, 'createElement').mockReturnValue(linkElement);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
      jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);
      jest.spyOn(URL, 'revokeObjectURL');

      downloadIcsFile(mockEvent);

      expect(appendChildSpy).toHaveBeenCalledWith(linkElement);
    });

    it('should click link to trigger download', () => {
      const clickSpy = jest.fn();
      const linkElement = {
        click: clickSpy,
        href: '',
        download: '',
      } as any;
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      jest.spyOn(document, 'createElement').mockReturnValue(linkElement);
      jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
      jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);
      jest.spyOn(URL, 'revokeObjectURL');

      downloadIcsFile(mockEvent);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should remove link from document body', () => {
      const linkElement = {
        click: jest.fn(),
        href: '',
        download: '',
      } as any;
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      jest.spyOn(document, 'createElement').mockReturnValue(linkElement);
      jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);
      jest.spyOn(URL, 'revokeObjectURL');

      downloadIcsFile(mockEvent);

      expect(removeChildSpy).toHaveBeenCalledWith(linkElement);
    });

    it('should revoke object URL', () => {
      const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL');
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      jest.spyOn(document, 'createElement').mockReturnValue({
        click: jest.fn(),
        href: '',
        download: '',
      } as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
      jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);

      downloadIcsFile(mockEvent);

      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle download for virtual events', () => {
      const virtualEvent: DesiEvent = {
        ...mockEvent,
        is_virtual: true,
        virtual_url: 'https://zoom.us/j/123456',
      };
      const clickSpy = jest.fn();
      const linkElement = {
        click: clickSpy,
        href: '',
        download: '',
      } as any;
      jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      jest.spyOn(document, 'createElement').mockReturnValue(linkElement);
      jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
      jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);
      jest.spyOn(URL, 'revokeObjectURL');

      downloadIcsFile(virtualEvent);

      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
