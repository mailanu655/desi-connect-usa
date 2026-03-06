/**
 * ContentParser — Transforms Tavily search results into typed domain objects
 *
 * Handles:
 *   - Categorization of content into NewsCategory / EventCategory
 *   - Extraction of city/state from search queries and content
 *   - Tag generation from content keywords
 *   - Event date extraction from search result metadata
 */

import type {
  TavilySearchResult,
  CreateNewsInput,
  CreateEventInput,
  NewsCategory,
  EventCategory,
} from '@desi-connect/shared';

export interface ParsedContent {
  type: 'news' | 'event';
  news?: CreateNewsInput;
  event?: CreateEventInput;
}

export interface ContentParserConfig {
  /** Default city for content with no location signal */
  defaultCity?: string;
  /** Default state for content with no location signal */
  defaultState?: string;
}

// ── Category mapping rules ─────────────────────────────────

const NEWS_CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  immigration: [
    'visa', 'h-1b', 'h1b', 'green card', 'uscis', 'immigration',
    'i-140', 'eb-2', 'eb-3', 'opt', 'cpt', 'ead', 'perm', 'bulletin',
    'priority date', 'consulate', 'petition', 'deportation', 'asylum',
    'naturalization', 'citizenship',
  ],
  community: [
    'community', 'desi', 'indian american', 'south asian', 'diaspora',
    'temple', 'gurudwara', 'mosque', 'cultural', 'volunteer', 'nonprofit',
  ],
  business: [
    'business', 'restaurant', 'store', 'shop', 'startup',
    'opening', 'franchise', 'retail',
  ],
  technology: [
    'tech', 'software', 'ai', 'startup', 'silicon valley', 'engineer',
    'entrepreneur', 'developer', 'it services', 'consulting', 'data science',
  ],
  lifestyle: [
    'food', 'recipe', 'bollywood', 'cricket', 'yoga', 'wellness',
    'fashion', 'travel', 'diwali preparation', 'rangoli',
  ],
  events: [
    'festival', 'celebration', 'event', 'holi', 'diwali', 'navratri',
    'eid', 'pongal', 'onam', 'baisakhi', 'concert', 'performance',
  ],
  deals: [
    'deal', 'discount', 'offer', 'sale', 'coupon', 'promo',
    'savings', 'percent off', '% off',
  ],
  politics: [
    'election', 'congress', 'senate', 'politician', 'policy',
    'government', 'legislation', 'bill', 'act', 'executive order',
  ],
  other: [],
};

const EVENT_CATEGORY_KEYWORDS: Record<EventCategory, string[]> = {
  cultural: ['cultural', 'diwali', 'holi', 'navratri', 'onam', 'pongal', 'baisakhi', 'rangoli'],
  religious: ['temple', 'gurudwara', 'mosque', 'prayer', 'puja', 'kirtan', 'religious'],
  networking: ['networking', 'meetup', 'mixer', 'professional', 'career', 'connect'],
  educational: ['workshop', 'seminar', 'lecture', 'class', 'training', 'webinar', 'conference'],
  food_festival: ['food festival', 'food fair', 'taste of', 'cooking', 'culinary'],
  sports: ['cricket', 'kabaddi', 'badminton', 'tournament', 'sports', 'league', 'match'],
  charity: ['charity', 'fundraiser', 'donation', 'volunteer', 'cause', 'nonprofit', 'gala'],
  business: ['business event', 'expo', 'trade show', 'startup', 'entrepreneur', 'pitch'],
  other: [],
};

export class ContentParser {
  private readonly defaultCity: string | null;
  private readonly defaultState: string | null;

  constructor(config: ContentParserConfig = {}) {
    this.defaultCity = config.defaultCity ?? null;
    this.defaultState = config.defaultState ?? null;
  }

  /**
   * Parse a Tavily search result into a typed domain object.
   * Uses the original search query for location and category hints.
   */
  parse(
    result: TavilySearchResult,
    searchQuery: string,
    locationHint?: { city: string; state: string },
  ): ParsedContent {
    const lowerContent = (result.content + ' ' + result.title + ' ' + searchQuery).toLowerCase();

    // Determine if this is an event or news
    const isEvent = this.isEventContent(lowerContent);

    if (isEvent) {
      return {
        type: 'event',
        event: this.toEventInput(result, searchQuery, locationHint),
      };
    }

    return {
      type: 'news',
      news: this.toNewsInput(result, searchQuery, locationHint),
    };
  }

  /**
   * Classify content into a NewsCategory
   */
  classifyNewsCategory(text: string): NewsCategory {
    const lower = text.toLowerCase();
    let bestCategory: NewsCategory = 'other';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(NEWS_CATEGORY_KEYWORDS)) {
      if (category === 'other') continue;
      const score = keywords.filter((kw) => lower.includes(kw)).length;
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category as NewsCategory;
      }
    }

    return bestCategory;
  }

  /**
   * Classify content into an EventCategory
   */
  classifyEventCategory(text: string): EventCategory {
    const lower = text.toLowerCase();
    let bestCategory: EventCategory = 'other';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(EVENT_CATEGORY_KEYWORDS)) {
      if (category === 'other') continue;
      const score = keywords.filter((kw) => lower.includes(kw)).length;
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category as EventCategory;
      }
    }

    return bestCategory;
  }

  /**
   * Extract tags from content text
   */
  extractTags(text: string, maxTags = 5): string[] {
    const lower = text.toLowerCase();
    const allKeywords = Object.values(NEWS_CATEGORY_KEYWORDS).flat();
    const matched = allKeywords.filter((kw) => lower.includes(kw));

    // Deduplicate and limit
    const unique = [...new Set(matched)];
    return unique.slice(0, maxTags);
  }

  /**
   * Extract a source name from a URL
   */
  extractSourceName(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      // Remove www. prefix and .com/.org etc suffix
      return hostname.replace(/^www\./, '').replace(/\.(com|org|net|gov|io|co)$/, '');
    } catch {
      return 'unknown';
    }
  }

  // ── Private helpers ────────────────────────────────────────

  private isEventContent(lowerText: string): boolean {
    const eventSignals = [
      'event', 'festival', 'celebration', 'concert', 'performance',
      'meetup', 'meet-up', 'gathering', 'workshop', 'seminar',
      'conference', 'gala', 'fundraiser', 'tournament',
      'register now', 'rsvp', 'tickets available', 'join us',
      'save the date', 'upcoming event',
    ];

    const matchCount = eventSignals.filter((s) => lowerText.includes(s)).length;
    return matchCount >= 2; // Need at least 2 signals to classify as event
  }

  private toNewsInput(
    result: TavilySearchResult,
    searchQuery: string,
    locationHint?: { city: string; state: string },
  ): CreateNewsInput {
    const combinedText = `${result.title} ${result.content} ${searchQuery}`;
    const category = this.classifyNewsCategory(combinedText);
    const tags = this.extractTags(combinedText);

    return {
      title: result.title,
      summary: this.truncate(result.content, 300),
      content: result.content,
      source_url: result.url,
      source_name: this.extractSourceName(result.url),
      image_url: result.images?.[0] ?? null,
      category,
      tags,
      city: locationHint?.city ?? this.defaultCity,
      state: locationHint?.state ?? this.defaultState,
      source: 'tavily',
      author_name: null,
      published_at: result.published_date ?? new Date().toISOString(),
    };
  }

  private toEventInput(
    result: TavilySearchResult,
    searchQuery: string,
    locationHint?: { city: string; state: string },
  ): CreateEventInput {
    const combinedText = `${result.title} ${result.content} ${searchQuery}`;
    const category = this.classifyEventCategory(combinedText);

    return {
      title: result.title,
      description: result.content,
      category,
      city: locationHint?.city ?? this.defaultCity ?? 'Unknown',
      state: locationHint?.state ?? this.defaultState ?? 'Unknown',
      is_virtual: result.content.toLowerCase().includes('virtual') ||
                  result.content.toLowerCase().includes('online') ||
                  result.content.toLowerCase().includes('zoom'),
      image_url: result.images?.[0] ?? null,
      starts_at: result.published_date ?? new Date().toISOString(),
      is_free: !result.content.toLowerCase().includes('ticket') &&
               !result.content.toLowerCase().includes('admission'),
      submission_source: 'tavily',
    };
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  }
}
