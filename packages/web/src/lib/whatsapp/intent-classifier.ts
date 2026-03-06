/**
 * Intent Classifier for WhatsApp Bot
 * 
 * Classifies incoming WhatsApp messages into one of 10 bot intents
 * using keyword matching, pattern recognition, and entity extraction.
 * Supports common misspellings, abbreviations, and abbreviations.
 */

import type { BotIntent, IntentClassification } from '@desi-connect/shared';

/**
 * Keyword patterns for each intent with weights for confidence scoring
 */
const INTENT_KEYWORDS: Record<BotIntent, { keywords: string[]; weight: number }> = {
  search_businesses: {
    keywords: ['find', 'search', 'look for', 'find me', 'nearby', 'near', 'restaurant', 'store', 'shop', 'business', 'directory'],
    weight: 1.0,
  },
  submit_business: {
    keywords: ['add', 'submit', 'register', 'list', 'add my', 'my business', 'list my', 'register my', 'post my'],
    weight: 1.0,
  },
  job_search: {
    keywords: ['job', 'jobs', 'hiring', 'employment', 'career', 'position', 'role', 'opportunity', 'opt', 'h1b', 'work', 'available', 'openings'],
    weight: 1.0,
  },
  immigration_alert: {
    keywords: ['immigration', 'visa', 'eb-2', 'eb-3', 'green card', 'uscis', 'alert', 'updates', 'subscribe', 'notify', 'gc', 'priority date'],
    weight: 1.0,
  },
  deals_nearby: {
    keywords: ['deal', 'deals', 'discount', 'offer', 'sale', 'promotion', 'coupon', 'bargain', 'nearby', 'this week', 'grocery', 'percent off', 'saving'],
    weight: 1.0,
  },
  submit_deal: {
    keywords: ['post deal', 'submit deal', 'add deal', 'post a deal', 'discount', 'offer', 'promotion', 'post promotion', 'add offer', 'my deal'],
    weight: 1.0,
  },
  consultancy_rating: {
    keywords: ['rate', 'rating', 'review', 'consultancy', 'consultant', 'stars', 'feedback', 'opinion', 'experience', 'recommend'],
    weight: 1.0,
  },
  event_info: {
    keywords: ['event', 'events', 'holi', 'diwali', 'festival', 'celebration', 'gathering', 'happening', 'concert', 'show', 'ceremony', 'puja', 'function'],
    weight: 1.0,
  },
  daily_digest: {
    keywords: ['daily', 'digest', 'daily updates', 'community updates', 'news', 'send me', 'subscribe', 'morning', 'update', 'newsletter'],
    weight: 1.0,
  },
  help_onboarding: {
    keywords: ['hi', 'hello', 'hey', 'help', 'support', 'what can you do', 'how to use', 'start', 'begin', 'menu', 'options', 'commands'],
    weight: 1.0,
  },
  unknown: {
    keywords: [],
    weight: 0,
  },
};

/**
 * Entity extraction patterns for common fields
 */
const ENTITY_PATTERNS = {
  city: /\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  state: /\b([A-Z]{2})\b/,
  cuisine: /\b(indian|chinese|thai|mexican|italian|vietnamese|korean|japanese|american|pizza|burger|tacos)\b/i,
  jobTitle: /\b(data scientist|engineer|developer|analyst|manager|consultant|accountant|lawyer|doctor|nurse|teacher)\b/i,
  discount: /(\d+)\s*%\s*(?:off|discount)|(\d+)\s*(?:off|discount)/i,
  stars: /(\d+)\s*star/i,
};

/**
 * Common misspellings and their corrections
 */
const SPELLING_CORRECTIONS: Record<string, string> = {
  'resturant': 'restaurant',
  'restarant': 'restaurant',
  'restaraunt': 'restaurant',
  'visa': 'visa',
  'vizaa': 'visa',
  'greeen card': 'green card',
  'imigration': 'immigration',
  'immigrtion': 'immigration',
  'consultency': 'consultancy',
  'realestate': 'real estate',
  'realestate': 'real estate',
  'diwali': 'diwali',
  'diwalli': 'diwali',
  'holi': 'holi',
  'holli': 'holi',
};

/**
 * Normalize message text by converting to lowercase and fixing common misspellings
 */
function normalizeMessage(message: string): string {
  let normalized = message.toLowerCase();

  // Apply spelling corrections
  Object.entries(SPELLING_CORRECTIONS).forEach(([misspelled, correct]) => {
    const regex = new RegExp(`\\b${misspelled}\\b`, 'g');
    normalized = normalized.replace(regex, correct);
  });

  return normalized;
}

/**
 * Extract entities from a message
 */
function extractEntities(message: string): Record<string, string> {
  const entities: Record<string, string> = {};
  const normalized = normalizeMessage(message);

  // City extraction
  const cityMatch = normalized.match(ENTITY_PATTERNS.city);
  if (cityMatch) {
    entities.city = cityMatch[1];
  }

  // State extraction
  const stateMatch = message.match(ENTITY_PATTERNS.state);
  if (stateMatch) {
    entities.state = stateMatch[1].toUpperCase();
  }

  // Cuisine extraction
  const cuisineMatch = normalized.match(ENTITY_PATTERNS.cuisine);
  if (cuisineMatch) {
    entities.cuisine_type = cuisineMatch[1].toLowerCase();
  }

  // Job title extraction
  const jobMatch = normalized.match(ENTITY_PATTERNS.jobTitle);
  if (jobMatch) {
    entities.job_title = jobMatch[1].toLowerCase();
  }

  // Discount extraction
  const discountMatch = normalized.match(ENTITY_PATTERNS.discount);
  if (discountMatch) {
    entities.discount = discountMatch[1] || discountMatch[2];
  }

  // Stars extraction
  const starsMatch = normalized.match(ENTITY_PATTERNS.stars);
  if (starsMatch) {
    entities.rating_stars = starsMatch[1];
  }

  return entities;
}

/**
 * Calculate confidence score based on keyword matches
 */
function calculateConfidence(message: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;

  const normalized = normalizeMessage(message);
  let matchCount = 0;

  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    const matches = normalized.match(regex);
    if (matches) {
      matchCount += matches.length;
    }
  });

  // Confidence is based on keyword frequency, capped at 1.0
  // More keyword matches = higher confidence
  const wordCount = normalized.split(/\s+/).length;
  const confidence = Math.min(1.0, (matchCount / Math.max(1, wordCount)) * 2);

  return confidence;
}

/**
 * Classify a message into a bot intent
 * 
 * @param message - The incoming message text
 * @returns IntentClassification with intent, confidence, and extracted entities
 */
export function classifyIntent(message: string): IntentClassification {
  const normalized = normalizeMessage(message);
  let bestIntent: BotIntent = 'unknown';
  let bestConfidence = 0;

  // Score each intent
  const scores: Record<BotIntent, number> = {} as Record<BotIntent, number>;

  for (const [intent, { keywords, weight }] of Object.entries(INTENT_KEYWORDS)) {
    const confidence = calculateConfidence(message, keywords) * weight;
    scores[intent as BotIntent] = confidence;

    // Update best intent if this one scores higher
    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestIntent = intent as BotIntent;
    }
  }

  // If no good match found, classify as unknown
  if (bestConfidence < 0.2 || bestIntent === 'unknown') {
    bestIntent = 'unknown';
    bestConfidence = 0;
  }

  // Extract entities from the message
  const entities = extractEntities(message);

  return {
    intent: bestIntent,
    confidence: bestConfidence,
    entities,
    raw_message: message,
  };
}

/**
 * Classify multiple messages and return the one with highest confidence
 * Useful for multi-turn conversations where the user sends multiple messages
 * 
 * @param messages - Array of messages to classify
 * @returns IntentClassification with the highest confidence score
 */
export function classifyIntentFromMessages(messages: string[]): IntentClassification {
  if (messages.length === 0) {
    return {
      intent: 'unknown',
      confidence: 0,
      entities: {},
      raw_message: '',
    };
  }

  const classifications = messages.map(classifyIntent);

  // Find the classification with the highest confidence
  let bestClassification = classifications[0];
  for (const classification of classifications) {
    if (classification.confidence > bestClassification.confidence) {
      bestClassification = classification;
    }
  }

  return bestClassification;
}

export default {
  classifyIntent,
  classifyIntentFromMessages,
};
