export const dynamic = 'force-dynamic';
/**
 * Admin Moderation Stats API Route (Week 14)
 * GET: Retrieve moderation statistics
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // TODO: Wire to real database queries
    const stats = {
      pending_items: 0,
      flagged_items: 0,
      approved_today: 0,
      rejected_today: 0,
      avg_review_time_minutes: 0,
      by_content_type: {
        business: { pending: 0, flagged: 0, approved: 0, rejected: 0 },
        news: { pending: 0, flagged: 0, approved: 0, rejected: 0 },
        event: { pending: 0, flagged: 0, approved: 0, rejected: 0 },
        deal: { pending: 0, flagged: 0, approved: 0, rejected: 0 },
        review: { pending: 0, flagged: 0, approved: 0, rejected: 0 },
        forum_thread: { pending: 0, flagged: 0, approved: 0, rejected: 0 },
        forum_reply: { pending: 0, flagged: 0, approved: 0, rejected: 0 },
        consultancy: { pending: 0, flagged: 0, approved: 0, rejected: 0 },
        job: { pending: 0, flagged: 0, approved: 0, rejected: 0 },
      },
    };

    return NextResponse.json({ data: stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch moderation stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
