/**
 * Google Calendar Integration Utility
 *
 * Generates "Add to Google Calendar" URLs from event data.
 * Supports both DesiEvent (web) and Event (shared) types.
 */

import type { DesiEvent } from '@/lib/api-client';

export interface CalendarEventParams {
  title: string;
  description?: string;
  location?: string;
  startDate: string; // ISO 8601 or date string
  endDate?: string;  // ISO 8601 or date string
  isVirtual?: boolean;
  virtualUrl?: string;
}

/**
 * Formats a date string into Google Calendar format: YYYYMMDDTHHmmSSZ
 * Falls back to all-day format (YYYYMMDD) if time is not parseable.
 */
export function formatGoogleCalendarDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  // Google Calendar uses UTC format
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Formats an all-day date (no time component) for Google Calendar: YYYYMMDD
 */
export function formatAllDayDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate())
  );
}

/**
 * Determines if a date string includes a time component.
 */
export function hasTimeComponent(dateStr: string): boolean {
  // ISO strings with time typically contain 'T' and a time portion
  return dateStr.includes('T') && /T\d{2}:\d{2}/.test(dateStr);
}

/**
 * Builds a Google Calendar event URL from generic calendar parameters.
 */
export function buildGoogleCalendarUrl(params: CalendarEventParams): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const searchParams = new URLSearchParams();

  searchParams.set('action', 'TEMPLATE');
  searchParams.set('text', params.title);

  // Date formatting
  const isAllDay = !hasTimeComponent(params.startDate);

  if (isAllDay) {
    const start = formatAllDayDate(params.startDate);
    // For all-day events, end date is exclusive (next day)
    let end: string;
    if (params.endDate) {
      const endDate = new Date(params.endDate);
      endDate.setDate(endDate.getDate() + 1);
      end = formatAllDayDate(endDate.toISOString());
    } else {
      const startDate = new Date(params.startDate);
      startDate.setDate(startDate.getDate() + 1);
      end = formatAllDayDate(startDate.toISOString());
    }
    searchParams.set('dates', `${start}/${end}`);
  } else {
    const start = formatGoogleCalendarDate(params.startDate);
    let end: string;
    if (params.endDate && hasTimeComponent(params.endDate)) {
      end = formatGoogleCalendarDate(params.endDate);
    } else {
      // Default to 2 hours after start
      const endDate = new Date(params.startDate);
      endDate.setHours(endDate.getHours() + 2);
      end = formatGoogleCalendarDate(endDate.toISOString());
    }
    searchParams.set('dates', `${start}/${end}`);
  }

  // Build description with optional virtual link
  let description = params.description || '';
  if (params.isVirtual && params.virtualUrl) {
    description += description ? '\n\n' : '';
    description += `Virtual Event Link: ${params.virtualUrl}`;
  }
  if (description) {
    searchParams.set('details', description);
  }

  // Location
  if (params.location) {
    searchParams.set('location', params.location);
  } else if (params.isVirtual && params.virtualUrl) {
    searchParams.set('location', 'Online Event');
  }

  return `${baseUrl}?${searchParams.toString()}`;
}

/**
 * Builds a location string from DesiEvent fields.
 */
export function buildEventLocation(event: Pick<DesiEvent, 'venue_name' | 'address' | 'city' | 'state' | 'location'>): string {
  const parts: string[] = [];

  if (event.venue_name) {
    parts.push(event.venue_name);
  }
  if (event.address) {
    parts.push(event.address);
  } else if (event.location) {
    parts.push(event.location);
  }

  if (event.city) {
    parts.push(event.city);
  }
  if (event.state) {
    parts.push(event.state);
  }

  return parts.join(', ');
}

/**
 * Converts a DesiEvent into a Google Calendar URL.
 * This is the primary function for the event detail page.
 */
export function getGoogleCalendarUrlForEvent(event: DesiEvent): string {
  return buildGoogleCalendarUrl({
    title: event.title,
    description: event.description,
    location: buildEventLocation(event),
    startDate: event.start_date,
    endDate: event.end_date,
    isVirtual: event.is_virtual,
    virtualUrl: event.virtual_url,
  });
}

/**
 * Generates an .ics (iCalendar) file content string for an event.
 * Can be used for "Download .ics" functionality.
 */
export function generateIcsContent(params: CalendarEventParams): string {
  const now = formatGoogleCalendarDate(new Date().toISOString());
  const uid = `${Date.now()}@desiconnectusa.com`;

  const isAllDay = !hasTimeComponent(params.startDate);

  let dtStart: string;
  let dtEnd: string;

  if (isAllDay) {
    dtStart = `DTSTART;VALUE=DATE:${formatAllDayDate(params.startDate)}`;
    if (params.endDate) {
      const endDate = new Date(params.endDate);
      endDate.setDate(endDate.getDate() + 1);
      dtEnd = `DTEND;VALUE=DATE:${formatAllDayDate(endDate.toISOString())}`;
    } else {
      const startDate = new Date(params.startDate);
      startDate.setDate(startDate.getDate() + 1);
      dtEnd = `DTEND;VALUE=DATE:${formatAllDayDate(startDate.toISOString())}`;
    }
  } else {
    dtStart = `DTSTART:${formatGoogleCalendarDate(params.startDate)}`;
    if (params.endDate && hasTimeComponent(params.endDate)) {
      dtEnd = `DTEND:${formatGoogleCalendarDate(params.endDate)}`;
    } else {
      const endDate = new Date(params.startDate);
      endDate.setHours(endDate.getHours() + 2);
      dtEnd = `DTEND:${formatGoogleCalendarDate(endDate.toISOString())}`;
    }
  }

  let description = params.description || '';
  if (params.isVirtual && params.virtualUrl) {
    description += description ? '\\n\\n' : '';
    description += `Virtual Event Link: ${params.virtualUrl}`;
  }

  // Escape special characters for ICS
  const escapeIcs = (str: string) =>
    str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Desi Connect USA//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    dtStart,
    dtEnd,
    `SUMMARY:${escapeIcs(params.title)}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${escapeIcs(description)}`);
  }
  if (params.location) {
    lines.push(`LOCATION:${escapeIcs(params.location)}`);
  } else if (params.isVirtual) {
    lines.push('LOCATION:Online Event');
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Generates ICS content for a DesiEvent.
 */
export function getIcsContentForEvent(event: DesiEvent): string {
  return generateIcsContent({
    title: event.title,
    description: event.description,
    location: buildEventLocation(event),
    startDate: event.start_date,
    endDate: event.end_date,
    isVirtual: event.is_virtual,
    virtualUrl: event.virtual_url,
  });
}

/**
 * Triggers a download of an .ics file in the browser.
 */
export function downloadIcsFile(event: DesiEvent): void {
  const content = getIcsContentForEvent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
