/**
 * @route POST /api/seeds/create
 * @entity SEED
 * @description Generate shareable seed from artifact
 * @permissions authenticated
 * @body artifactId:string (required) - Source artifact ID
 * @body artifactType:string (required) - BAR | QUEST | CAMPAIGN
 * @body customizableFields:array (optional) - Which fields can be customized
 * @body usageMode:string (optional) - instant | customize | both (default: both)
 * @body maxUses:number (optional) - Maximum uses (null = unlimited)
 * @body expiresAt:string (optional) - ISO timestamp for expiry
 * @body visibility:string (optional) - public | unlisted | private (default: unlisted)
 * @body description:string (optional) - Seed description
 * @body tags:array (optional) - Categorization tags
 * @relationships SEED (creates shareable template from artifact)
 * @energyCost 5 (seed generation cost)
 * @dimensions WHO:creator, WHAT:seed generation, WHERE:artifact sharing, ENERGY:template creation
 * @example POST /api/seeds/create {"artifactId": "bar_123", "artifactType": "BAR", "usageMode": "both"}
 * @agentDiscoverable true
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSeed, type ArtifactType, type UsageMode, type SeedVisibility } from '@/lib/seeds';
import { getCurrentPlayer } from '@/lib/auth';

interface CreateSeedBody {
  artifactId: string;
  artifactType: ArtifactType;
  customizableFields?: string[];
  usageMode?: UsageMode;
  maxUses?: number;
  expiresAt?: string;
  visibility?: SeedVisibility;
  description?: string;
  tags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const player = await getCurrentPlayer();
    if (!player) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateSeedBody;

    // Validate required fields
    if (!body.artifactId || !body.artifactType) {
      return NextResponse.json(
        { error: 'Missing required fields: artifactId, artifactType' },
        { status: 400 }
      );
    }

    const creatorId = player.id;

    // Parse expiry date if provided
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;

    // Generate seed
    const result = await generateSeed(
      body.artifactId,
      body.artifactType,
      creatorId,
      {
        customizableFields: body.customizableFields,
        usageMode: body.usageMode,
        maxUses: body.maxUses,
        expiresAt,
        visibility: body.visibility,
        description: body.description,
        tags: body.tags,
      }
    );

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating seed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
