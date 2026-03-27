/**
 * @page /seed/:token
 * @entity SEED
 * @description Seed landing page showing template preview and usage options
 * @permissions public
 * @params token:string (path, required) - Seed shareable token
 * @relationships SEED (template preview)
 * @energyCost 0 (preview only, no creation)
 * @dimensions WHO:viewer, WHAT:seed preview, WHERE:sharing, ENERGY:template discovery
 * @example /seed/abc123xyz
 * @agentDiscoverable false
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ token: string }>;
}

async function fetchSeed(token: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/seeds/${token}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching seed:', error);
    return null;
  }
}

export default async function SeedLandingPage({ params }: PageProps) {
  const { token } = await params;
  const seed = await fetchSeed(token);

  if (!seed || 'error' in seed) {
    notFound();
  }

  const templateData = seed.templateData;
  const artifactTypeLabel =
    seed.sourceArtifactType === 'BAR'
      ? 'BAR'
      : seed.sourceArtifactType === 'QUEST'
      ? 'Quest'
      : 'Campaign';

  // Check if seed is still usable
  const isExpired = seed.expiresAt && new Date(seed.expiresAt) < new Date();
  const isMaxedOut = seed.maxUses && seed.currentUses >= seed.maxUses;
  const isUsable = !isExpired && !isMaxedOut;

  // Determine usage modes
  const supportsInstant = seed.usageMode === 'instant' || seed.usageMode === 'both';
  const supportsCustomize = seed.usageMode === 'customize' || seed.usageMode === 'both';

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 space-y-6">
          {/* Header */}
          <header className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 rounded bg-purple-900/30 border border-purple-600 text-purple-300 text-xs font-bold uppercase">
                {artifactTypeLabel} Template
              </span>
              {!isUsable && (
                <span className="px-2 py-1 rounded bg-red-900/30 border border-red-600 text-red-300 text-xs font-bold uppercase">
                  {isExpired ? 'Expired' : 'Max Uses Reached'}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {templateData.title}
            </h1>
            {seed.description && (
              <p className="text-zinc-400 text-sm">{seed.description}</p>
            )}
          </header>

          {/* Template Preview */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-4">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400">
              Template Preview
            </h2>
            <div className="space-y-3 text-sm">
              {templateData.description && (
                <div>
                  <div className="text-zinc-500 mb-1">Description:</div>
                  <div className="text-zinc-300">{templateData.description}</div>
                </div>
              )}
              {templateData.allyshipDomain && (
                <div>
                  <div className="text-zinc-500 mb-1">Domain:</div>
                  <div className="text-zinc-300">{templateData.allyshipDomain}</div>
                </div>
              )}
              {templateData.type && (
                <div>
                  <div className="text-zinc-500 mb-1">Type:</div>
                  <div className="text-zinc-300">{templateData.type}</div>
                </div>
              )}
              {templateData.campaignRef && (
                <div>
                  <div className="text-zinc-500 mb-1">Campaign:</div>
                  <div className="text-zinc-300">{templateData.campaignRef}</div>
                </div>
              )}
            </div>

            {seed.customizableFields && seed.customizableFields.length > 0 && (
              <div className="pt-3 border-t border-zinc-800">
                <div className="text-xs text-zinc-500 mb-2">Customizable fields:</div>
                <div className="flex flex-wrap gap-2">
                  {seed.customizableFields.map((field: string) => (
                    <span
                      key={field}
                      className="px-2 py-1 rounded bg-purple-900/20 border border-purple-800 text-purple-300 text-xs"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Seed Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
              <div className="text-zinc-500 mb-1">Created by</div>
              <div className="text-white font-medium">{seed.creator?.name || 'Unknown'}</div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
              <div className="text-zinc-500 mb-1">Uses</div>
              <div className="text-white font-medium">
                {seed.currentUses}
                {seed.maxUses ? ` / ${seed.maxUses}` : ' (unlimited)'}
              </div>
            </div>
          </div>

          {/* Actions */}
          {isUsable ? (
            <div className="space-y-3">
              {supportsInstant && (
                <Link
                  href={`/seed/use/${token}?mode=instant`}
                  className="block w-full py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-center transition"
                >
                  Use Template Instantly
                </Link>
              )}
              {supportsCustomize && (
                <Link
                  href={`/seed/use/${token}?mode=customize`}
                  className={`block w-full py-3 px-6 ${
                    supportsInstant
                      ? 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700'
                      : 'bg-purple-600 hover:bg-purple-500'
                  } text-white font-bold rounded-xl text-center transition`}
                >
                  Customize Template First
                </Link>
              )}
              <p className="text-xs text-zinc-500 text-center">
                {supportsInstant && supportsCustomize
                  ? 'Choose instant for quick creation or customize to adapt the template'
                  : supportsInstant
                  ? 'Creates artifact immediately with template defaults'
                  : 'Edit template fields before creating'}
              </p>
            </div>
          ) : (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-center">
              <div className="text-red-300 font-medium mb-1">
                {isExpired ? 'This seed has expired' : 'This seed has reached its maximum uses'}
              </div>
              <div className="text-zinc-500 text-sm">
                Contact the creator if you need access
              </div>
            </div>
          )}
        </div>

        {/* Footer link */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-400 transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
