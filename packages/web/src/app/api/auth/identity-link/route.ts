export const dynamic = 'force-dynamic';
/**
 * Identity linking endpoint
 * POST: Initiate identity linking (send OTP)
 * PUT: Complete identity linking (verify OTP)
 */

import { NextRequest, NextResponse } from 'next/server';

const MIDDLEWARE_URL = process.env.MIDDLEWARE_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 },
      );
    }

    const sessionCookie = request.cookies.get('auth_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    // Call middleware to initiate identity link
    const response = await fetch(`${MIDDLEWARE_URL}/api/auth/identity-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `auth_session=${sessionCookie}`,
      },
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'Failed to initiate identity link' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Identity link initiate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, otpCode, verificationId } = body;

    if (!phoneNumber || !otpCode || !verificationId) {
      return NextResponse.json(
        { error: 'Phone number, OTP code, and verification ID are required' },
        { status: 400 },
      );
    }

    const sessionCookie = request.cookies.get('auth_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    // Call middleware to complete identity link
    const response = await fetch(`${MIDDLEWARE_URL}/api/auth/identity-link`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `auth_session=${sessionCookie}`,
      },
      body: JSON.stringify({ phoneNumber, otpCode, verificationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'Failed to complete identity link' },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Update user cookie if user data is provided
    const res = NextResponse.json(data);

    if (data.user) {
      res.cookies.set('auth_user', JSON.stringify(data.user), {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
    }

    return res;
  } catch (error) {
    console.error('Identity link complete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
