'use client';

import { useState } from 'react';

interface SeedCreatorClientProps {
  initialArtifactId?: string;
  initialArtifactType?: 'BAR' | 'QUEST' | 'CAMPAIGN';
}

export function SeedCreatorClient({
  initialArtifactId,
  initialArtifactType,
}: SeedCreatorClientProps) {
  const [artifactId, setArtifactId] = useState(initialArtifactId || '');
  const [artifactType, setArtifactType] = useState<'BAR' | 'QUEST' | 'CAMPAIGN'>(
    initialArtifactType || 'BAR'
  );
  const [usageMode, setUsageMode] = useState<'instant' | 'customize' | 'both'>('both');
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>('unlisted');
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    token: string;
    shareableUrl: string;
  } | null>(null);

  async function handleCreateSeed(e: React.FormEvent) {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/seeds/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactId,
          artifactType,
          usageMode,
          visibility,
          maxUses: maxUses === '' ? null : Number(maxUses),
          description: description || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create seed');
      }

      const result = await response.json();
      setSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  }

  // Success state
  if (success) {
    const fullUrl = `${window.location.origin}${success.shareableUrl}`;

    return (
      <div className="bg-green-900/30 border border-green-600 rounded-xl p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-300 mb-2">Seed Created!</h2>
          <p className="text-zinc-300">Share this link with others</p>
        </div>

        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 mb-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={fullUrl}
              readOnly
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white font-mono text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(fullUrl);
                alert('Copied to clipboard!');
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="text-sm text-zinc-400 space-y-1">
          <div>Token: <code className="text-purple-400">{success.token}</code></div>
          <div>Mode: <span className="text-white">{usageMode}</span></div>
          <div>Visibility: <span className="text-white">{visibility}</span></div>
          {maxUses && <div>Max uses: <span className="text-white">{maxUses}</span></div>}
        </div>

        <button
          onClick={() => {
            setSuccess(null);
            setArtifactId('');
            setDescription('');
          }}
          className="mt-6 w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold rounded-xl transition"
        >
          Create Another Seed
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleCreateSeed} className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Artifact Selection */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">
          Source Artifact
        </h2>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Artifact Type
          </label>
          <select
            value={artifactType}
            onChange={(e) => setArtifactType(e.target.value as any)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="BAR">BAR</option>
            <option value="QUEST">Quest</option>
            <option value="CAMPAIGN">Campaign</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Artifact ID
          </label>
          <input
            type="text"
            value={artifactId}
            onChange={(e) => setArtifactId(e.target.value)}
            placeholder="bar_abc123 or quest_xyz456"
            required
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
      </div>

      {/* Seed Configuration */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">
          Seed Configuration
        </h2>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Usage Mode
          </label>
          <select
            value={usageMode}
            onChange={(e) => setUsageMode(e.target.value as any)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="both">Both (instant + customize)</option>
            <option value="instant">Instant only</option>
            <option value="customize">Customize only</option>
          </select>
          <p className="mt-2 text-xs text-zinc-500">
            {usageMode === 'instant'
              ? 'Creates artifact immediately with template defaults'
              : usageMode === 'customize'
              ? 'Requires users to customize template before creating'
              : 'Users can choose instant or customize mode'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Visibility
          </label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as any)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="unlisted">Unlisted (only with link)</option>
            <option value="public">Public (searchable)</option>
            <option value="private">Private (restricted)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Max Uses (optional)
          </label>
          <input
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Unlimited"
            min="1"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <p className="mt-2 text-xs text-zinc-500">
            Leave empty for unlimited uses
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this seed is for..."
            rows={3}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isProcessing || !artifactId}
        className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold rounded-xl transition"
      >
        {isProcessing ? 'Creating Seed...' : 'Generate Shareable Link'}
      </button>
    </form>
  );
}
