/**
 * Seed Generator
 *
 * Generate shareable template links from artifacts (BARs, Quests, Campaigns).
 * Creates seeds with customizable fields and usage configuration.
 */

import { db } from '@/lib/db';
import { nanoid } from 'nanoid';

export type ArtifactType = 'BAR' | 'QUEST' | 'CAMPAIGN';
export type UsageMode = 'instant' | 'customize' | 'both';
export type SeedVisibility = 'public' | 'unlisted' | 'private';

export interface SeedTemplate {
  title: string;
  description: string;
  type?: string;
  allyshipDomain?: string;
  moveType?: string;
  campaignRef?: string;
  inputs?: string[];
  reward?: number;
  // Add other fields as needed
}

export interface GenerateSeedOptions {
  customizableFields?: string[]; // Which fields user can customize
  usageMode?: UsageMode;
  maxUses?: number;
  expiresAt?: Date;
  visibility?: SeedVisibility;
  description?: string;
  tags?: string[];
}

export interface SeedResult {
  id: string;
  token: string;
  shareableUrl: string;
}

/**
 * Generate a seed from a BAR artifact
 */
export async function generateSeedFromBar(
  barId: string,
  creatorId: string,
  options: GenerateSeedOptions = {}
): Promise<SeedResult | { error: string }> {
  try {
    // Fetch the BAR
    const bar = await db.customBar.findUnique({
      where: { id: barId },
    });

    if (!bar) {
      return { error: 'BAR not found' };
    }

    // Build template data from BAR
    const templateData: SeedTemplate = {
      title: bar.title,
      description: bar.description,
      type: bar.type,
      allyshipDomain: bar.allyshipDomain || undefined,
      moveType: bar.moveType || undefined,
      campaignRef: bar.campaignRef || undefined,
      inputs: bar.inputs ? JSON.parse(bar.inputs) : [],
      reward: bar.reward,
    };

    // Default customizable fields for BARs
    const defaultCustomizableFields = ['title', 'description', 'allyshipDomain', 'moveType'];
    const customizableFields = options.customizableFields || defaultCustomizableFields;

    // Generate shareable token
    const token = nanoid(10); // Short, URL-safe token

    // Create seed
    const seed = await db.seed.create({
      data: {
        token,
        creatorId,
        sourceArtifactId: barId,
        sourceArtifactType: 'BAR',
        templateData: JSON.stringify(templateData),
        customizableFields: JSON.stringify(customizableFields),
        usageMode: options.usageMode || 'both',
        maxUses: options.maxUses || null,
        expiresAt: options.expiresAt || null,
        visibility: options.visibility || 'unlisted',
        description: options.description || null,
        tags: JSON.stringify(options.tags || []),
      },
    });

    return {
      id: seed.id,
      token: seed.token,
      shareableUrl: `/seed/use/${seed.token}`,
    };
  } catch (error) {
    console.error('Error generating seed from BAR:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate a seed from a Quest artifact
 */
export async function generateSeedFromQuest(
  questId: string,
  creatorId: string,
  options: GenerateSeedOptions = {}
): Promise<SeedResult | { error: string }> {
  try {
    // Fetch the Quest (CustomBar with type='quest_seed' or similar)
    const quest = await db.customBar.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      return { error: 'Quest not found' };
    }

    // Build template data
    const templateData: SeedTemplate = {
      title: quest.title,
      description: quest.description,
      type: quest.type,
      allyshipDomain: quest.allyshipDomain || undefined,
      campaignRef: quest.campaignRef || undefined,
      reward: quest.reward,
    };

    const defaultCustomizableFields = ['title', 'description', 'allyshipDomain'];
    const customizableFields = options.customizableFields || defaultCustomizableFields;

    const token = nanoid(10);

    const seed = await db.seed.create({
      data: {
        token,
        creatorId,
        sourceArtifactId: questId,
        sourceArtifactType: 'QUEST',
        templateData: JSON.stringify(templateData),
        customizableFields: JSON.stringify(customizableFields),
        usageMode: options.usageMode || 'both',
        maxUses: options.maxUses || null,
        expiresAt: options.expiresAt || null,
        visibility: options.visibility || 'unlisted',
        description: options.description || null,
        tags: JSON.stringify(options.tags || []),
      },
    });

    return {
      id: seed.id,
      token: seed.token,
      shareableUrl: `/seed/use/${seed.token}`,
    };
  } catch (error) {
    console.error('Error generating seed from Quest:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate a seed from a Campaign artifact
 */
export async function generateSeedFromCampaign(
  campaignId: string,
  creatorId: string,
  options: GenerateSeedOptions = {}
): Promise<SeedResult | { error: string }> {
  try {
    // Fetch the Campaign (Instance)
    const campaign = await db.instance.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return { error: 'Campaign not found' };
    }

    // Build template data
    const templateData = {
      name: campaign.name,
      slug: campaign.slug,
      domainType: campaign.domainType,
      targetDescription: campaign.targetDescription || undefined,
      allyshipDomain: campaign.allyshipDomain || undefined,
      theme: campaign.theme || undefined,
    };

    const defaultCustomizableFields = ['name', 'slug', 'targetDescription', 'theme'];
    const customizableFields = options.customizableFields || defaultCustomizableFields;

    const token = nanoid(10);

    const seed = await db.seed.create({
      data: {
        token,
        creatorId,
        sourceArtifactId: campaignId,
        sourceArtifactType: 'CAMPAIGN',
        templateData: JSON.stringify(templateData),
        customizableFields: JSON.stringify(customizableFields),
        usageMode: options.usageMode || 'both',
        maxUses: options.maxUses || null,
        expiresAt: options.expiresAt || null,
        visibility: options.visibility || 'unlisted',
        description: options.description || null,
        tags: JSON.stringify(options.tags || []),
      },
    });

    return {
      id: seed.id,
      token: seed.token,
      shareableUrl: `/seed/use/${seed.token}`,
    };
  } catch (error) {
    console.error('Error generating seed from Campaign:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unified seed generator - detects artifact type and delegates
 */
export async function generateSeed(
  artifactId: string,
  artifactType: ArtifactType,
  creatorId: string,
  options: GenerateSeedOptions = {}
): Promise<SeedResult | { error: string }> {
  switch (artifactType) {
    case 'BAR':
    case 'QUEST':
      return generateSeedFromBar(artifactId, creatorId, options);
    case 'CAMPAIGN':
      return generateSeedFromCampaign(artifactId, creatorId, options);
    default:
      return { error: `Unsupported artifact type: ${artifactType}` };
  }
}

/**
 * Get seed details by token
 */
export async function getSeedByToken(token: string) {
  try {
    const seed = await db.seed.findUnique({
      where: { token },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!seed) {
      return null;
    }

    // Check if expired
    if (seed.expiresAt && seed.expiresAt < new Date()) {
      return { error: 'Seed has expired' };
    }

    // Check if max uses reached
    if (seed.maxUses && seed.currentUses >= seed.maxUses) {
      return { error: 'Seed has reached maximum uses' };
    }

    return {
      ...seed,
      templateData: JSON.parse(seed.templateData),
      customizableFields: JSON.parse(seed.customizableFields),
      tags: JSON.parse(seed.tags),
    };
  } catch (error) {
    console.error('Error fetching seed:', error);
    return { error: 'Failed to fetch seed' };
  }
}
