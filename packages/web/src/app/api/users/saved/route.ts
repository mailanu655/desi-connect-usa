export const dynamic = 'force-dynamic';
/**
 * Saved Items API Route
 * GET: Retrieve saved items with filters
 * POST: Save a new item
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params = {
      item_type: searchParams.get('item_type') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
    };

    const data = await apiClient.getSavedItems(params);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching saved items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.item_type || !body.item_id) {
      return NextResponse.json(
        { error: 'item_type and item_id are required' },
        { status: 400 }
      );
    }

    const data = await apiClient.saveItem(body.item_type, body.item_id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving item:', error);
    return NextResponse.json(
      { error: 'Failed to save item' },
      { status: 500 }
    );
  }
}
