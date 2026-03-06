/**
 * WhatsApp Integration Library
 * 
 * Exports all WhatsApp bot utilities for intent classification,
 * message routing, response building, session management, and templates.
 */

// Intent Classifier
export {
  classifyIntent,
  classifyIntentFromMessages,
} from './intent-classifier';

// Message Router
export type { RouteConfig, MessageRouteResult } from './message-router';
export {
  routeMessage,
  getRouteConfig,
  getAllRouteConfigs,
  hasRequiredData,
  getMissingRequiredData,
} from './message-router';

// Response Builder
export {
  buildResponse,
  buildErrorResponse,
  buildWelcomeResponse,
  formatBusinessListing,
  formatJobListing,
  estimateMessageCost,
} from './response-builder';

// Session Manager
export {
  createSession,
  getSession,
  updateSession,
  advanceStep,
  setSessionIntent,
  resetSession,
  expireSession,
  isCollectingStep,
  getStepPrompt,
  getSessionStats,
  clearAllSessions,
} from './session-manager';

// Template Manager
export {
  getTemplate,
  renderTemplate,
  classifyMessage,
  validateTemplate,
  getAllTemplates,
  estimateTemplateCost,
  estimateBulkTemplateCost,
  getComplianceInfo,
  canSendMessage,
} from './template-manager';
