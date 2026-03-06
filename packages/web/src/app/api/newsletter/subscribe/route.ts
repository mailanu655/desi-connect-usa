/**
 * Newsletter Subscribe API Route
 * POST: Subscribe a new email to the newsletter
 * No authentication required (public endpoint for lead capture)
 */

import { NextRequest, NextResponse } from 'next/server';

const TEABLE_API_URL = process.env.TEABLE_API_URL || 'http://localhost:3002/api';
const TEABLE_API_KEY = process.env.TEABLE_API_KEY || '';

/** Simple email validation */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Valid digest types */
const VALID_DIGEST_TYPES = ['community', 'immigration', 'deals', 'jobs', 'events'] as const;

/** Valid frequency values */
const VALID_FREQUENCIES = ['daily', 'weekly', 'never'] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, name, city, state, digest_types, frequency, whatsapp_opted_in, whatsapp_number } = body;

    // Validate required field: email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { message: 'Email address is required.' },
        { status: 400 },
      );
    }

    if (!isValidEmail(email.trim())) {
      return NextResponse.json(
        { message: 'Please enter a valid email address.' },
        { status: 400 },
      );
    }

    // Validate digest_types if provided
    if (digest_types !== undefined) {
      if (!Array.isArray(digest_types)) {
        return NextResponse.json(
          { message: 'digest_types must be an array.' },
          { status: 400 },
        );
      }
      for (const dt of digest_types) {
        if (!VALID_DIGEST_TYPES.includes(dt)) {
          return NextResponse.json(
            { message: `Invalid digest type: ${dt}` },
            { status: 400 },
          );
        }
      }
    }

    // Validate frequency if provided
    if (frequency !== undefined && !VALID_FREQUENCIES.includes(frequency)) {
      return NextResponse.json(
        { message: `Invalid frequency: ${frequency}. Must be daily, weekly, or never.` },
        { status: 400 },
      );
    }

    // Validate WhatsApp number if opted in
    if (whatsapp_opted_in && (!whatsapp_number || typeof whatsapp_number !== 'string')) {
      return NextResponse.json(
        { message: 'WhatsApp phone number is required when opting in.' },
        { status: 400 },
      );
    }

    // Call Teable API to create subscription
    const response = await fetch(`${TEABLE_API_URL}/newsletter/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEABLE_API_KEY}`,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        name: name?.trim() || undefined,
        city: city?.trim() || undefined,
        state: state?.trim() || undefined,
        digest_types: digest_types || ['community'],
        frequency: frequency || 'weekly',
        whatsapp_opted_in: whatsapp_opted_in || false,
        whatsapp_number: whatsapp_number?.trim() || undefined,
        status: 'active',
        subscribed_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || error.error || 'Failed to subscribe. Please try again.' },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(
      {
        subscription_id: data.subscription_id || data.id,
        status: 'active',
        message: 'Successfully subscribed!',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
