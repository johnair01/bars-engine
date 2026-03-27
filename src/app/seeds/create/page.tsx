/**
 * @page /seeds/create
 * @entity SEED
 * @description Generate shareable seed from artifact
 * @permissions authenticated
 * @searchParams artifactId:string (optional) - Pre-populate with artifact
 * @searchParams artifactType:string (optional) - BAR | QUEST | CAMPAIGN
 * @relationships SEED (creates shareable template)
 * @energyCost 5 (seed generation)
 * @dimensions WHO:creator, WHAT:seed creation, WHERE:sharing, ENERGY:template generation
 * @example /seeds/create?artifactId=bar_123&artifactType=BAR
 * @agentDiscoverable false
 */

import { SeedCreatorClient } from '@/components/seeds/SeedCreatorClient';

interface PageProps {
  searchParams: Promise<{
    artifactId?: string;
    artifactType?: string;
  }>;
}

export default async function SeedCreatePage({ searchParams }: PageProps) {
  const { artifactId, artifactType } = await searchParams;

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Create Seed</h1>
          <p className="mt-2 text-zinc-400">
            Generate a shareable template link from an artifact
          </p>
        </div>

        {/* Creator Form */}
        <SeedCreatorClient
          initialArtifactId={artifactId}
          initialArtifactType={artifactType as 'BAR' | 'QUEST' | 'CAMPAIGN' | undefined}
        />

        {/* Info */}
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 text-sm text-zinc-400">
          <strong className="text-white">What are seeds?</strong> Seeds are
          shareable template links that let others create their own version of
          your artifact. You can configure whether they can customize the
          template or use it instantly as-is.
        </div>
      </div>
    </div>
  );
}
