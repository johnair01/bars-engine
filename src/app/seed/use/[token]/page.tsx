/**
 * @page /seed/use/:token
 * @entity SEED
 * @description Use seed to create artifact (dual-mode: instant or customize)
 * @permissions public
 * @params token:string (path, required) - Seed shareable token
 * @searchParams mode:string (optional) - instant | customize (default: customize)
 * @relationships SEED (consumes seed to create artifact)
 * @energyCost 10 (artifact creation from template)
 * @dimensions WHO:user, WHAT:seed usage, WHERE:artifact creation, ENERGY:template instantiation
 * @example /seed/use/abc123xyz?mode=instant
 * @agentDiscoverable false
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { SeedUseClient } from '@/components/seeds/SeedUseClient';

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ mode?: string }>;
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

export default async function SeedUsePage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { mode } = await searchParams;

  const seed = await fetchSeed(token);

  if (!seed || 'error' in seed) {
    notFound();
  }

  // Handle instant mode - create artifact immediately
  if (mode === 'instant') {
    // Check if seed supports instant mode
    if (seed.usageMode === 'customize') {
      return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-900/30 border border-red-600 rounded-xl p-6">
              <h1 className="text-2xl font-bold text-red-300 mb-2">
                Instant Mode Not Supported
              </h1>
              <p className="text-zinc-300 mb-4">
                This seed requires customization before use.
              </p>
              <Link
                href={`/seed/use/${token}?mode=customize`}
                className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition"
              >
                Customize Template
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Render client component for instant creation
    return <SeedUseClient seed={seed} token={token} mode="instant" />;
  }

  // Default: customize mode
  return <SeedUseClient seed={seed} token={token} mode="customize" />;
}
