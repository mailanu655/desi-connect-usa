/**
 * Refresh session endpoint
 * POST: Refresh the current session
 */

import { NextRequest, NextResponse } from 'next/server';

const MIDDLEWARE_URL = process.env.MIDDLEWARE_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('auth_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 },
      );
    }

    // Call middleware to refresh session
    const response = await fetch(`${MIDDLEWARE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `auth_session=${sessionCookie}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'Failed to refresh session' },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Update session cookie if new one is provided
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
    console.error('Session refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
