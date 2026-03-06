/**
 * WhatsApp Send API Route
 * 
 * POST: Sends an outbound WhatsApp message to a phone number
 * - Validates input (to, body)
 * - Classifies message for Meta 2026 compliance
 * - In dev mode: returns success without sending to Twilio
 * - In production: integrates with Twilio to send actual message
 */

import { NextRequest, NextResponse } from 'next/server';
import type { MessageClassification } from '@desi-connect/shared';
import { classifyMessage } from '@/lib/whatsapp';

interface SendMessageRequest {
  to: string;
  body: string;
  template_type?: string;
}

interface SendMessageResponse {
  success: boolean;
  message_sid?: string;
  to: string;
  body: string;
  classification: MessageClassification | null;
  estimated_cost_usd?: number;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SendMessageResponse>> {
  try {
    const body = await request.json() as SendMessageRequest;

    // Validate required fields
    if (!body.to || !body.body) {
      return NextResponse.json(
        {
          success: false,
          to: body.to || '',
          body: body.body || '',
          classification: null,
          error: 'Missing required fields: to, body',
        },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = body.to.replace(/[^\d+]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        {
          success: false,
          to: body.to,
          body: body.body,
          classification: null,
          error: 'Invalid phone number format. Use E.164 format (e.g., +14695551234)',
        },
        { status: 400 }
      );
    }

    // Validate message length
    if (body.body.length > 4096) {
      return NextResponse.json(
        {
          success: false,
          to: body.to,
          body: body.body,
          classification: null,
          error: 'Message body exceeds maximum length of 4096 characters',
        },
        { status: 400 }
      );
    }

    // Classify message for Meta compliance
    const classifiedMessage = classifyMessage(
      body.body,
      body.template_type
    );

    // In development mode, return success without sending to Twilio
    if (process.env.NODE_ENV === 'development') {
      const mockMessageSid = `SM${Math.random().toString(36).substring(2, 15)}`;

      console.log('[DEV] WhatsApp message would be sent:', {
        to: body.to,
        body: body.body,
        classification: classifiedMessage.classification,
        cost: classifiedMessage.estimated_cost_usd,
      });

      return NextResponse.json(
        {
          success: true,
          message_sid: mockMessageSid,
          to: body.to,
          body: body.body,
          classification: classifiedMessage.classification,
          estimated_cost_usd: classifiedMessage.estimated_cost_usd,
        },
        { status: 200 }
      );
    }

    // Production: Send via Twilio
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_PHONE_NUMBER;

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      return NextResponse.json(
        {
          success: false,
          to: body.to,
          body: body.body,
          classification: classifiedMessage.classification,
          error: 'Twilio credentials not configured',
        },
        { status: 500 }
      );
    }

    // Build Twilio API URL
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

    // Prepare phone number with whatsapp prefix
    const toPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
    const fromPhone = twilioPhoneNumber.startsWith('whatsapp:')
      ? twilioPhoneNumber
      : `whatsapp:${twilioPhoneNumber}`;

    // Create form data for Twilio
    const formData = new URLSearchParams();
    formData.append('From', fromPhone);
    formData.append('To', `whatsapp:${toPhone}`);
    formData.append('Body', body.body);

    // Send request to Twilio
    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const twilioData = await twilioResponse.json() as any;

    if (!twilioResponse.ok) {
      console.error('Twilio API error:', twilioData);

      return NextResponse.json(
        {
          success: false,
          to: body.to,
          body: body.body,
          classification: classifiedMessage.classification,
          error: twilioData.message || 'Failed to send message via Twilio',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message_sid: twilioData.sid || '',
        to: body.to,
        body: body.body,
        classification: classifiedMessage.classification,
        estimated_cost_usd: classifiedMessage.estimated_cost_usd,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('WhatsApp send error:', error);

    return NextResponse.json(
      {
        success: false,
        to: '',
        body: '',
        classification: null,
        error: error.message || 'Failed to send message',
      },
      { status: 500 }
    );
  }
}
