/**
 * Remove Saved Item API Route
 * DELETE: Remove a saved item by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const data = await apiClient.removeSavedItem(id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error removing saved item:', error);
    return NextResponse.json(
      { error: 'Failed to remove saved item' },
      { status: 500 }
    );
  }
}
