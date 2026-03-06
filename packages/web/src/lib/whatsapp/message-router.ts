/**
 * Message Router for WhatsApp Bot
 * 
 * Routes classified intents to appropriate handlers and data sources.
 * Defines the mapping between intents, data endpoints, and response templates.
 */

import type { BotIntent, IntentClassification } from '@desi-connect/shared';

/**
 * Route configuration for each intent
 */
export interface RouteConfig {
  intent: BotIntent;
  handler: string;
  dataSource: string;
  requiredDataFields: string[];
  responseTemplate: string;
  description: string;
}

/**
 * Result of message routing
 */
export interface MessageRouteResult {
  intent: BotIntent;
  handler: string;
  dataSource: string;
  requiredDataFields: string[];
  responseTemplate: string;
  confidence: number;
  entities: Record<string, string>;
}

/**
 * Route configurations for all intents
 * Maps each intent to its handler, data source, and requirements
 */
const ROUTE_CONFIGS: Record<BotIntent, RouteConfig> = {
  search_businesses: {
    intent: 'search_businesses',
    handler: 'businessSearchHandler',
    dataSource: '/api/businesses/search',
    requiredDataFields: ['city', 'state', 'category'],
    responseTemplate: 'business_listing',
    description: 'Search for businesses by location and category',
  },
  submit_business: {
    intent: 'submit_business',
    handler: 'businessSubmissionHandler',
    dataSource: '/api/businesses/submit',
    requiredDataFields: ['name', 'category', 'address', 'phone', 'hours'],
    responseTemplate: 'business_confirmation',
    description: 'Submit a new business to the directory',
  },
  job_search: {
    intent: 'job_search',
    handler: 'jobSearchHandler',
    dataSource: '/api/jobs/search',
    requiredDataFields: ['title', 'location', 'type'],
    responseTemplate: 'job_listing',
    description: 'Search for job opportunities',
  },
  immigration_alert: {
    intent: 'immigration_alert',
    handler: 'immigrationAlertHandler',
    dataSource: '/api/immigration/alerts',
    requiredDataFields: ['visa_type', 'email'],
    responseTemplate: 'immigration_alert',
    description: 'Subscribe to immigration alerts and updates',
  },
  deals_nearby: {
    intent: 'deals_nearby',
    handler: 'dealsSearchHandler',
    dataSource: '/api/deals/search',
    requiredDataFields: ['location', 'category'],
    responseTemplate: 'deal_listing',
    description: 'Find current deals and discounts',
  },
  submit_deal: {
    intent: 'submit_deal',
    handler: 'dealSubmissionHandler',
    dataSource: '/api/deals/submit',
    requiredDataFields: ['business', 'discount', 'description', 'expiry'],
    responseTemplate: 'deal_confirmation',
    description: 'Submit a deal or promotion',
  },
  consultancy_rating: {
    intent: 'consultancy_rating',
    handler: 'consultancyRatingHandler',
    dataSource: '/api/consultancies/rate',
    requiredDataFields: ['consultancy_name', 'rating', 'review'],
    responseTemplate: 'rating_confirmation',
    description: 'Rate and review a consultancy',
  },
  event_info: {
    intent: 'event_info',
    handler: 'eventSearchHandler',
    dataSource: '/api/events/search',
    requiredDataFields: ['location', 'category'],
    responseTemplate: 'event_listing',
    description: 'Find community events',
  },
  daily_digest: {
    intent: 'daily_digest',
    handler: 'dailyDigestHandler',
    dataSource: '/api/news/digest',
    requiredDataFields: ['user_phone', 'location'],
    responseTemplate: 'daily_digest',
    description: 'Subscribe to daily community updates',
  },
  help_onboarding: {
    intent: 'help_onboarding',
    handler: 'helpHandler',
    dataSource: '/api/help/menu',
    requiredDataFields: [],
    responseTemplate: 'help_menu',
    description: 'Show help menu and onboarding information',
  },
  unknown: {
    intent: 'unknown',
    handler: 'unknownHandler',
    dataSource: '/api/fallback',
    requiredDataFields: [],
    responseTemplate: 'unknown_intent',
    description: 'Handle unknown intents with fallback response',
  },
};

/**
 * Route a classified message to the appropriate handler
 * 
 * @param classification - The intent classification result
 * @returns MessageRouteResult with routing information
 */
export function routeMessage(classification: IntentClassification): MessageRouteResult {
  const config = ROUTE_CONFIGS[classification.intent];

  if (!config) {
    // Fallback to unknown intent handler
    const unknownConfig = ROUTE_CONFIGS.unknown;
    return {
      intent: 'unknown',
      handler: unknownConfig.handler,
      dataSource: unknownConfig.dataSource,
      requiredDataFields: unknownConfig.requiredDataFields,
      responseTemplate: unknownConfig.responseTemplate,
      confidence: 0,
      entities: classification.entities,
    };
  }

  return {
    intent: classification.intent,
    handler: config.handler,
    dataSource: config.dataSource,
    requiredDataFields: config.requiredDataFields,
    responseTemplate: config.responseTemplate,
    confidence: classification.confidence,
    entities: classification.entities,
  };
}

/**
 * Get route configuration for a specific intent
 * 
 * @param intent - The bot intent
 * @returns RouteConfig for the intent, or null if not found
 */
export function getRouteConfig(intent: BotIntent): RouteConfig | null {
  return ROUTE_CONFIGS[intent] || null;
}

/**
 * Get all available route configurations
 * 
 * @returns Array of all route configurations
 */
export function getAllRouteConfigs(): RouteConfig[] {
  return Object.values(ROUTE_CONFIGS);
}

/**
 * Check if all required data fields are present in entities
 * 
 * @param intent - The bot intent
 * @param entities - Extracted entities from message
 * @returns true if all required fields are present, false otherwise
 */
export function hasRequiredData(intent: BotIntent, entities: Record<string, string>): boolean {
  const config = ROUTE_CONFIGS[intent];

  if (!config) {
    return false;
  }

  // Check if all required fields are present
  return config.requiredDataFields.every((field) => {
    // Handle field name variations
    const fieldVariations = [
      field,
      field.replace(/_/g, ' '),
      field.replace(/_/g, ''),
    ];

    return fieldVariations.some((variation) => entities[variation] || entities[field]);
  });
}

/**
 * Get missing required data fields
 * 
 * @param intent - The bot intent
 * @param entities - Extracted entities from message
 * @returns Array of missing required fields
 */
export function getMissingRequiredData(intent: BotIntent, entities: Record<string, string>): string[] {
  const config = ROUTE_CONFIGS[intent];

  if (!config) {
    return [];
  }

  return config.requiredDataFields.filter((field) => {
    const fieldVariations = [
      field,
      field.replace(/_/g, ' '),
      field.replace(/_/g, ''),
    ];

    return !fieldVariations.some((variation) => entities[variation] || entities[field]);
  });
}

export default {
  routeMessage,
  getRouteConfig,
  getAllRouteConfigs,
  hasRequiredData,
  getMissingRequiredData,
};
