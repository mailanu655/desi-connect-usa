export const dynamic = 'force-dynamic';
/**
 * Verify phone OTP endpoint
 * Verifies OTP code and creates a session
 */

import { NextRequest, NextResponse } from 'next/server';

const MIDDLEWARE_URL = process.env.MIDDLEWARE_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, otpCode, verificationId } = body;

    if (!phoneNumber || !otpCode || !verificationId) {
      return NextResponse.json(
        { error: 'Phone number, OTP code, and verification ID are required' },
        { status: 400 },
      );
    }

    // Call middleware to verify OTP
    const response = await fetch(`${MIDDLEWARE_URL}/api/auth/phone-otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, otpCode, verificationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'Failed to verify OTP' },
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
    console.error('Phone OTP verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
