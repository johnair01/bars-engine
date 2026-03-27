/**
 * @route POST /api/wiki-drafts/:id/review
 * @entity WIKI
 * @description Review and approve/reject AI-generated wiki draft
 * @permissions admin
 * @params id:string (path, required) - Draft identifier
 * @body status:string (required) - "approved" or "rejected"
 * @body reviewNotes:string (optional) - Reason for rejection or approval notes
 * @relationships WIKI (draft approval workflow)
 * @energyCost 0 (admin action)
 * @dimensions WHO:admin, WHAT:draft approval, WHERE:admin panel, ENERGY:content moderation
 * @example POST /api/wiki-drafts/draft_123/review {"status": "approved"}
 * @agentDiscoverable false
 */

import { NextRequest, NextResponse } from 'next/server';
import { reviewDraft } from '@/lib/wiki/draft-generator';

interface ReviewRequestBody {
  status: 'approved' | 'rejected';
  reviewNotes?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as ReviewRequestBody;

    // Validate request
    if (!body.status || !['approved', 'rejected'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // TODO: Get actual admin user ID from session
    const reviewedBy = 'admin'; // Placeholder

    // Review the draft
    const result = await reviewDraft(
      id,
      body.status,
      reviewedBy,
      body.reviewNotes
    );

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error reviewing draft:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
