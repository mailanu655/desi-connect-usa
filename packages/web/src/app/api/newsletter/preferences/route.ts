/**
 * Newsletter Preferences API Route
 * POST: Update newsletter preferences for an existing subscription
 * No authentication required (uses email as identifier from preferences page)
 */

import { NextRequest, NextResponse } from 'next/server';

const TEABLE_API_URL = process.env.TEABLE_API_URL || 'http://localhost:3002/api';
const TEABLE_API_KEY = process.env.TEABLE_API_KEY || '';

const VALID_DIGEST_TYPES = ['community', 'immigration', 'deals', 'jobs', 'events'] as const;
const VALID_FREQUENCIES = ['daily', 'weekly', 'never'] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, digest_types, frequency, whatsapp_opted_in, whatsapp_number, city, state } = body;

    // Validate required field: email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { message: 'Email is required to update preferences.' },
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

    // Build update payload - only include provided fields
    const updatePayload: Record<string, unknown> = {};
    if (digest_types !== undefined) updatePayload.digest_types = digest_types;
    if (frequency !== undefined) updatePayload.frequency = frequency;
    if (whatsapp_opted_in !== undefined) updatePayload.whatsapp_opted_in = whatsapp_opted_in;
    if (whatsapp_number !== undefined) updatePayload.whatsapp_number = whatsapp_number;
    if (city !== undefined) updatePayload.city = city;
    if (state !== undefined) updatePayload.state = state;
    updatePayload.updated_at = new Date().toISOString();

    // Call Teable API to update preferences
    const response = await fetch(
      `${TEABLE_API_URL}/newsletter/subscriptions?email=${encodeURIComponent(email.trim().toLowerCase())}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEABLE_API_KEY}`,
        },
        body: JSON.stringify(updatePayload),
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { message: 'No subscription found for this email.' },
          { status: 404 },
        );
      }
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || 'Failed to update preferences.' },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
