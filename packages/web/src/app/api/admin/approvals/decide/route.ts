/**
 * Admin Approval Decision API Route (Week 14)
 * POST: Submit an approval decision
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApprovalDecision } from '@desi-connect/shared';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateApprovalDecision(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 },
      );
    }

    // TODO: Wire to real database + audit log
    return NextResponse.json({
      data: {
        success: true,
        message: `Decision '${body.decision}' applied to request ${body.request_id}`,
        action_id: `appr_${Date.now()}`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit approval decision';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
