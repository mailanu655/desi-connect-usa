/**
 * AI Intent Classifier — Anthropic Claude fallback for intent classification
 *
 * Used by IntentEngine when keyword-based classification returns low confidence
 * or 'unknown' intent. Sends the user message to Claude with a structured prompt
 * and parses the response into an IntentClassification.
 *
 * Supports:
 *  - Anthropic Claude API (primary)
 *  - OpenAI-compatible API (fallback configuration)
 *  - Configurable model, temperature, and max tokens
 *  - Structured JSON output parsing with validation
 *  - Graceful error handling with unknown fallback
 */

import type { BotIntent, IntentClassification } from '@desi-connect/shared';
import type { AiClassifier } from './intent-engine';

// ── Types ───────────────────────────────────────────────────

export type AiProvider = 'anthropic' | 'openai';

export interface AiClassifierConfig {
  /** AI provider to use */
  provider: AiProvider;
  /** API key for the AI provider */
  apiKey: string;
  /** Model identifier (e.g. 'claude-sonnet-4-5-20250929', 'gpt-4o-mini') */
  model?: string;
  /** Sampling temperature (0-1). Lower = more deterministic. Default 0.1 */
  temperature?: number;
  /** Maximum tokens for AI response. Default 256 */
  maxTokens?: number;
  /** Request timeout in milliseconds. Default 10000 */
  timeoutMs?: number;
  /** Optional custom API base URL */
  baseUrl?: string;
}

// ── Constants ───────────────────────────────────────────────

const VALID_INTENTS: BotIntent[] = [
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
  'unknown',
];

const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_TEMPERATURE = 0.1;
const DEFAULT_MAX_TOKENS = 256;
const DEFAULT_TIMEOUT_MS = 10_000;

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are an intent classifier for Desi Connect USA, an Indian diaspora community platform with a WhatsApp bot.

Given a user message, classify it into exactly one of these intents:
- search_businesses: Looking for Indian businesses, restaurants, stores, services
- submit_business: Wants to register/add their own business listing
- job_search: Looking for jobs, employment, career opportunities
- immigration_alert: Questions about visas, green cards, H1B, immigration news
- deals_nearby: Looking for deals, discounts, coupons, offers
- submit_deal: Wants to post a deal or discount for their business
- consultancy_rating: Wants to rate or review an immigration consultancy
- event_info: Looking for community events, festivals, gatherings
- daily_digest: Wants daily news summary, community updates digest
- help_onboarding: Needs help, wants to know commands, first-time user
- unknown: Message doesn't match any intent above

Also extract relevant entities from the message:
- location: City or area mentioned (e.g. "Edison", "Bay Area", "Chicago")
- category: Business or service category (e.g. "restaurant", "grocery", "lawyer")
- rating: Star rating if mentioned (e.g. "4", "5")
- visa_category: Visa type if mentioned (e.g. "H1B", "EB2", "green card")

Respond with ONLY valid JSON in this exact format:
{"intent": "<intent>", "confidence": <0.0-1.0>, "entities": {"key": "value"}}

Rules:
- confidence should reflect how certain you are (0.6-0.95 range typically)
- entities object should only include keys that are actually found in the message
- If no entities are found, use an empty object {}
- Do not include any text outside the JSON object`;

// ── AI Classifier Implementation ────────────────────────────

export class ClaudeIntentClassifier implements AiClassifier {
  private readonly config: Required<
    Pick<AiClassifierConfig, 'provider' | 'apiKey' | 'model' | 'temperature' | 'maxTokens' | 'timeoutMs'>
  > & { baseUrl?: string };

  constructor(config: AiClassifierConfig) {
    this.config = {
      provider: config.provider,
      apiKey: config.apiKey,
      model:
        config.model ??
        (config.provider === 'anthropic' ? DEFAULT_ANTHROPIC_MODEL : DEFAULT_OPENAI_MODEL),
      temperature: config.temperature ?? DEFAULT_TEMPERATURE,
      maxTokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      baseUrl: config.baseUrl,
    };
  }

  /**
   * Classify a user message using the configured AI provider.
   * Returns an IntentClassification with the detected intent, confidence, and entities.
   */
  async classify(message: string): Promise<IntentClassification> {
    try {
      const rawResponse =
        this.config.provider === 'anthropic'
          ? await this.callAnthropic(message)
          : await this.callOpenAI(message);

      return this.parseResponse(rawResponse, message);
    } catch (error) {
      // Return unknown on any error — IntentEngine handles fallback logic
      return {
        intent: 'unknown',
        confidence: 0.0,
        entities: {},
        raw_message: message,
      };
    }
  }

  // ── Anthropic Claude API ────────────────────────────────

  private async callAnthropic(message: string): Promise<string> {
    const url = this.config.baseUrl ?? ANTHROPIC_API_URL;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Classify this WhatsApp message:\n\n"${message}"`,
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };

      // Anthropic Messages API returns content blocks
      if (data.content && Array.isArray(data.content) && data.content.length > 0) {
        const textBlock = data.content.find(
          (block) => block.type === 'text'
        );
        if (textBlock?.text) {
          return textBlock.text;
        }
      }

      throw new Error('Unexpected Anthropic response format');
    } finally {
      clearTimeout(timeout);
    }
  }

  // ── OpenAI-compatible API ───────────────────────────────

  private async callOpenAI(message: string): Promise<string> {
    const url = this.config.baseUrl ?? OPENAI_API_URL;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Classify this WhatsApp message:\n\n"${message}"`,
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      // OpenAI Chat Completions API response format
      if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
        return data.choices[0].message.content;
      }

      throw new Error('Unexpected OpenAI response format');
    } finally {
      clearTimeout(timeout);
    }
  }

  // ── Response Parsing & Validation ─────────────────────────

  private parseResponse(rawResponse: string, originalMessage: string): IntentClassification {
    try {
      // Extract JSON from response (handle cases where model adds extra text)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate intent
      const intent: BotIntent = VALID_INTENTS.includes(parsed.intent)
        ? parsed.intent
        : 'unknown';

      // Validate confidence (clamp to 0-1 range)
      const rawConfidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5;
      const confidence = Math.max(0, Math.min(1, rawConfidence));

      // Validate entities — only keep string key-value pairs
      const entities: Record<string, string> = {};
      if (parsed.entities && typeof parsed.entities === 'object') {
        for (const [key, value] of Object.entries(parsed.entities)) {
          if (typeof value === 'string' && value.trim().length > 0) {
            entities[key] = value.trim();
          }
        }
      }

      return {
        intent,
        confidence,
        entities,
        raw_message: originalMessage,
      };
    } catch {
      // JSON parse failed — return unknown
      return {
        intent: 'unknown',
        confidence: 0.0,
        entities: {},
        raw_message: originalMessage,
      };
    }
  }
}

// ── Factory ─────────────────────────────────────────────────

/**
 * Create an AI classifier from environment variables.
 * Reads INTENT_AI_PROVIDER, INTENT_AI_API_KEY, INTENT_AI_MODEL.
 * Returns undefined if API key is not configured.
 */
export function createAiClassifierFromEnv(): AiClassifier | undefined {
  const apiKey =
    process.env.INTENT_AI_API_KEY ??
    process.env.ANTHROPIC_API_KEY ??
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return undefined;
  }

  const provider: AiProvider =
    (process.env.INTENT_AI_PROVIDER as AiProvider) ??
    (process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai');

  return new ClaudeIntentClassifier({
    provider,
    apiKey,
    model: process.env.INTENT_AI_MODEL,
    temperature: process.env.INTENT_AI_TEMPERATURE
      ? parseFloat(process.env.INTENT_AI_TEMPERATURE)
      : undefined,
    maxTokens: process.env.INTENT_AI_MAX_TOKENS
      ? parseInt(process.env.INTENT_AI_MAX_TOKENS, 10)
      : undefined,
    timeoutMs: process.env.INTENT_AI_TIMEOUT_MS
      ? parseInt(process.env.INTENT_AI_TIMEOUT_MS, 10)
      : undefined,
    baseUrl: process.env.INTENT_AI_BASE_URL,
  });
}
