/**
 * WhatsApp Webhook Handler
 * 
 * POST: Receives incoming WhatsApp messages from Twilio webhook
 * - Validates message structure
 * - Classifies intent using classifyIntent
 * - Routes message using routeMessage
 * - Handles multi-step conversation flows
 * - Returns TwiML-formatted response (text/xml content type)
 */

import { NextRequest, NextResponse } from 'next/server';
import type { IncomingWhatsAppMessage, BotIntent } from '@desi-connect/shared';
import {
  classifyIntent,
  routeMessage,
  buildResponse,
  buildErrorResponse,
  buildWelcomeResponse,
  getSession,
  createSession,
  updateSession,
  getStepPrompt,
  isCollectingStep,
  advanceStep,
} from '@/lib/whatsapp';

/**
 * Build TwiML response for Twilio
 */
function buildTwiMLResponse(message: string): string {
  const escapedMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapedMessage}</Message>
</Response>`;
}

/**
 * Parse incoming Twilio webhook data
 */
function parseIncomingMessage(body: Record<string, any>): IncomingWhatsAppMessage {
  return {
    message_sid: body.MessageSid || '',
    account_sid: body.AccountSid || '',
    from: body.From || '',
    to: body.To || '',
    body: body.Body || '',
    num_media: parseInt(body.NumMedia || '0', 10),
    media_urls: [],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Extract phone number from Twilio format (whatsapp:+14695551234)
 */
function extractPhoneNumber(twilioPhone: string): string {
  return twilioPhone.replace(/^whatsapp:/, '').replace(/[^0-9+]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const bodyRecord = Object.fromEntries(body);

    // Parse incoming message
    const incomingMessage = parseIncomingMessage(bodyRecord);

    // Validate message structure
    if (!incomingMessage.from || !incomingMessage.body) {
      const fallbackResponse = buildTwiMLResponse(
        'I did not understand that message. Please try again or say "help".'
      );

      return new NextResponse(fallbackResponse, {
        status: 400,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const phoneNumber = extractPhoneNumber(incomingMessage.from);
    const userMessage = incomingMessage.body.trim();

    // Check for existing session
    let session = getSession(phoneNumber);

    // Handle session and multi-step flows
    if (session) {
      // User has active session - check if in collecting step
      if (isCollectingStep(session.current_step)) {
        // Validate and collect data for current step
        // Update session with collected data
        const updatedSession = updateSession(phoneNumber, {
          ...session.data,
          [session.current_step]: userMessage,
        });

        // Get the next step prompt
        const nextStepPrompt = getStepPrompt(
          advanceStep(session.current_step),
          updatedSession
        );

        // Advance to next step
        advanceStep(session.current_step);

        const response = buildTwiMLResponse(nextStepPrompt);
        return new NextResponse(response, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      }
    }

    // Classify intent from user message
    const classification = classifyIntent(userMessage);

    // Handle help/welcome intent
    if (
      classification.intent === 'help_onboarding' ||
      classification.intent === 'unknown'
    ) {
      const welcomeResponse = buildWelcomeResponse();
      const twimlResponse = buildTwiMLResponse(welcomeResponse);

      return new NextResponse(twimlResponse, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Route message based on intent
    const routeResult = routeMessage(classification, userMessage);

    // Create or update session based on route result
    if (routeResult.requires_session) {
      if (!session) {
        session = createSession(phoneNumber, null, classification.intent);
      } else {
        session = updateSession(phoneNumber, {
          intent: classification.intent,
          entities: classification.entities,
        });
      }
    }

    // Build response based on route result
    let responseMessage: string;

    if (routeResult.success) {
      responseMessage = buildResponse(
        classification.intent as BotIntent,
        routeResult.data
      );
    } else {
      responseMessage = buildErrorResponse(
        classification.intent as BotIntent,
        routeResult.error || 'Unable to process your request'
      );
    }

    const twimlResponse = buildTwiMLResponse(responseMessage);

    return new NextResponse(twimlResponse, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error);

    const errorResponse = buildTwiMLResponse(
      'An error occurred while processing your message. Please try again later.'
    );

    return new NextResponse(errorResponse, {
      status: 500,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
