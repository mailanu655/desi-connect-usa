/**
 * Admin Approval Workflow Stats API Route (Week 14)
 * GET: Retrieve approval workflow statistics
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // TODO: Wire to real database queries
    const stats = {
      total_pending: 0,
      total_approved: 0,
      total_rejected: 0,
      total_needs_revision: 0,
      avg_approval_time_hours: 0,
      by_content_type: {},
      by_priority: {
        urgent: 0,
        high: 0,
        normal: 0,
        low: 0,
      },
    };

    return NextResponse.json({ data: stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch approval stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
