export const dynamic = 'force-dynamic';
/**
 * Newsletter Unsubscribe API Route
 * POST: Unsubscribe an email from the newsletter
 * No authentication required (accessed from email links)
 */

import { NextRequest, NextResponse } from 'next/server';

const TEABLE_API_URL = process.env.TEABLE_API_URL || 'http://localhost:3002/api';
const TEABLE_API_KEY = process.env.TEABLE_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate required field
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { message: 'Email address is required.' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Call Teable API to update subscription status
    const response = await fetch(
      `${TEABLE_API_URL}/newsletter/subscriptions?email=${encodeURIComponent(normalizedEmail)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEABLE_API_KEY}`,
        },
        body: JSON.stringify({
          status: 'unsubscribed',
          updated_at: new Date().toISOString(),
        }),
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
        { message: error.message || 'Failed to unsubscribe.' },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed.',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
