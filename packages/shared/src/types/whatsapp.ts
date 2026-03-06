/**
 * WhatsApp Bot Types (Section 7 - WhatsApp AI Bot Feature Blueprint)
 *
 * Defines all 10 intents from the conversational capabilities table,
 * plus the bot architecture components (Message Router, Intent Engine,
 * Response Builder, Session Manager, Template Manager).
 */

/**
 * All supported WhatsApp bot intents from Section 7.1.
 * Each maps to a specific data source and response format.
 */
export type BotIntent =
  | 'search_businesses'     // "Find Indian restaurants in Plano TX"
  | 'submit_business'       // "Add my restaurant to the directory"
  | 'job_search'            // "OPT jobs in data science near Dallas"
  | 'immigration_alert'     // "Subscribe to EB-2 updates"
  | 'deals_nearby'          // "Any Indian grocery deals this week?"
  | 'submit_deal'           // "Post a 20% off deal for my store"
  | 'consultancy_rating'    // "Rate ABC Consultancy 3 stars"
  | 'event_info'            // "What Holi events are happening near me?"
  | 'daily_digest'          // "Send me daily community updates"
  | 'help_onboarding'       // "Hi" or "Help"
  | 'unknown';              // Unrecognized intent

export interface IntentClassification {
  intent: BotIntent;
  confidence: number;
  entities: Record<string, string>;
  raw_message: string;
}

/**
 * Incoming WhatsApp message from Twilio webhook
 */
export interface IncomingWhatsAppMessage {
  message_sid: string;
  account_sid: string;
  from: string;          // e.g., "whatsapp:+14695551234"
  to: string;            // e.g., "whatsapp:+14155238886"
  body: string;
  num_media: number;
  media_urls: string[];
  timestamp: string;
}

/**
 * Outgoing WhatsApp message to send via Twilio
 */
export interface OutgoingWhatsAppMessage {
  to: string;
  body: string;
  media_url?: string;
}

/**
 * Session state for multi-step conversation flows
 * (e.g., business submission, deal posting)
 */
export type SessionStep =
  | 'idle'
  | 'collecting_business_name'
  | 'collecting_business_address'
  | 'collecting_business_category'
  | 'collecting_business_phone'
  | 'collecting_business_hours'
  | 'confirming_business_submission'
  | 'collecting_deal_business'
  | 'collecting_deal_discount'
  | 'collecting_deal_expiry'
  | 'collecting_deal_terms'
  | 'confirming_deal_submission'
  | 'collecting_rating_consultancy'
  | 'collecting_rating_stars'
  | 'collecting_rating_text'
  | 'confirming_rating_submission';

export interface ConversationSession {
  session_id: string;
  user_phone: string;
  user_id: string | null;
  current_step: SessionStep;
  intent: BotIntent | null;
  data: Record<string, unknown>;
  last_activity: string;
  expires_at: string;
}

/**
 * Twilio message template types for pre-approved messages
 * (required outside 24-hour session window)
 */
export type TemplateType =
  | 'welcome'
  | 'daily_digest'
  | 'immigration_alert'
  | 'deal_notification'
  | 'event_reminder';

export interface WhatsAppTemplate {
  template_type: TemplateType;
  template_sid: string;
  content_variables: Record<string, string>;
}

/**
 * Meta 2026 Compliance: Message classification (Section 15)
 */
export type MessageClassification = 'utility' | 'marketing' | 'authentication';

export interface ClassifiedMessage {
  classification: MessageClassification;
  template_type: TemplateType | null;
  is_within_session_window: boolean;
  estimated_cost_usd: number;
}
