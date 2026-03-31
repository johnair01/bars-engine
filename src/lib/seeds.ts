/**
 * Seed generation and usage library
 * Handles creating shareable template links from artifacts (BARs, Quests, Campaigns)
 */

import { db } from '@/lib/db'
import { customAlphabet } from 'nanoid'

// Token generation: 12-char alphanumeric (url-safe)
const generateToken = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 12)

export type ArtifactType = 'BAR' | 'QUEST' | 'CAMPAIGN'
export type UsageMode = 'instant' | 'customize' | 'both'
export type SeedVisibility = 'public' | 'unlisted' | 'private'

export interface SeedTemplate {
  description?: string
  storyContent?: string
  [key: string]: any
}

export interface GenerateSeedOptions {
  customizableFields?: string[]
  usageMode?: UsageMode
  maxUses?: number
  expiresAt?: Date
  visibility?: SeedVisibility
  description?: string
  tags?: string[]
}

export interface UseSeedOptions {
  userId?: string
  mode: 'instant' | 'customize'
  customizations?: Partial<SeedTemplate>
}

/**
 * Generate a shareable seed from an artifact
 */
export async function generateSeed(
  artifactId: string,
  artifactType: ArtifactType,
  creatorId: string,
  options: GenerateSeedOptions = {}
) {
  try {
    // Fetch the source artifact based on type
    let sourceArtifact: any

    if (artifactType === 'BAR') {
      sourceArtifact = await db.customBar.findUnique({
        where: { id: artifactId },
        include: {
          assets: true,
        },
      })
    } else if (artifactType === 'QUEST') {
      sourceArtifact = await db.quest.findUnique({
        where: { id: artifactId },
      })
    } else if (artifactType === 'CAMPAIGN') {
      sourceArtifact = await db.campaignInstance.findUnique({
        where: { id: artifactId },
      })
    }

    if (!sourceArtifact) {
      return { error: 'Source artifact not found' }
    }

    // Extract template data based on artifact type
    const templateData: SeedTemplate = {}

    if (artifactType === 'BAR') {
      templateData.description = sourceArtifact.description
      templateData.storyContent = sourceArtifact.storyContent
      templateData.type = sourceArtifact.type
      // Include asset URLs but not IDs (new artifact will need to copy assets)
      if (sourceArtifact.assets?.length > 0) {
        templateData.assetUrls = sourceArtifact.assets.map((a: any) => a.url)
      }
    } else if (artifactType === 'QUEST') {
      templateData.title = sourceArtifact.title
      templateData.description = sourceArtifact.description
      templateData.questType = sourceArtifact.questType
      templateData.energyCost = sourceArtifact.energyCost
    } else if (artifactType === 'CAMPAIGN') {
      templateData.name = sourceArtifact.name
      templateData.description = sourceArtifact.description
      templateData.slug = sourceArtifact.slug
    }

    // Generate unique token
    const token = generateToken()

    // Create seed record
    const seed = await db.seed.create({
      data: {
        token,
        creatorId,
        sourceArtifactId: artifactId,
        sourceArtifactType: artifactType,
        templateData: JSON.stringify(templateData),
        customizableFields: JSON.stringify(options.customizableFields || []),
        usageMode: options.usageMode || 'both',
        maxUses: options.maxUses,
        expiresAt: options.expiresAt,
        visibility: options.visibility || 'unlisted',
        description: options.description,
        tags: JSON.stringify(options.tags || []),
      },
    })

    return {
      id: seed.id,
      token: seed.token,
      createdAt: seed.createdAt,
    }
  } catch (error) {
    console.error('Error generating seed:', error)
    return { error: 'Failed to generate seed' }
  }
}

/**
 * Use a seed to create a new artifact
 */
export async function useSeed(
  token: string,
  options: UseSeedOptions
) {
  try {
    // Fetch seed
    const seed = await db.seed.findUnique({
      where: { token },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    })

    if (!seed) {
      return { error: 'Seed not found' }
    }

    // Check expiration
    if (seed.expiresAt && new Date() > seed.expiresAt) {
      return { error: 'Seed has expired' }
    }

    // Check max uses
    if (seed.maxUses !== null && seed.currentUses >= seed.maxUses) {
      return { error: 'Seed has reached its usage limit' }
    }

    // Parse template data
    const templateData: SeedTemplate = JSON.parse(seed.templateData)
    const customizableFields: string[] = JSON.parse(seed.customizableFields)

    // Apply customizations if in customize mode
    let finalData = { ...templateData }
    if (options.mode === 'customize' && options.customizations) {
      // Only allow customization of allowed fields
      for (const [key, value] of Object.entries(options.customizations)) {
        if (customizableFields.includes(key)) {
          finalData[key] = value
        }
      }
    }

    // Create artifact based on source type
    let newArtifact: any

    if (seed.sourceArtifactType === 'BAR') {
      // Use seed creator as owner if no userId (anonymous usage)
      const ownerId = options.userId || seed.creatorId

      newArtifact = await db.customBar.create({
        data: {
          description: finalData.description || '',
          storyContent: finalData.storyContent || '',
          type: finalData.type || 'bar',
          creatorId: ownerId,
          recipientIds: [ownerId], // Owner is also recipient
          // Note: Assets would need to be copied separately if needed
          // Add seed provenance metadata (future enhancement)
        },
      })
    } else if (seed.sourceArtifactType === 'QUEST') {
      const playerId = options.userId || seed.creatorId

      newArtifact = await db.quest.create({
        data: {
          title: finalData.title || '',
          description: finalData.description || '',
          questType: finalData.questType || 'generic_goal',
          energyCost: finalData.energyCost || 10,
          playerId,
          status: 'pending',
        },
      })
    } else if (seed.sourceArtifactType === 'CAMPAIGN') {
      return { error: 'Campaign seeds not yet implemented' }
    }

    // Record usage event
    await db.seedUsageEvent.create({
      data: {
        seedId: seed.id,
        userId: options.userId,
        createdArtifactId: newArtifact.id,
        artifactType: seed.sourceArtifactType,
        mode: options.mode,
        customizations: options.customizations
          ? JSON.stringify(options.customizations)
          : null,
      },
    })

    // Increment usage count
    await db.seed.update({
      where: { id: seed.id },
      data: {
        currentUses: { increment: 1 },
      },
    })

    return {
      artifact: newArtifact,
      seed: {
        id: seed.id,
        token: seed.token,
        creator: seed.creator,
      },
    }
  } catch (error) {
    console.error('Error using seed:', error)
    return { error: 'Failed to use seed' }
  }
}

/**
 * Get seed by token (for preview page)
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
    })

    if (!seed) {
      return { error: 'Seed not found' }
    }

    return { seed }
  } catch (error) {
    console.error('Error fetching seed:', error)
    return { error: 'Failed to fetch seed' }
  }
}
