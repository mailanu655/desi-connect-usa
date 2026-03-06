/**
 * Production Twilio WhatsApp Client
 *
 * Sends WhatsApp messages via the Twilio REST API.
 * Implements the WhatsAppClient interface used by NotificationDispatcher
 * and can be injected into the bot pipeline.
 *
 * Features:
 *  - Standard and template message sending
 *  - Media message support (images, documents)
 *  - Rate limiting with exponential backoff
 *  - Delivery status callback URL
 *  - Message SID tracking for delivery receipts
 *  - Health check endpoint
 */

import type { WhatsAppClient } from '../sync/notification-dispatcher';

// ── Types ───────────────────────────────────────────────────

export interface TwilioWhatsAppConfig {
  /** Twilio Account SID */
  accountSid: string;
  /** Twilio Auth Token */
  authToken: string;
  /** WhatsApp sender number (e.g. 'whatsapp:+14155238886') */
  fromNumber: string;
  /** Optional status callback URL for delivery receipts */
  statusCallbackUrl?: string;
  /** Request timeout in milliseconds (default: 15000) */
  timeoutMs?: number;
  /** Max retries on 429/5xx errors (default: 3) */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  retryBaseDelayMs?: number;
}

export interface TwilioSendResult {
  success: boolean;
  messageSid?: string;
  error?: string;
  statusCode?: number;
}

export interface MediaAttachment {
  /** Public URL of the media file */
  url: string;
}

// ── Constants ───────────────────────────────────────────────

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 1_000;

// ── Implementation ──────────────────────────────────────────

export class TwilioWhatsAppClient implements WhatsAppClient {
  private readonly config: Required<
    Pick<TwilioWhatsAppConfig, 'accountSid' | 'authToken' | 'fromNumber' | 'timeoutMs' | 'maxRetries' | 'retryBaseDelayMs'>
  > & Pick<TwilioWhatsAppConfig, 'statusCallbackUrl'>;

  constructor(config: TwilioWhatsAppConfig) {
    if (!config.accountSid || !config.authToken || !config.fromNumber) {
      throw new Error('TwilioWhatsAppClient: accountSid, authToken, and fromNumber are required');
    }

    this.config = {
      accountSid: config.accountSid,
      authToken: config.authToken,
      fromNumber: config.fromNumber.startsWith('whatsapp:')
        ? config.fromNumber
        : `whatsapp:${config.fromNumber}`,
      statusCallbackUrl: config.statusCallbackUrl,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      retryBaseDelayMs: config.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS,
    };
  }

  /**
   * Send a text message via WhatsApp.
   * Implements WhatsAppClient.sendMessage interface.
   */
  async sendMessage(to: string, body: string): Promise<TwilioSendResult> {
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const params = new URLSearchParams();
    params.set('From', this.config.fromNumber);
    params.set('To', formattedTo);
    params.set('Body', body);

    if (this.config.statusCallbackUrl) {
      params.set('StatusCallback', this.config.statusCallbackUrl);
    }

    return this.sendRequest(params);
  }

  /**
   * Send a media message (image, PDF, etc.) via WhatsApp.
   */
  async sendMediaMessage(
    to: string,
    body: string,
    mediaUrls: MediaAttachment[],
  ): Promise<TwilioSendResult> {
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const params = new URLSearchParams();
    params.set('From', this.config.fromNumber);
    params.set('To', formattedTo);
    params.set('Body', body);

    mediaUrls.forEach((media, index) => {
      params.set(`MediaUrl${index}`, media.url);
    });

    if (this.config.statusCallbackUrl) {
      params.set('StatusCallback', this.config.statusCallbackUrl);
    }

    return this.sendRequest(params);
  }

  /**
   * Send a pre-approved WhatsApp template message.
   * Required for initiating conversations (outside the 24-hour window).
   */
  async sendTemplateMessage(
    to: string,
    contentSid: string,
    contentVariables?: Record<string, string>,
  ): Promise<TwilioSendResult> {
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const params = new URLSearchParams();
    params.set('From', this.config.fromNumber);
    params.set('To', formattedTo);
    params.set('ContentSid', contentSid);

    if (contentVariables) {
      params.set('ContentVariables', JSON.stringify(contentVariables));
    }

    if (this.config.statusCallbackUrl) {
      params.set('StatusCallback', this.config.statusCallbackUrl);
    }

    return this.sendRequest(params);
  }

  /**
   * Health check — verify Twilio credentials are valid.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const url = `${TWILIO_API_BASE}/Accounts/${this.config.accountSid}.json`;
      const response = await fetch(url, {
        headers: {
          Authorization: this.authHeader(),
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // ── Private ───────────────────────────────────────────────

  private async sendRequest(params: URLSearchParams): Promise<TwilioSendResult> {
    const url = `${TWILIO_API_BASE}/Accounts/${this.config.accountSid}/Messages.json`;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: this.authHeader(),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          const data = (await response.json()) as { sid: string };
          return {
            success: true,
            messageSid: data.sid,
            statusCode: response.status,
          };
        }

        // Retry on 429 (rate limit) or 5xx (server error)
        if ((response.status === 429 || response.status >= 500) && attempt < this.config.maxRetries) {
          const delay = this.config.retryBaseDelayMs * Math.pow(2, attempt);
          await this.sleep(delay);
          continue;
        }

        // Non-retryable error
        const errorBody = await response.text().catch(() => 'Unknown error');
        return {
          success: false,
          error: `Twilio API error ${response.status}: ${errorBody}`,
          statusCode: response.status,
        };
      } catch (error) {
        clearTimeout(timeout);

        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryBaseDelayMs * Math.pow(2, attempt);
          await this.sleep(delay);
          continue;
        }

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return { success: false, error: 'Max retries exceeded' };
  }

  private authHeader(): string {
    const credentials = `${this.config.accountSid}:${this.config.authToken}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ── Factory ─────────────────────────────────────────────────

/**
 * Create a TwilioWhatsAppClient from environment variables.
 * Reads TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.
 * Returns undefined if credentials are not configured.
 */
export function createTwilioClientFromEnv(): TwilioWhatsAppClient | undefined {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !fromNumber) {
    return undefined;
  }

  return new TwilioWhatsAppClient({
    accountSid,
    authToken,
    fromNumber,
    statusCallbackUrl: process.env.TWILIO_STATUS_CALLBACK_URL,
    timeoutMs: process.env.TWILIO_TIMEOUT_MS
      ? parseInt(process.env.TWILIO_TIMEOUT_MS, 10)
      : undefined,
    maxRetries: process.env.TWILIO_MAX_RETRIES
      ? parseInt(process.env.TWILIO_MAX_RETRIES, 10)
      : undefined,
  });
}
