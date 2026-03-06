export const dynamic = 'force-dynamic';
/**
 * Giveaway Entry API Route
 * POST: Submit an entry to a giveaway campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.campaign_id || !body.entry_method) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, entry_method' },
        { status: 400 }
      );
    }

    // Validate email for email_signup method
    if (body.entry_method === 'email_signup' && !body.email) {
      return NextResponse.json(
        { error: 'Email is required for email signup entry' },
        { status: 400 }
      );
    }

    // Validate email format
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const data = await apiClient.enterGiveaway(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to enter giveaway' },
      { status: error.statusCode || 500 }
    );
  }
}
