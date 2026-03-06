/**
 * Event Submit API Route
 * POST: Create new event submission
 * Requires authentication (auth_session cookie)
 */

import { NextRequest, NextResponse } from 'next/server';

const TEABLE_API_URL = process.env.TEABLE_API_URL || 'http://localhost:3002/api';
const TEABLE_API_KEY = process.env.TEABLE_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('auth_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Validate required fields
    const { title, description, category, city, state, starts_at } = body;

    if (!title || !description || !category || !city || !state || !starts_at) {
      return NextResponse.json(
        {
          error: 'Missing required fields: title, description, category, city, state, starts_at',
        },
        { status: 400 },
      );
    }

    // Call Teable API to create event
    const response = await fetch(`${TEABLE_API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEABLE_API_KEY}`,
        'Cookie': `auth_session=${sessionCookie}`,
      },
      body: JSON.stringify({
        title,
        description,
        category,
        venue_name: body.venue_name || null,
        address: body.address || null,
        city,
        state,
        is_virtual: body.is_virtual || false,
        virtual_url: body.virtual_url || null,
        image_url: body.image_url || null,
        organizer_name: body.organizer_name || null,
        organizer_contact: body.organizer_contact || null,
        ticket_url: body.ticket_url || null,
        is_free: body.is_free !== false,
        price: body.price || null,
        starts_at,
        ends_at: body.ends_at || null,
        submission_source: 'website',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error || 'Failed to create event' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Event submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
