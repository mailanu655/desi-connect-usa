export const dynamic = 'force-dynamic';
/**
 * User Profile API Route
 * GET: Retrieve user profile
 * POST: Update user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const data = await apiClient.getUserProfile();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate that at least one field is provided
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'At least one field is required to update profile' },
        { status: 400 }
      );
    }

    const data = await apiClient.updateUserProfile(body);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
