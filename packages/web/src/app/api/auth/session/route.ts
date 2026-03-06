export const dynamic = 'force-dynamic';
/**
 * Session endpoint
 * GET: Get current user session
 * DELETE: Logout (clear session cookie)
 */

import { NextRequest, NextResponse } from 'next/server';

const MIDDLEWARE_URL = process.env.MIDDLEWARE_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('auth_session')?.value;
    const userCookie = request.cookies.get('auth_user')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { session: null },
        { status: 200 },
      );
    }

    // Call middleware to validate session
    const response = await fetch(`${MIDDLEWARE_URL}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `auth_session=${sessionCookie}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { session: null },
        { status: 200 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { session: null },
      { status: 200 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const res = NextResponse.json({ success: true, message: 'Logged out successfully' });

    // Clear session cookies
    res.cookies.delete('auth_session');
    res.cookies.delete('auth_user');

    return res;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
