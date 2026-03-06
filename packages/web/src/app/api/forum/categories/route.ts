export const dynamic = 'force-dynamic';
/**
 * Forum Categories API Route
 * GET: List all categories (returns getDefaultCategories from '@/lib/forum')
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDefaultCategories } from '@/lib/forum';

export async function GET(request: NextRequest) {
  try {
    const categories = getDefaultCategories();
    return NextResponse.json({
      data: categories,
      total: categories.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: error.statusCode || 500 }
    );
  }
}
