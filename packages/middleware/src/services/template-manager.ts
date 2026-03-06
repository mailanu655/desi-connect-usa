/**
 * Template Manager (Section 7.2 - Bot Architecture)
 *
 * Manages pre-approved Twilio WhatsApp templates for messages
 * sent outside the 24-hour session window.
 *
 * Template types: welcome, daily_digest, immigration_alert,
 * deal_notification, event_reminder.
 *
 * Also handles Meta 2026 message classification (Section 15).
 */

import type {
  TemplateType,
  WhatsAppTemplate,
  MessageClassification,
  ClassifiedMessage,
} from '@desi-connect/shared';

/**
 * Template definition with content formatting function.
 */
interface TemplateDefinition {
  templateType: TemplateType;
  templateSid: string;
  /** Function to format content variables into the template body */
  formatBody: (variables: Record<string, string>) => string;
  /** Meta 2026 message classification */
  classification: MessageClassification;
  /** Estimated cost per message in USD */
  estimatedCostUsd: number;
}

export interface TemplateManagerConfig {
  /** Map of template type to Twilio template SID */
  templateSids: Partial<Record<TemplateType, string>>;
  /** Session window duration in hours (default: 24) */
  sessionWindowHours: number;
}

const DEFAULT_CONFIG: TemplateManagerConfig = {
  templateSids: {},
  sessionWindowHours: 24,
};

/**
 * Default template definitions with placeholder SIDs.
 * In production, SIDs come from Twilio after template approval.
 */
const TEMPLATE_DEFINITIONS: Record<TemplateType, Omit<TemplateDefinition, 'templateSid'>> = {
  welcome: {
    templateType: 'welcome',
    formatBody: (vars) =>
      `🙏 Namaste ${vars.name || 'there'}! Welcome to Desi Connect USA — your community hub for the Indian diaspora. Type *help* to see what I can do!`,
    classification: 'utility',
    estimatedCostUsd: 0.005,
  },
  daily_digest: {
    templateType: 'daily_digest',
    formatBody: (vars) =>
      `📰 *Your Daily Digest — ${vars.date || 'Today'}*\n\n${vars.content || 'No updates today.'}`,
    classification: 'marketing',
    estimatedCostUsd: 0.015,
  },
  immigration_alert: {
    templateType: 'immigration_alert',
    formatBody: (vars) =>
      `🇺🇸 *Immigration Alert: ${vars.category || 'Update'}*\n\n${vars.content || 'New immigration update available.'}`,
    classification: 'utility',
    estimatedCostUsd: 0.005,
  },
  deal_notification: {
    templateType: 'deal_notification',
    formatBody: (vars) =>
      `🏷️ *New Deal Alert!*\n\n${vars.title || 'New Deal'}\n${vars.description || ''}\n${vars.code ? '🎟️ Code: ' + vars.code : ''}`,
    classification: 'marketing',
    estimatedCostUsd: 0.015,
  },
  event_reminder: {
    templateType: 'event_reminder',
    formatBody: (vars) =>
      `📅 *Event Reminder: ${vars.title || 'Upcoming Event'}*\n\n📍 ${vars.venue || 'TBD'}\n🕐 ${vars.date || 'TBD'}`,
    classification: 'utility',
    estimatedCostUsd: 0.005,
  },
};

export class TemplateManager {
  private readonly config: TemplateManagerConfig;

  constructor(config: Partial<TemplateManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get a formatted template ready to send via Twilio.
   */
  getTemplate(
    templateType: TemplateType,
    variables: Record<string, string> = {},
  ): WhatsAppTemplate {
    const sid =
      this.config.templateSids[templateType] ||
      `placeholder_${templateType}_sid`;

    return {
      template_type: templateType,
      template_sid: sid,
      content_variables: variables,
    };
  }

  /**
   * Format a template's body with the given variables.
   */
  formatTemplateBody(
    templateType: TemplateType,
    variables: Record<string, string> = {},
  ): string {
    const def = TEMPLATE_DEFINITIONS[templateType];
    return def.formatBody(variables);
  }

  /**
   * Classify a message for Meta 2026 compliance (Section 15).
   *
   * Returns classification, whether we're in the session window,
   * and estimated cost.
   */
  classifyMessage(
    templateType: TemplateType | null,
    lastUserMessageTime: string | null,
  ): ClassifiedMessage {
    const isWithinWindow = this.isWithinSessionWindow(lastUserMessageTime);

    // If within session window, it's a free-form session message (utility)
    if (isWithinWindow && !templateType) {
      return {
        classification: 'utility',
        template_type: null,
        is_within_session_window: true,
        estimated_cost_usd: 0.005,
      };
    }

    // If we have a template type, use its classification
    if (templateType) {
      const def = TEMPLATE_DEFINITIONS[templateType];
      return {
        classification: def.classification,
        template_type: templateType,
        is_within_session_window: isWithinWindow,
        estimated_cost_usd: def.estimatedCostUsd,
      };
    }

    // Outside window without template — cannot send
    return {
      classification: 'marketing',
      template_type: null,
      is_within_session_window: false,
      estimated_cost_usd: 0.015,
    };
  }

  /**
   * Check if the current time is within the 24-hour session window
   * from the last user message.
   */
  isWithinSessionWindow(lastUserMessageTime: string | null): boolean {
    if (!lastUserMessageTime) return false;

    const lastMsg = new Date(lastUserMessageTime);
    const now = new Date();
    const windowMs = this.config.sessionWindowHours * 60 * 60 * 1000;

    return now.getTime() - lastMsg.getTime() < windowMs;
  }

  /**
   * Check if a template type requires a pre-approved Twilio template
   * (i.e., when outside the session window).
   */
  requiresTemplate(
    lastUserMessageTime: string | null,
  ): boolean {
    return !this.isWithinSessionWindow(lastUserMessageTime);
  }

  /**
   * Get all available template types.
   */
  getAvailableTemplateTypes(): TemplateType[] {
    return Object.keys(TEMPLATE_DEFINITIONS) as TemplateType[];
  }

  /**
   * Get the Meta 2026 classification for a template type.
   */
  getClassification(templateType: TemplateType): MessageClassification {
    return TEMPLATE_DEFINITIONS[templateType].classification;
  }
}
