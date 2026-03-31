import { NextResponse } from 'next/server'

/**
 * PDF upload for source-ingestion admin is disabled until SourceDocument and related models exist.
 */
export async function POST(_request: Request): Promise<NextResponse> {
  return NextResponse.json(
    {
      error:
        'Source document upload is not available in this build (ingestion pipeline schema not deployed).',
    },
    { status: 501 }
  )
}
