/**
 * Wiki Draft Generator
 *
 * AI-powered wiki page draft generation for artifacts.
 * Analyzes artifact metadata, lineage context, and relationships
 * to generate comprehensive documentation drafts.
 */

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getArtifactLineage, getLineageStats, type EntityType, type LineageNode } from './lineage-queries';
import { db } from '@/lib/db';

// Re-export EntityType for external use
export type { EntityType } from './lineage-queries';

export interface WikiDraft {
  id: string;
  artifactId: string;
  artifactType: EntityType;
  title: string;
  summary: string;
  provenanceExplanation: string;
  relationshipDocumentation: string;
  usageExamples: string[];
  metadata: {
    generatedAt: Date;
    modelUsed: string;
    lineageDepth: number;
    relationshipCount: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

interface GenerateDraftOptions {
  maxLineageDepth?: number;
  includeUsageExamples?: boolean;
  tone?: 'technical' | 'narrative' | 'beginner-friendly';
}

/**
 * Generate a wiki draft for an artifact
 */
export async function generateWikiDraft(
  artifactId: string,
  artifactType: EntityType,
  options: GenerateDraftOptions = {}
): Promise<WikiDraft | { error: string }> {
  const {
    maxLineageDepth = 5,
    includeUsageExamples = true,
    tone = 'technical',
  } = options;

  try {
    // Fetch artifact lineage
    const lineage = await getArtifactLineage(artifactId, artifactType);
    if (!lineage) {
      return { error: `Artifact not found: ${artifactType} ${artifactId}` };
    }

    // Get lineage statistics
    const stats = await getLineageStats(artifactId, artifactType);

    // Build context for AI
    const context = buildContext(lineage, stats, maxLineageDepth);

    // Generate draft using AI
    const prompt = buildPrompt(context, tone, includeUsageExamples);

    const { text } = await generateText({
      model: openai('gpt-4-turbo'),
      prompt,
      temperature: 0.7,
      maxOutputTokens: 2000,
    });

    // Parse AI response
    const sections = parseAIResponse(text);

    // Create draft object
    const draft: Omit<WikiDraft, 'id'> = {
      artifactId,
      artifactType,
      title: lineage.title,
      summary: sections.summary || '',
      provenanceExplanation: sections.provenance || '',
      relationshipDocumentation: sections.relationships || '',
      usageExamples: sections.examples || [],
      metadata: {
        generatedAt: new Date(),
        modelUsed: 'gpt-4-turbo',
        lineageDepth: stats.maxDepth,
        relationshipCount: lineage.relationships.length,
      },
      status: 'pending',
    };

    // Store draft in database
    const savedDraft = await db.wikiDraft.create({
      data: {
        artifactId: draft.artifactId,
        artifactType: draft.artifactType,
        title: draft.title,
        summary: draft.summary,
        provenanceExplanation: draft.provenanceExplanation,
        relationshipDocumentation: draft.relationshipDocumentation,
        usageExamples: JSON.stringify(draft.usageExamples),
        metadata: JSON.stringify(draft.metadata),
        status: draft.status,
      },
    });

    return {
      id: savedDraft.id,
      ...draft,
    };
  } catch (error) {
    console.error('Error generating wiki draft:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all pending drafts for review
 */
export async function getPendingDrafts(): Promise<WikiDraft[]> {
  const drafts = await db.wikiDraft.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
  });

  return drafts.map(draft => ({
    id: draft.id,
    artifactId: draft.artifactId,
    artifactType: draft.artifactType as EntityType,
    title: draft.title,
    summary: draft.summary,
    provenanceExplanation: draft.provenanceExplanation,
    relationshipDocumentation: draft.relationshipDocumentation,
    usageExamples: JSON.parse(draft.usageExamples),
    metadata: JSON.parse(draft.metadata),
    status: draft.status as 'pending' | 'approved' | 'rejected',
    reviewNotes: draft.reviewNotes || undefined,
    reviewedBy: draft.reviewedBy || undefined,
    reviewedAt: draft.reviewedAt || undefined,
  }));
}

/**
 * Review and approve/reject a draft
 */
export async function reviewDraft(
  draftId: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
  reviewNotes?: string
): Promise<WikiDraft | { error: string }> {
  try {
    const draft = await db.wikiDraft.update({
      where: { id: draftId },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      },
    });

    return {
      id: draft.id,
      artifactId: draft.artifactId,
      artifactType: draft.artifactType as EntityType,
      title: draft.title,
      summary: draft.summary,
      provenanceExplanation: draft.provenanceExplanation,
      relationshipDocumentation: draft.relationshipDocumentation,
      usageExamples: JSON.parse(draft.usageExamples),
      metadata: JSON.parse(draft.metadata),
      status: draft.status as 'pending' | 'approved' | 'rejected',
      reviewNotes: draft.reviewNotes || undefined,
      reviewedBy: draft.reviewedBy || undefined,
      reviewedAt: draft.reviewedAt || undefined,
    };
  } catch (error) {
    console.error('Error reviewing draft:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update draft content
 */
export async function updateDraft(
  draftId: string,
  updates: Partial<Pick<WikiDraft, 'summary' | 'provenanceExplanation' | 'relationshipDocumentation' | 'usageExamples'>>
): Promise<WikiDraft | { error: string }> {
  try {
    const data: any = {};
    if (updates.summary !== undefined) data.summary = updates.summary;
    if (updates.provenanceExplanation !== undefined) data.provenanceExplanation = updates.provenanceExplanation;
    if (updates.relationshipDocumentation !== undefined) data.relationshipDocumentation = updates.relationshipDocumentation;
    if (updates.usageExamples !== undefined) data.usageExamples = JSON.stringify(updates.usageExamples);

    const draft = await db.wikiDraft.update({
      where: { id: draftId },
      data,
    });

    return {
      id: draft.id,
      artifactId: draft.artifactId,
      artifactType: draft.artifactType as EntityType,
      title: draft.title,
      summary: draft.summary,
      provenanceExplanation: draft.provenanceExplanation,
      relationshipDocumentation: draft.relationshipDocumentation,
      usageExamples: JSON.parse(draft.usageExamples),
      metadata: JSON.parse(draft.metadata),
      status: draft.status as 'pending' | 'approved' | 'rejected',
      reviewNotes: draft.reviewNotes || undefined,
      reviewedBy: draft.reviewedBy || undefined,
      reviewedAt: draft.reviewedAt || undefined,
    };
  } catch (error) {
    console.error('Error updating draft:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper: Build context from lineage
function buildContext(lineage: LineageNode, stats: any, maxDepth: number): string {
  const lines: string[] = [];

  lines.push(`# Artifact: ${lineage.title}`);
  lines.push(`Type: ${lineage.type}`);
  lines.push(`ID: ${lineage.id}`);
  lines.push('');

  if (lineage.description) {
    lines.push(`Description: ${lineage.description}`);
    lines.push('');
  }

  lines.push('## Metadata');
  for (const [key, value] of Object.entries(lineage.metadata)) {
    lines.push(`- ${key}: ${JSON.stringify(value)}`);
  }
  lines.push('');

  if (lineage.relationships.length > 0) {
    lines.push('## Relationships');
    for (const rel of lineage.relationships) {
      lines.push(`- ${rel.type} → ${rel.targetType} (${rel.targetId})`);
    }
    lines.push('');
  }

  lines.push('## Lineage Statistics');
  lines.push(`- Total nodes: ${stats.totalNodes}`);
  lines.push(`- Max depth: ${stats.maxDepth}`);
  lines.push(`- Branches: ${stats.branchCount}`);
  lines.push('');

  if (Object.keys(stats.entityDistribution).length > 0) {
    lines.push('## Entity Distribution');
    for (const [entity, count] of Object.entries(stats.entityDistribution)) {
      lines.push(`- ${entity}: ${count}`);
    }
    lines.push('');
  }

  // Include children up to maxDepth
  if (lineage.children.length > 0) {
    lines.push('## Descendants (first level)');
    for (const child of lineage.children.slice(0, 5)) {
      lines.push(`- ${child.type}: ${child.title} (${child.id})`);
    }
    if (lineage.children.length > 5) {
      lines.push(`... and ${lineage.children.length - 5} more`);
    }
  }

  return lines.join('\n');
}

// Helper: Build AI prompt
function buildPrompt(context: string, tone: string, includeExamples: boolean): string {
  return `You are a technical documentation writer for the BARs Engine wiki system.

Generate comprehensive wiki documentation for the following artifact based on its metadata and lineage context.

${context}

Please generate the following sections:

1. **SUMMARY** (2-3 paragraphs)
   - Concise overview of what this artifact is
   - Its purpose and role in the system
   - Key characteristics and properties

2. **PROVENANCE** (1-2 paragraphs)
   - Explain the artifact's lineage and history
   - Describe relationships to parent/child artifacts
   - Explain the significance of the provenance tree

3. **RELATIONSHIPS** (bullet points)
   - Document each relationship type
   - Explain what each relationship means
   - Describe how the artifact connects to others

${includeExamples ? `
4. **EXAMPLES** (3-5 usage examples)
   - Practical examples of how to use/reference this artifact
   - URL patterns for deep linking
   - Common use cases
` : ''}

Tone: ${tone}

Format your response with clear section headers using "###" for each section.`;
}

// Helper: Parse AI response into sections
function parseAIResponse(text: string): {
  summary?: string;
  provenance?: string;
  relationships?: string;
  examples?: string[];
} {
  const sections: any = {};

  // Split by section headers
  const summaryMatch = text.match(/###\s*SUMMARY\s*\n([\s\S]*?)(?=###|$)/i);
  const provenanceMatch = text.match(/###\s*PROVENANCE\s*\n([\s\S]*?)(?=###|$)/i);
  const relationshipsMatch = text.match(/###\s*RELATIONSHIPS\s*\n([\s\S]*?)(?=###|$)/i);
  const examplesMatch = text.match(/###\s*EXAMPLES\s*\n([\s\S]*?)(?=###|$)/i);

  if (summaryMatch) sections.summary = summaryMatch[1].trim();
  if (provenanceMatch) sections.provenance = provenanceMatch[1].trim();
  if (relationshipsMatch) sections.relationships = relationshipsMatch[1].trim();

  if (examplesMatch) {
    // Parse examples as bullet points
    const exampleText = examplesMatch[1];
    const exampleLines = exampleText.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'));
    sections.examples = exampleLines.map(line => line.replace(/^[\s\-\*]+/, '').trim());
  }

  return sections;
}
