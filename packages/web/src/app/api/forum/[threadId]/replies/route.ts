export const dynamic = 'force-dynamic';
/**
 * Thread Replies API Route
 * GET: List replies for a thread (paginated)
 * POST: Create reply (validates using validateReplyInput from '@/lib/forum')
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';
import { validateReplyInput } from '@/lib/forum';

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;
    const { searchParams } = new URL(request.url);
    const params_obj: Record<string, string | number> = {};

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    if (page) params_obj.page = parseInt(page, 10);
    if (limit) params_obj.limit = parseInt(limit, 10);

    const data = await apiClient.getForumReplies(threadId, params_obj as any);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch replies' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;
    const body = await request.json();

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Set thread_id in the body if not already present
    const replyInput = {
      ...body,
      thread_id: threadId,
    };

    // Validate reply input
    const validation = validateReplyInput(replyInput);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const data = await apiClient.createForumReply(replyInput);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create reply' },
      { status: error.statusCode || 500 }
    );
  }
}
