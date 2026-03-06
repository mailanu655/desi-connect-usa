/**
 * Admin Dashboard Stats API Route (Week 14)
 * GET: Retrieve overall dashboard statistics
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // TODO: Wire to real database queries
    const stats = {
      total_users: 0,
      active_users_today: 0,
      new_users_this_week: 0,
      total_businesses: 0,
      pending_approvals: 0,
      flagged_content: 0,
      total_events: 0,
      total_deals: 0,
      total_news: 0,
      total_forum_threads: 0,
      total_reviews: 0,
      moderation_queue_size: 0,
      avg_response_time_hours: 0,
      content_published_today: 0,
    };

    return NextResponse.json({ data: stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dashboard stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
