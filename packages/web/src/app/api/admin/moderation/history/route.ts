/**
 * Admin Moderation History API Route (Week 14)
 * GET: Retrieve moderation history for a specific content item
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidContentType } from '@desi-connect-usa/shared';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('content_id');
    const contentType = searchParams.get('content_type');

    if (!contentId) {
      return NextResponse.json(
        { error: 'content_id is required' },
        { status: 400 },
      );
    }

    if (!contentType || !isValidContentType(contentType)) {
      return NextResponse.json(
        { error: 'Valid content_type is required' },
        { status: 400 },
      );
    }

    // TODO: Wire to real database queries
    return NextResponse.json({ data: [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch moderation history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
