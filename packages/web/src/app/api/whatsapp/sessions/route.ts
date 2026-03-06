export const dynamic = 'force-dynamic';
/**
 * WhatsApp Sessions API Route
 * 
 * GET: List active sessions for admin dashboard
 * - Returns session statistics from getSessionStats()
 * - Useful for monitoring active conversations and bot usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionStats } from '@/lib/whatsapp';

interface SessionStatsResponse {
  total_active_sessions: number;
  sessions_by_intent: Record<string, number>;
  sessions_by_step: Record<string, number>;
  total_collected_data_fields: number;
  oldest_session_age_minutes: number;
  average_session_age_minutes: number;
}

export async function GET(request: NextRequest): Promise<NextResponse<SessionStatsResponse>> {
  try {
    // Get session statistics
    const stats = getSessionStats();

    return NextResponse.json(stats, { status: 200 });
  } catch (error: any) {
    console.error('WhatsApp sessions error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch session statistics',
      } as any,
      { status: 500 }
    );
  }
}
