/**
 * Seed Usage
 *
 * Use seeds to create artifacts from templates.
 * Handles instant mode (immediate creation) and customize mode (user customization).
 */

import { db } from '@/lib/db';
import type { ArtifactType, SeedTemplate } from './generator';

export interface UseSeedOptions {
  userId?: string; // null for anonymous users
  mode: 'instant' | 'customize';
  customizations?: Partial<SeedTemplate>; // Only for customize mode
}

export interface UseSeedResult {
  artifactId: string;
  artifactType: ArtifactType;
  mode: 'instant' | 'customize';
}

/**
 * Use a seed to create a BAR
 */
async function useSeedForBar(
  seedId: string,
  templateData: SeedTemplate,
  creatorId: string,
  customizations?: Partial<SeedTemplate>
): Promise<string | { error: string }> {
  try {
    // Merge template with customizations
    const finalData = { ...templateData, ...customizations };

    // Create BAR
    const bar = await db.customBar.create({
      data: {
        creatorId,
        title: finalData.title,
        description: finalData.description,
        type: finalData.type || 'vibe',
        allyshipDomain: finalData.allyshipDomain || null,
        moveType: finalData.moveType || null,
        campaignRef: finalData.campaignRef || null,
        inputs: JSON.stringify(finalData.inputs || []),
        reward: finalData.reward || 1,
        visibility: 'public',
        status: 'active',
        // Store seed provenance
        seedMetabolization: JSON.stringify({
          seedId,
          mode: customizations ? 'customize' : 'instant',
          metabolizedAt: new Date().toISOString(),
          customizations: customizations || {},
        }),
      },
    });

    return bar.id;
  } catch (error) {
    console.error('Error creating BAR from seed:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to create BAR',
    };
  }
}

/**
 * Use a seed to create a Campaign
 */
async function useSeedForCampaign(
  seedId: string,
  templateData: any,
  creatorId: string,
  customizations?: any
): Promise<string | { error: string }> {
  try {
    // Merge template with customizations
    const finalData = { ...templateData, ...customizations };

    // Create Instance (Campaign)
    const campaign = await db.instance.create({
      data: {
        slug: finalData.slug,
        name: finalData.name,
        domainType: finalData.domainType || 'community',
        targetDescription: finalData.targetDescription || null,
        allyshipDomain: finalData.allyshipDomain || null,
        theme: finalData.theme || null,
        // Note: creatorId not directly on Instance model
        // Would need to create InstanceMembership with admin role
      },
    });

    // Create admin membership for creator
    await db.instanceMembership.create({
      data: {
        instanceId: campaign.id,
        playerId: creatorId,
        roleKey: 'admin',
      },
    });

    return campaign.id;
  } catch (error) {
    console.error('Error creating Campaign from seed:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to create Campaign',
    };
  }
}

/**
 * Use a seed to create an artifact
 */
export async function useSeed(
  token: string,
  options: UseSeedOptions
): Promise<UseSeedResult | { error: string }> {
  try {
    // Fetch seed
    const seed = await db.seed.findUnique({
      where: { token },
    });

    if (!seed) {
      return { error: 'Seed not found' };
    }

    // Check expiry
    if (seed.expiresAt && seed.expiresAt < new Date()) {
      return { error: 'Seed has expired' };
    }

    // Check max uses
    if (seed.maxUses && seed.currentUses >= seed.maxUses) {
      return { error: 'Seed has reached maximum uses' };
    }

    // Check usage mode compatibility
    if (seed.usageMode === 'instant' && options.mode === 'customize') {
      return { error: 'This seed only supports instant mode' };
    }
    if (seed.usageMode === 'customize' && options.mode === 'instant') {
      return { error: 'This seed requires customization' };
    }

    // Parse template data
    const templateData = JSON.parse(seed.templateData);

    // Determine creator (seed creator if anonymous)
    const creatorId = options.userId || seed.creatorId;

    // Create artifact based on type
    let artifactId: string | { error: string };

    switch (seed.sourceArtifactType) {
      case 'BAR':
      case 'QUEST':
        artifactId = await useSeedForBar(
          seed.id,
          templateData,
          creatorId,
          options.customizations
        );
        break;
      case 'CAMPAIGN':
        artifactId = await useSeedForCampaign(
          seed.id,
          templateData,
          creatorId,
          options.customizations
        );
        break;
      default:
        return { error: 'Unsupported artifact type' };
    }

    if (typeof artifactId === 'object' && 'error' in artifactId) {
      return artifactId;
    }

    // Record usage event
    await db.seedUsageEvent.create({
      data: {
        seedId: seed.id,
        userId: options.userId || null,
        createdArtifactId: artifactId,
        artifactType: seed.sourceArtifactType,
        mode: options.mode,
        customizations: options.customizations
          ? JSON.stringify(options.customizations)
          : null,
      },
    });

    // Increment usage count
    await db.seed.update({
      where: { id: seed.id },
      data: { currentUses: { increment: 1 } },
    });

    return {
      artifactId,
      artifactType: seed.sourceArtifactType as ArtifactType,
      mode: options.mode,
    };
  } catch (error) {
    console.error('Error using seed:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to use seed',
    };
  }
}

/**
 * Get seed usage statistics
 */
export async function getSeedStats(seedId: string) {
  try {
    const [seed, usageEvents] = await Promise.all([
      db.seed.findUnique({
        where: { id: seedId },
      }),
      db.seedUsageEvent.findMany({
        where: { seedId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!seed) {
      return { error: 'Seed not found' };
    }

    const stats = {
      totalUses: seed.currentUses,
      maxUses: seed.maxUses,
      remainingUses: seed.maxUses ? seed.maxUses - seed.currentUses : null,
      instantUses: usageEvents.filter((e) => e.mode === 'instant').length,
      customizeUses: usageEvents.filter((e) => e.mode === 'customize').length,
      uniqueUsers: new Set(
        usageEvents.filter((e) => e.userId).map((e) => e.userId)
      ).size,
      recentUsage: usageEvents.slice(0, 10),
    };

    return stats;
  } catch (error) {
    console.error('Error fetching seed stats:', error);
    return { error: 'Failed to fetch seed statistics' };
  }
}
