/**
 * Message Router (Section 7.2 - Bot Architecture)
 *
 * Twilio webhook → parse IncomingWhatsAppMessage → route to:
 *   1. Session manager (if user is in a multi-step flow)
 *   2. Intent engine (if new message / idle session)
 *   3. Response builder (generates the outgoing message)
 *
 * This is the main orchestrator that ties all bot components together.
 */

import type {
  IncomingWhatsAppMessage,
  OutgoingWhatsAppMessage,
} from '@desi-connect/shared';

import { IntentEngine } from '../intents/intent-engine';
import { SessionManager } from '../session/session-manager';
import { ResponseBuilder } from '../services/response-builder';
import { FlowHandler } from '../handlers/flow-handler';

export interface MessageRouterDeps {
  intentEngine: IntentEngine;
  sessionManager: SessionManager;
  responseBuilder: ResponseBuilder;
  flowHandler: FlowHandler;
}

export class MessageRouter {
  private readonly intentEngine: IntentEngine;
  private readonly sessionManager: SessionManager;
  private readonly responseBuilder: ResponseBuilder;
  private readonly flowHandler: FlowHandler;

  constructor(deps: MessageRouterDeps) {
    this.intentEngine = deps.intentEngine;
    this.sessionManager = deps.sessionManager;
    this.responseBuilder = deps.responseBuilder;
    this.flowHandler = deps.flowHandler;
  }

  /**
   * Parse a raw Twilio webhook body into an IncomingWhatsAppMessage.
   * Twilio sends form-urlencoded data.
   */
  static parseTwilioWebhook(body: Record<string, string>): IncomingWhatsAppMessage {
    const mediaUrls: string[] = [];
    const numMedia = parseInt(body.NumMedia || '0', 10);
    for (let i = 0; i < numMedia; i++) {
      const url = body[`MediaUrl${i}`];
      if (url) mediaUrls.push(url);
    }

    return {
      message_sid: body.MessageSid || '',
      account_sid: body.AccountSid || '',
      from: body.From || '',
      to: body.To || '',
      body: body.Body || '',
      num_media: numMedia,
      media_urls: mediaUrls,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle an incoming WhatsApp message end-to-end.
   * Returns the outgoing response message(s).
   */
  async handleMessage(
    incoming: IncomingWhatsAppMessage,
  ): Promise<OutgoingWhatsAppMessage[]> {
    const userPhone = incoming.from;
    const messageText = incoming.body.trim();

    // Check if user wants to cancel an active flow
    if (this.isCancelCommand(messageText)) {
      this.sessionManager.endSession(userPhone);
      return [
        {
          to: userPhone,
          body: '❌ Cancelled. Type *help* to see what I can do.',
        },
      ];
    }

    // Route 1: Check for active multi-step flow
    if (this.sessionManager.isInFlow(userPhone)) {
      const flowResponse = await this.flowHandler.handleFlowStep(
        userPhone,
        messageText,
      );
      return [flowResponse];
    }

    // Route 2: Classify the intent
    const classification = await this.intentEngine.classify(messageText);

    // Route 3: If the intent starts a multi-step flow, initialize the session
    if (this.isFlowIntent(classification.intent)) {
      const flowResponse = await this.flowHandler.startFlow(
        userPhone,
        classification,
      );
      return [flowResponse];
    }

    // Route 4: Single-turn intent — build response directly
    const response = await this.responseBuilder.buildResponse(
      userPhone,
      classification,
    );
    return [response];
  }

  /**
   * Check if the message is a cancel command.
   */
  private isCancelCommand(message: string): boolean {
    const cancelPatterns = [
      /^cancel$/i,
      /^stop$/i,
      /^quit$/i,
      /^exit$/i,
      /^nevermind$/i,
      /^never\s*mind$/i,
    ];
    return cancelPatterns.some((p) => p.test(message));
  }

  /**
   * Check if an intent triggers a multi-step conversation flow.
   */
  private isFlowIntent(intent: string): boolean {
    return [
      'submit_business',
      'submit_deal',
      'consultancy_rating',
    ].includes(intent);
  }
}
