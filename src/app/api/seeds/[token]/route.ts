/**
 * @route GET /api/seeds/:token
 * @entity SEED
 * @description Fetch seed details and template by token
 * @permissions public
 * @params token:string (path, required) - Seed shareable token
 * @relationships SEED (retrieves template data)
 * @energyCost 0 (read operation)
 * @dimensions WHO:viewer, WHAT:seed lookup, WHERE:sharing, ENERGY:template preview
 * @example /api/seeds/abc123xyz
 * @agentDiscoverable true
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSeedByToken } from '@/lib/seeds';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const result = await getSeedByToken(token);

    if (!result) {
      return NextResponse.json({ error: 'Seed not found' }, { status: 404 });
    }

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching seed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
