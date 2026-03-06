/**
 * WhatsApp Opt-In API Route
 * POST: Register a phone number for WhatsApp updates
 * No authentication required (public lead capture endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';

const TEABLE_API_URL = process.env.TEABLE_API_URL || 'http://localhost:3002/api';
const TEABLE_API_KEY = process.env.TEABLE_API_KEY || '';

/** Validate phone number: must have 10+ digits after stripping formatting */
function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/[\s\-\(\)\+]/g, '');
  return /^\d{10,15}$/.test(digits);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone_number, name } = body;

    // Validate required field: phone_number
    if (!phone_number || typeof phone_number !== 'string') {
      return NextResponse.json(
        { message: 'Phone number is required.' },
        { status: 400 },
      );
    }

    if (!isValidPhoneNumber(phone_number)) {
      return NextResponse.json(
        { message: 'Please enter a valid phone number with country code.' },
        { status: 400 },
      );
    }

    // Call Teable API to register WhatsApp opt-in
    const response = await fetch(`${TEABLE_API_URL}/whatsapp/opt-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEABLE_API_KEY}`,
      },
      body: JSON.stringify({
        phone_number: phone_number.trim(),
        name: name?.trim() || undefined,
        opted_in_at: new Date().toISOString(),
        status: 'active',
        source: 'website',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || error.error || 'Failed to opt in. Please try again.' },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(
      {
        success: true,
        opt_in_id: data.id || data.opt_in_id,
        message: 'Successfully opted in to WhatsApp updates!',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('WhatsApp opt-in error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
