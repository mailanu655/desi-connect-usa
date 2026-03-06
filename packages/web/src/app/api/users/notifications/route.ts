export const dynamic = 'force-dynamic';
/**
 * Notification Preferences API Route
 * GET: Retrieve notification preferences
 * POST: Update notification preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const data = await apiClient.getNotificationPreferences();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate that preferences array is provided
    if (!Array.isArray(body.preferences)) {
      return NextResponse.json(
        { error: 'preferences must be an array' },
        { status: 400 }
      );
    }

    const data = await apiClient.updateNotificationPreferences(body.preferences);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
