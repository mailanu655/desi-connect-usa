/**
 * Template Manager for WhatsApp Bot
 * 
 * Manages pre-approved WhatsApp message templates for Meta 2026 compliance.
 * Handles template rendering, classification, and cost estimation.
 */

import type { TemplateType, WhatsAppTemplate, MessageClassification, ClassifiedMessage } from '@desi-connect/shared';

/**
 * Pre-approved WhatsApp templates mapping
 * In production, these template SIDs should come from Meta Business Platform
 */
const TEMPLATE_REGISTRY: Record<TemplateType, WhatsAppTemplate> = {
  welcome: {
    template_type: 'welcome',
    template_sid: 'welcome_msg_123',
    content_variables: {
      user_name: 'Community Member',
      feature_list: 'businesses, jobs, deals, events',
    },
  },
  daily_digest: {
    template_type: 'daily_digest',
    template_sid: 'daily_digest_123',
    content_variables: {
      date: new Date().toLocaleDateString(),
      news_count: '3',
      deals_count: '5',
      jobs_count: '2',
    },
  },
  immigration_alert: {
    template_type: 'immigration_alert',
    template_sid: 'immigration_alert_123',
    content_variables: {
      visa_type: 'EB-2',
      priority_date: '2024-01-15',
      action_needed: 'false',
    },
  },
  deal_notification: {
    template_type: 'deal_notification',
    template_sid: 'deal_notification_123',
    content_variables: {
      business_name: 'Local Business',
      discount_percent: '20',
      expiry_date: 'Today',
    },
  },
  event_reminder: {
    template_type: 'event_reminder',
    template_sid: 'event_reminder_123',
    content_variables: {
      event_name: 'Community Event',
      event_date: 'Tomorrow',
      event_time: '6:00 PM',
      event_location: 'Local Venue',
    },
  },
};

/**
 * Message classification rules for Meta 2026 compliance
 * Section 15: Meta 2026 compliance for message classification
 */
const MESSAGE_CLASSIFICATION_RULES = {
  utility: {
    description: 'Account/transactional messages',
    examples: ['confirmations', 'status updates', 'receipts'],
    costPerMessage: 0.0043,
    requiresTemplate: false,
    sessionWindowRequired: false,
  },
  marketing: {
    description: 'Promotional/marketing messages',
    examples: ['deals', 'promotions', 'announcements'],
    costPerMessage: 0.0066,
    requiresTemplate: true,
    sessionWindowRequired: true,
  },
  authentication: {
    description: 'Authentication/security messages',
    examples: ['OTP', 'verification codes', 'login alerts'],
    costPerMessage: 0.0043,
    requiresTemplate: false,
    sessionWindowRequired: false,
  },
};

/**
 * Get a template by type
 * 
 * @param type - The template type
 * @returns WhatsAppTemplate for the given type
 */
export function getTemplate(type: TemplateType): WhatsAppTemplate {
  const template = TEMPLATE_REGISTRY[type];

  if (!template) {
    throw new Error(`Template not found for type: ${type}`);
  }

  return template;
}

/**
 * Render a template with variables
 * Replaces {{variable_name}} placeholders with actual values
 * 
 * @param template - The template to render
 * @param variables - Variables to substitute in the template
 * @returns Rendered template string
 */
export function renderTemplate(template: WhatsAppTemplate, variables: Record<string, string>): string {
  let content = getTemplateContent(template.template_type);

  // Replace all {{variable_name}} with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    content = content.replace(new RegExp(placeholder, 'g'), value);
  });

  return content;
}

/**
 * Get the template content for a given type
 * In production, these would come from Meta Business Platform
 */
function getTemplateContent(type: TemplateType): string {
  const templates: Record<TemplateType, string> = {
    welcome: `Welcome to Desi Connect USA! 🇮🇳🇺🇸

Hi {{user_name}}, I'm your personal assistant for the Indian-American community!

You can ask me to:
📍 Find {{feature_list}}
💼 Search for jobs
📰 Get immigration updates
🔥 Find deals nearby
🎉 Discover community events

What would you like to explore?`,

    daily_digest: `Your Daily Community Digest 📰

Date: {{date}}

📰 Top News ({{news_count}} articles)
🔥 Hot Deals ({{deals_count}} active)
💼 New Jobs ({{jobs_count}} positions)

Reply "DAILY" to keep getting updates or "STOP" to unsubscribe.`,

    immigration_alert: `Immigration Alert Update 📢

Visa Type: {{visa_type}}
Priority Date: {{priority_date}}
Action Needed: {{action_needed}}

Check our immigration section for more details.

Reply "MORE" for details or "STOP" to unsubscribe.`,

    deal_notification: `🔥 Hot Deal Alert!

{{discount_percent}}% off at {{business_name}}

Expires: {{expiry_date}}

Reply "1" for more details or "STOP" to unsubscribe from deals.`,

    event_reminder: `🎉 Community Event Reminder

Event: {{event_name}}
Date: {{event_date}}
Time: {{event_time}}
Location: {{event_location}}

Reply "YES" to confirm attendance or "MORE" for details.`,
  };

  return templates[type] || '';
}

/**
 * Classify a message according to Meta 2026 compliance rules
 * 
 * @param templateType - The template type (if applicable)
 * @param isWithinSessionWindow - Whether the message is within 24-hour session window
 * @returns ClassifiedMessage with classification and compliance info
 */
export function classifyMessage(
  templateType: TemplateType | null,
  isWithinSessionWindow: boolean,
): ClassifiedMessage {
  let classification: MessageClassification;
  let estimatedCost: number;

  // Determine message classification
  if (templateType === 'welcome' || templateType === 'immigration_alert') {
    classification = 'authentication';
  } else if (templateType === 'deal_notification' || templateType === 'event_reminder') {
    classification = 'marketing';
  } else if (templateType === 'daily_digest') {
    classification = 'marketing';
  } else {
    classification = 'utility';
  }

  // Estimate cost based on classification and session window
  const rules = MESSAGE_CLASSIFICATION_RULES[classification];
  estimatedCost = rules.costPerMessage;

  // Marketing messages outside session window require template
  if (classification === 'marketing' && !isWithinSessionWindow && !templateType) {
    throw new Error('Marketing messages outside session window require pre-approved template');
  }

  return {
    classification,
    template_type: templateType,
    is_within_session_window: isWithinSessionWindow,
    estimated_cost_usd: estimatedCost,
  };
}

/**
 * Validate that a template is properly configured
 * 
 * @param type - The template type to validate
 * @returns true if template is valid, false otherwise
 */
export function validateTemplate(type: TemplateType): boolean {
  try {
    const template = getTemplate(type);
    const content = getTemplateContent(type);

    return !!(template && template.template_sid && content);
  } catch {
    return false;
  }
}

/**
 * Get all available templates
 * 
 * @returns Array of all available template types
 */
export function getAllTemplates(): TemplateType[] {
  return Object.keys(TEMPLATE_REGISTRY) as TemplateType[];
}

/**
 * Estimate cost for sending a specific template type
 * 
 * @param type - The template type
 * @param isWithinSessionWindow - Whether within session window
 * @returns Estimated cost in USD
 */
export function estimateTemplateCost(type: TemplateType, isWithinSessionWindow: boolean): number {
  const classified = classifyMessage(type, isWithinSessionWindow);
  return classified.estimated_cost_usd;
}

/**
 * Estimate bulk cost for sending template to multiple users
 * 
 * @param type - The template type
 * @param recipientCount - Number of recipients
 * @param isWithinSessionWindow - Whether within session window
 * @returns Estimated total cost in USD
 */
export function estimateBulkTemplateCost(
  type: TemplateType,
  recipientCount: number,
  isWithinSessionWindow: boolean,
): number {
  const singleCost = estimateTemplateCost(type, isWithinSessionWindow);
  return singleCost * recipientCount;
}

/**
 * Get Meta compliance info for a classification
 * 
 * @param classification - The message classification
 * @returns Compliance information
 */
export function getComplianceInfo(classification: MessageClassification): {
  requiresTemplate: boolean;
  sessionWindowRequired: boolean;
  costPerMessage: number;
  description: string;
} {
  const rules = MESSAGE_CLASSIFICATION_RULES[classification];

  return {
    requiresTemplate: rules.requiresTemplate,
    sessionWindowRequired: rules.sessionWindowRequired,
    costPerMessage: rules.costPerMessage,
    description: rules.description,
  };
}

/**
 * Check if a message can be sent based on compliance rules
 * 
 * @param classification - The message classification
 * @param hasTemplate - Whether a template is being used
 * @param isWithinSessionWindow - Whether within session window
 * @returns true if message can be sent, false otherwise
 */
export function canSendMessage(
  classification: MessageClassification,
  hasTemplate: boolean,
  isWithinSessionWindow: boolean,
): boolean {
  const rules = MESSAGE_CLASSIFICATION_RULES[classification];

  // If it's a marketing message outside session window, it must use a template
  if (classification === 'marketing' && !isWithinSessionWindow) {
    return hasTemplate;
  }

  // Other messages can be sent in session window or with template
  return isWithinSessionWindow || rules.requiresTemplate === false;
}

export default {
  getTemplate,
  renderTemplate,
  classifyMessage,
  validateTemplate,
  getAllTemplates,
  estimateTemplateCost,
  estimateBulkTemplateCost,
  getComplianceInfo,
  canSendMessage,
};
