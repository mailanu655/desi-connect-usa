/**
 * Intent Engine (Section 7.2 - Bot Architecture)
 *
 * AI-powered intent classifier with keyword fallback.
 * Parses natural language messages into structured IntentClassification
 * objects for the 10 defined bot intents.
 *
 * Strategy:
 * 1. Try keyword-based matching first (fast, deterministic)
 * 2. Falls back to AI classification if no keyword match (future: OpenAI/Claude API)
 * 3. Returns 'unknown' with low confidence if neither matches
 */

import type { BotIntent, IntentClassification } from '@desi-connect/shared';

/**
 * Keyword rule: maps patterns to an intent with entity extraction.
 */
interface KeywordRule {
  intent: BotIntent;
  /** At least one of these patterns must match (case-insensitive) */
  patterns: RegExp[];
  /** Entity extractors run if the rule matches */
  entityExtractors?: EntityExtractor[];
}

interface EntityExtractor {
  name: string;
  pattern: RegExp;
}

/**
 * AI classifier interface — can be swapped for OpenAI, Claude, or custom model.
 */
export interface AiClassifier {
  classify(message: string): Promise<IntentClassification>;
}

/**
 * Configuration for the IntentEngine.
 */
export interface IntentEngineConfig {
  /** Minimum confidence threshold to accept a keyword match (default: 0.7) */
  keywordConfidenceThreshold: number;
  /** Optional AI classifier for fallback classification */
  aiClassifier?: AiClassifier;
}

const DEFAULT_CONFIG: IntentEngineConfig = {
  keywordConfidenceThreshold: 0.7,
};

/**
 * US state abbreviations and city patterns for location extraction.
 */
const LOCATION_PATTERN =
  /(?:in|near|around|at)\s+([A-Za-z\s]+(?:,\s*[A-Z]{2})?)/i;

const CATEGORY_PATTERN =
  /(?:indian\s+)?(restaurant|grocery|temple|salon|store|shop|doctor|lawyer|mechanic|gas\s*station|pharmacy|dentist)/i;

const STAR_RATING_PATTERN = /(\d)\s*(?:star|stars)/i;

const VISA_CATEGORY_PATTERN =
  /\b(H-?1B|EB-?[1-5]|L-?1|F-?1|OPT|CPT|H-?4|GC|green\s*card|PERM|I-?140|I-?485|I-?765)\b/i;

/**
 * The keyword rules table. Order matters — first match wins.
 * Each rule has patterns and optional entity extractors.
 */
const KEYWORD_RULES: KeywordRule[] = [
  // Help / Onboarding — catch greetings and help requests first
  {
    intent: 'help_onboarding',
    patterns: [
      /^(hi|hello|hey|hola|namaste|help|menu|start)\s*[!.]?$/i,
      /\bwhat can you do\b/i,
      /\bhow does this work\b/i,
      /\bget started\b/i,
    ],
  },

  // Submit Business — "add my", "list my", "register my"
  {
    intent: 'submit_business',
    patterns: [
      /\b(add|list|register|submit|post)\s+(my|a|our)\s+(business|restaurant|store|shop|salon|temple)/i,
      /\badd\s+.+\s+to\s+(?:the\s+)?directory\b/i,
    ],
  },

  // Submit Deal — "post a deal", "submit a deal"
  {
    intent: 'submit_deal',
    patterns: [
      /\b(post|submit|add|create)\s+(?:a\s+)?(\d+%?\s*off\s+)?deal\b/i,
      /\b(post|submit|add)\s+(?:a\s+)?(\d+%?\s*off|discount|offer|coupon)\b/i,
    ],
  },

  // Consultancy Rating — "rate", "review", "stars"
  {
    intent: 'consultancy_rating',
    patterns: [
      /\brate\s+.+\s+\d\s*star/i,
      /\breview\s+.+\s*consult/i,
      /\bgive\s+.+\s+\d\s*star/i,
      /\b\d\s*star.+consult/i,
    ],
    entityExtractors: [
      { name: 'rating', pattern: STAR_RATING_PATTERN },
    ],
  },

  // Immigration Alert — visa categories, immigration keywords
  {
    intent: 'immigration_alert',
    patterns: [
      /\b(subscribe|alert|notify|updates?)\b.*\b(H-?1B|EB-?\d|visa|immigration|green\s*card|USCIS|PERM)\b/i,
      /\b(H-?1B|EB-?\d|visa|immigration|green\s*card|USCIS)\b.*\b(subscribe|alert|notify|updates?|news)\b/i,
    ],
    entityExtractors: [
      { name: 'visa_category', pattern: VISA_CATEGORY_PATTERN },
    ],
  },

  // Daily Digest — "daily", "digest", "subscribe"
  {
    intent: 'daily_digest',
    patterns: [
      /\b(send|subscribe|sign\s*up).*(daily|digest|updates|newsletter)\b/i,
      /\bdaily\s+(digest|update|summary|community)\b/i,
    ],
  },

  // Job Search — "job", "OPT", "H-1B jobs"
  {
    intent: 'job_search',
    patterns: [
      /\b(OPT|H-?1B|CPT)\s*(job|position|opening|work|hiring)/i,
      /\bjob(s)?\s+(in|near|around|for|search)/i,
      /\b(find|search|looking\s+for)\s+.*(job|position|work|career|opening|hiring)/i,
      /\b(hiring|openings?|positions?)\b.*\b(in|near|for)\b/i,
    ],
    entityExtractors: [
      { name: 'location', pattern: LOCATION_PATTERN },
      { name: 'visa_category', pattern: VISA_CATEGORY_PATTERN },
    ],
  },

  // Deals Nearby — "deals", "coupons", "offers", "discounts"
  {
    intent: 'deals_nearby',
    patterns: [
      /\b(deal|coupon|offer|discount|sale|promo)s?\b.*\b(near|in|this\s+week|today|around)\b/i,
      /\b(any|find|show|get)\b.*\b(deal|coupon|offer|discount|sale)s?\b/i,
      /\b(indian\s+)?(grocery|restaurant|store)\s*(deal|coupon|offer|discount)s?\b/i,
    ],
    entityExtractors: [
      { name: 'location', pattern: LOCATION_PATTERN },
      { name: 'category', pattern: CATEGORY_PATTERN },
    ],
  },

  // Event Info — "events", "Holi", "Diwali", "festival"
  {
    intent: 'event_info',
    patterns: [
      /\b(event|festival|celebration|function|gathering)s?\b.*\b(near|in|happening|upcoming|this)\b/i,
      /\b(Holi|Diwali|Navratri|Eid|Pongal|Lohri|Ugadi|Onam|Ganesh|Durga|Dasara|Baisakhi)\b/i,
      /\b(what|any|upcoming)\b.*\b(event|happening|festival|celebration)s?\b/i,
    ],
    entityExtractors: [
      { name: 'location', pattern: LOCATION_PATTERN },
    ],
  },

  // Search Businesses — broad "find", "search", category mentions
  {
    intent: 'search_businesses',
    patterns: [
      /\b(find|search|show|where|look\s*up|locate)\b.*\b(restaurant|grocery|temple|salon|store|shop|business|doctor|lawyer|mechanic)/i,
      /\bindian\s+(restaurant|grocery|temple|salon|store|shop|doctor|lawyer)/i,
      /\b(restaurant|grocery|temple|salon|store|shop)s?\s+(in|near|around)\b/i,
    ],
    entityExtractors: [
      { name: 'location', pattern: LOCATION_PATTERN },
      { name: 'category', pattern: CATEGORY_PATTERN },
    ],
  },
];

export class IntentEngine {
  private readonly config: IntentEngineConfig;

  constructor(config: Partial<IntentEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Classify an incoming message into an intent with entities.
   *
   * Strategy:
   * 1. Keyword matching (fast, deterministic)
   * 2. AI fallback (if configured)
   * 3. Returns 'unknown' if nothing matches
   */
  async classify(message: string): Promise<IntentClassification> {
    const trimmed = message.trim();

    // Step 1: Try keyword matching
    const keywordResult = this.classifyByKeywords(trimmed);
    if (keywordResult && keywordResult.confidence >= this.config.keywordConfidenceThreshold) {
      return keywordResult;
    }

    // Step 2: Try AI classifier if available
    if (this.config.aiClassifier) {
      try {
        const aiResult = await this.config.aiClassifier.classify(trimmed);
        return aiResult;
      } catch {
        // AI classifier failed, fall through to unknown
      }
    }

    // Step 3: Return unknown
    return {
      intent: 'unknown',
      confidence: 0.0,
      entities: {},
      raw_message: trimmed,
    };
  }

  /**
   * Keyword-based intent classification.
   * Returns the first matching rule's intent with extracted entities.
   */
  private classifyByKeywords(message: string): IntentClassification | null {
    for (const rule of KEYWORD_RULES) {
      const matched = rule.patterns.some((p) => p.test(message));
      if (!matched) continue;

      // Extract entities
      const entities: Record<string, string> = {};
      if (rule.entityExtractors) {
        for (const extractor of rule.entityExtractors) {
          const match = message.match(extractor.pattern);
          if (match && match[1]) {
            entities[extractor.name] = match[1].trim();
          }
        }
      }

      // Confidence is based on message specificity:
      // - Short exact matches (greetings) get 1.0
      // - Messages with entities extracted get 0.9
      // - Pattern-only matches get 0.8
      let confidence = 0.8;
      if (rule.intent === 'help_onboarding' && message.length < 10) {
        confidence = 1.0;
      } else if (Object.keys(entities).length > 0) {
        confidence = 0.9;
      }

      return {
        intent: rule.intent,
        confidence,
        entities,
        raw_message: message,
      };
    }

    return null;
  }

  /**
   * Get all supported intents (useful for help messages).
   */
  static getSupportedIntents(): BotIntent[] {
    return [
      'search_businesses',
      'submit_business',
      'job_search',
      'immigration_alert',
      'deals_nearby',
      'submit_deal',
      'consultancy_rating',
      'event_info',
      'daily_digest',
      'help_onboarding',
    ];
  }
}
