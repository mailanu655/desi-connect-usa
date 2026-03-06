export const dynamic = 'force-dynamic';
/**
 * Single Thread API Route
 * GET: Get thread by ID (returns thread + replies)
 * PATCH: Update thread (title, body, status, tags)
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const data = await apiClient.getForumThreadById(threadId);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch thread' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PATCH(
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

    // Validate that at least one field to update is provided
    const allowedFields = ['title', 'body', 'status', 'tags'];
    const hasValidFields = Object.keys(body).some(key => allowedFields.includes(key));

    if (!hasValidFields) {
      return NextResponse.json(
        { error: 'At least one field (title, body, status, tags) is required' },
        { status: 400 }
      );
    }

    const data = await apiClient.updateForumThread(threadId, body);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update thread' },
      { status: error.statusCode || 500 }
    );
  }
}
