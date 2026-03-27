/**
 * @route POST /api/wiki-drafts/generate
 * @entity WIKI
 * @description Generate AI wiki draft for an artifact
 * @permissions authenticated
 * @body artifactId:string (required) - Artifact identifier
 * @body artifactType:string (required) - Entity type (BAR, QUEST, CAMPAIGN, etc.)
 * @body options:object (optional) - Generation options (maxLineageDepth, includeUsageExamples, tone)
 * @relationships WIKI (creates draft for artifact)
 * @energyCost 10 (AI generation cost)
 * @dimensions WHO:creator, WHAT:draft generation, WHERE:wiki, ENERGY:AI processing
 * @example POST /api/wiki-drafts/generate {"artifactId": "bar_123", "artifactType": "BAR"}
 * @agentDiscoverable true
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateWikiDraft, type EntityType } from '@/lib/wiki/draft-generator';

interface GenerateRequestBody {
  artifactId: string;
  artifactType: EntityType;
  options?: {
    maxLineageDepth?: number;
    includeUsageExamples?: boolean;
    tone?: 'technical' | 'narrative' | 'beginner-friendly';
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequestBody;

    // Validate request
    if (!body.artifactId || !body.artifactType) {
      return NextResponse.json(
        { error: 'Missing required fields: artifactId, artifactType' },
        { status: 400 }
      );
    }

    // Generate draft
    const result = await generateWikiDraft(
      body.artifactId,
      body.artifactType,
      body.options
    );

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error generating draft:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
