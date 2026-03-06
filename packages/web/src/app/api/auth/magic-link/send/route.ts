export const dynamic = 'force-dynamic';
/**
 * Send magic link endpoint
 * Sends an authentication link to the provided email
 */

import { NextRequest, NextResponse } from 'next/server';

const MIDDLEWARE_URL = process.env.MIDDLEWARE_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 },
      );
    }

    // Call middleware to send magic link
    const response = await fetch(`${MIDDLEWARE_URL}/api/auth/magic-link/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'Failed to send magic link' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Magic link send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
