/**
 * Newsletter Subscription Lookup API Route
 * GET: Look up a subscription by email address
 * No authentication required (used from email-preferences page)
 */

import { NextRequest, NextResponse } from 'next/server';

const TEABLE_API_URL = process.env.TEABLE_API_URL || 'http://localhost:3002/api';
const TEABLE_API_KEY = process.env.TEABLE_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { message: 'Email query parameter is required.' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Call Teable API to look up subscription
    const response = await fetch(
      `${TEABLE_API_URL}/newsletter/subscriptions?email=${encodeURIComponent(normalizedEmail)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEABLE_API_KEY}`,
        },
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
        { message: error.message || 'Failed to look up subscription.' },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Subscription lookup error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
