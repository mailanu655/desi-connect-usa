export const dynamic = 'force-dynamic';
/**
 * User Submissions API Route
 * GET: Retrieve user submissions with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');
    const parsedPage = pageStr ? parseInt(pageStr, 10) : undefined;
    const parsedLimit = limitStr ? parseInt(limitStr, 10) : undefined;

    const params = {
      content_type: searchParams.get('content_type') || undefined,
      status: searchParams.get('status') || undefined,
      page: parsedPage && !isNaN(parsedPage) ? parsedPage : undefined,
      limit: parsedLimit && !isNaN(parsedLimit) ? parsedLimit : undefined,
    };

    const data = await apiClient.getUserSubmissions(params);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user submissions' },
      { status: 500 }
    );
  }
}
