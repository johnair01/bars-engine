'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SeedUseClientProps {
  seed: any;
  token: string;
  mode: 'instant' | 'customize';
}

export function SeedUseClient({ seed, token, mode }: SeedUseClientProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    artifactId: string;
    artifactType: string;
  } | null>(null);

  // Parse template data
  const templateData = seed.templateData;
  const customizableFields = seed.customizableFields || [];

  // State for customizations
  const [customizations, setCustomizations] = useState<Record<string, any>>({});

  async function handleUseSeed() {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/seeds/use/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          customizations: mode === 'customize' ? customizations : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to use seed');
      }

      const result = await response.json();
      setSuccess(result);

      // Redirect after short delay
      setTimeout(() => {
        if (result.artifactType === 'BAR' || result.artifactType === 'QUEST') {
          router.push(`/bars/${result.artifactId}`);
        } else if (result.artifactType === 'CAMPAIGN') {
          router.push(`/campaign`);
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsProcessing(false);
    }
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-900/30 border border-green-600 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-green-300 mb-2">
              {seed.sourceArtifactType === 'BAR' || seed.sourceArtifactType === 'QUEST'
                ? 'BAR Created!'
                : 'Campaign Created!'}
            </h1>
            <p className="text-zinc-300 mb-6">
              Your {seed.sourceArtifactType.toLowerCase()} has been created from the
              template. Redirecting...
            </p>
            <Link
              href={
                success.artifactType === 'BAR' || success.artifactType === 'QUEST'
                  ? `/bars/${success.artifactId}`
                  : '/campaign'
              }
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition"
            >
              View {seed.sourceArtifactType}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Instant mode - auto-trigger creation
  if (mode === 'instant' && !isProcessing && !error) {
    handleUseSeed();
  }

  // Instant mode processing/error
  if (mode === 'instant') {
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
            {isProcessing ? (
              <>
                <div className="animate-spin text-6xl mb-4">⟳</div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Creating {seed.sourceArtifactType}...
                </h1>
                <p className="text-zinc-400">Please wait</p>
              </>
            ) : error ? (
              <>
                <div className="text-6xl mb-4 text-red-400">✗</div>
                <h1 className="text-2xl font-bold text-red-300 mb-2">Error</h1>
                <p className="text-zinc-300 mb-6">{error}</p>
                <Link
                  href={`/seed/use/${token}?mode=customize`}
                  className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition"
                >
                  Try Customize Mode
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Customize mode
  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">
            Customize {seed.sourceArtifactType} Template
          </h1>
          <p className="mt-2 text-zinc-400">
            Adjust the template values before creating your{' '}
            {seed.sourceArtifactType.toLowerCase()}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Template Preview */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="text-sm uppercase tracking-widest text-zinc-400 mb-4">
            Template Preview
          </h2>
          <div className="space-y-4">
            {Object.entries(templateData).map(([key, value]) => {
              const isCustomizable = customizableFields.includes(key);

              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    {isCustomizable && (
                      <span className="ml-2 text-xs text-purple-400">(customizable)</span>
                    )}
                  </label>
                  {isCustomizable ? (
                    key === 'description' ? (
                      <textarea
                        value={customizations[key] ?? String(value || '')}
                        onChange={(e) =>
                          setCustomizations({ ...customizations, [key]: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                        rows={3}
                      />
                    ) : (
                      <input
                        type="text"
                        value={customizations[key] ?? String(value || '')}
                        onChange={(e) =>
                          setCustomizations({ ...customizations, [key]: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    )
                  ) : (
                    <div className="px-4 py-3 bg-zinc-800/50 border border-zinc-800 rounded-lg text-zinc-400">
                      {String(value || '—')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleUseSeed}
            disabled={isProcessing}
            className="flex-1 py-3 px-6 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold rounded-xl transition"
          >
            {isProcessing ? 'Creating...' : `Create ${seed.sourceArtifactType}`}
          </button>
          {seed.usageMode === 'both' && (
            <Link
              href={`/seed/use/${token}?mode=instant`}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold rounded-xl text-center transition"
            >
              Use Instant Mode Instead
            </Link>
          )}
        </div>

        {/* Seed Info */}
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 text-sm text-zinc-400">
          <div className="flex justify-between mb-2">
            <span>Created by:</span>
            <span className="text-white">{seed.creator?.name || 'Unknown'}</span>
          </div>
          {seed.maxUses && (
            <div className="flex justify-between">
              <span>Uses:</span>
              <span className="text-white">
                {seed.currentUses} / {seed.maxUses}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
