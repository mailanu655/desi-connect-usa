/**
 * WhatsApp Templates API Route
 * 
 * GET: List all available pre-approved WhatsApp templates
 * - Returns all templates with compliance information
 * - Each template includes type, SID, and content variables
 * - Templates are pre-approved for Meta 2026 compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import type { WhatsAppTemplate, TemplateType } from '@desi-connect/shared';
import { getAllTemplates } from '@/lib/whatsapp';

interface TemplatesResponse {
  templates: WhatsAppTemplate[];
  total: number;
}

export async function GET(request: NextRequest): Promise<NextResponse<TemplatesResponse>> {
  try {
    // Get all available templates
    const templates = getAllTemplates();

    return NextResponse.json(
      {
        templates,
        total: templates.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('WhatsApp templates error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch templates',
      } as any,
      { status: 500 }
    );
  }
}
