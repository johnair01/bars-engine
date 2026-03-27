/**
 * @route POST /api/seeds/use/:token
 * @entity SEED
 * @description Use seed to create artifact from template
 * @permissions public (creates artifact with seed creator as owner if anonymous)
 * @params token:string (path, required) - Seed shareable token
 * @body mode:string (required) - instant | customize
 * @body customizations:object (optional) - Template customizations (customize mode only)
 * @relationships SEED (consumes seed to create artifact)
 * @energyCost 10 (artifact creation from template)
 * @dimensions WHO:user, WHAT:artifact creation, WHERE:seed usage, ENERGY:template instantiation
 * @example POST /api/seeds/use/abc123xyz {"mode": "instant"}
 * @agentDiscoverable true
 */

import { NextRequest, NextResponse } from 'next/server';
import { useSeed, type SeedTemplate } from '@/lib/seeds';

interface UseSeedBody {
  mode: 'instant' | 'customize';
  customizations?: Partial<SeedTemplate>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = (await request.json()) as UseSeedBody;

    // Validate mode
    if (!body.mode || !['instant', 'customize'].includes(body.mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "instant" or "customize"' },
        { status: 400 }
      );
    }

    // Validate customizations for customize mode
    if (body.mode === 'customize' && !body.customizations) {
      return NextResponse.json(
        { error: 'Customizations required for customize mode' },
        { status: 400 }
      );
    }

    // TODO: Get actual user ID from session (null = anonymous)
    const userId = undefined; // Placeholder

    // Use seed
    const result = await useSeed(token, {
      userId,
      mode: body.mode,
      customizations: body.customizations,
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error using seed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
