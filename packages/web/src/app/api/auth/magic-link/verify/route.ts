/**
 * Verify magic link endpoint
 * Verifies the magic link token and creates a session
 */

import { NextRequest, NextResponse } from 'next/server';

const MIDDLEWARE_URL = process.env.MIDDLEWARE_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 },
      );
    }

    // Call middleware to verify magic link
    const response = await fetch(`${MIDDLEWARE_URL}/api/auth/magic-link/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'Failed to verify magic link' },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Create response with session cookie
    const res = NextResponse.json(data);

    if (data.session) {
      res.cookies.set('auth_session', data.session.session_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      if (data.user) {
        res.cookies.set('auth_user', JSON.stringify(data.user), {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
          path: '/',
        });
      }
    }

    return res;
  } catch (error) {
    console.error('Magic link verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
