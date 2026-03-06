/**
 * Event RSVP API Route
 * GET: Check if current user has RSVP'd to event
 * POST: Create RSVP record
 * DELETE: Cancel RSVP
 */

import { NextRequest, NextResponse } from 'next/server';

const TEABLE_API_URL = process.env.TEABLE_API_URL || 'http://localhost:3002/api';
const TEABLE_API_KEY = process.env.TEABLE_API_KEY || '';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const eventId = params.id;
    const sessionCookie = request.cookies.get('auth_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ hasRsvped: false }, { status: 200 });
    }

    // Call Teable API to check if user has RSVP'd
    const response = await fetch(
      `${TEABLE_API_URL}/events/${eventId}/rsvp/check`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEABLE_API_KEY}`,
          'Cookie': `auth_session=${sessionCookie}`,
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ hasRsvped: false }, { status: 200 });
      }
      return NextResponse.json({ hasRsvped: false }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('RSVP check error:', error);
    return NextResponse.json({ hasRsvped: false }, { status: 200 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const eventId = params.id;
    const sessionCookie = request.cookies.get('auth_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { userId, status = 'going' } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }

    // Call Teable API to create RSVP record
    const response = await fetch(`${TEABLE_API_URL}/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEABLE_API_KEY}`,
        'Cookie': `auth_session=${sessionCookie}`,
      },
      body: JSON.stringify({
        event_id: eventId,
        user_id: userId,
        status,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error || 'Failed to create RSVP' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('RSVP creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const eventId = params.id;
    const sessionCookie = request.cookies.get('auth_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }

    // Call Teable API to delete RSVP record
    const response = await fetch(
      `${TEABLE_API_URL}/events/${eventId}/rsvp/${userId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEABLE_API_KEY}`,
          'Cookie': `auth_session=${sessionCookie}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error || 'Failed to cancel RSVP' },
        { status: response.status },
      );
    }

    return NextResponse.json(
      { success: true, message: 'RSVP cancelled' },
      { status: 200 },
    );
  } catch (error) {
    console.error('RSVP deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
