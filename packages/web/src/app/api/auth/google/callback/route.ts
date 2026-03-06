/**
 * Google OAuth callback endpoint
 * Exchanges OAuth code for tokens and creates a session
 */

import { NextRequest, NextResponse } from 'next/server';

const MIDDLEWARE_URL = process.env.MIDDLEWARE_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 },
      );
    }

    // Exchange code for tokens via middleware
    const response = await fetch(`${MIDDLEWARE_URL}/api/auth/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        state,
        redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'Authentication failed' },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Create response with session cookie
    const res = NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/`);

    if (data.session) {
      res.cookies.set('auth_session', data.session.session_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      res.cookies.set('auth_user', JSON.stringify(data.user), {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
    }

    return res;
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
