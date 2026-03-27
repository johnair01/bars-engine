import Link from 'next/link'
import { getAppConfig } from '@/actions/config'
import { getInstanceDbReadiness, listInstances, upsertInstance } from '@/actions/instance'
import { listPromotedMoves } from '@/actions/move-proposals'
import { KOTTER_STAGES } from '@/lib/kotter'
import { InstanceListWithEdit } from '@/components/admin/InstanceListWithEdit'

/**
 * @page /admin/instances
 * @entity CAMPAIGN
 * @description Configure event/fundraiser campaign instances with Kotter stages and moves without changing core engine
 * @permissions admin
 * @searchParams error:string (optional)
 * @searchParams saved:string (optional)
 * @searchParams active:string (optional)
 * @relationships CONTAINS (promoted moves), LINKED_TO (active instance)
 * @dimensions WHO:admin, WHAT:CAMPAIGN, WHERE:kotterStage, PERSONAL_THROUGHPUT:wake-up
 * @example /admin/instances?saved=true
 * @agentDiscoverable false
 */
export default async function AdminInstancesPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; saved?: string; active?: string }>
}) {
  const sp = (await searchParams) || {}
  const [config, readiness, instances, promotedMoves] = await Promise.all([
    getAppConfig(),
    getInstanceDbReadiness(),
    listInstances(),
    listPromotedMoves(),
  ])
  const activeInstanceId = (config as { activeInstanceId?: string | null }).activeInstanceId ?? null

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans space-y-10 ml-0 sm:ml-64 transition-all duration-300">
      <header className="space-y-2">
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-white">← Back to Admin</Link>
        <h1 className="text-3xl font-bold text-white">Instances</h1>
        <p className="text-zinc-500">
          Configure event / fundraiser “instances” without changing core engine code.
        </p>
      </header>

      {sp.error && (
        <section className="bg-red-950/30 border border-red-900/60 rounded-xl p-4 text-red-200">
          <div className="font-bold">Action failed</div>
          <div className="text-sm text-red-200/80 mt-1">{sp.error}</div>
          <div className="text-xs text-red-200/60 mt-3 font-mono">
            If this says schema is not updated: run <span className="text-red-100">prisma db push</span> against prod, then retry.
          </div>
        </section>
      )}

      {sp.saved === '1' && (
        <section className="bg-green-950/30 border border-green-900/60 rounded-xl p-4 text-green-200">
          <div className="font-bold">Saved</div>
          <div className="text-sm text-green-200/80 mt-1">Instance saved successfully.</div>
        </section>
      )}

      {(sp.active === '1' || sp.active === '0') && (
        <section className="bg-purple-950/20 border border-purple-900/50 rounded-xl p-4 text-purple-200">
          <div className="font-bold">Active instance updated</div>
          <div className="text-sm text-purple-200/80 mt-1">
            {sp.active === '1' ? 'An active instance is now set.' : 'Active instance cleared.'}
          </div>
        </section>
      )}

      {(!readiness.instancesTableReady || !readiness.appConfigActiveInstanceReady) && (
        <section className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-5 text-amber-200 space-y-2">
          <div className="font-bold">Database schema not ready</div>
          <div className="text-sm text-amber-200/80">
            This usually means <span className="font-mono">prisma db push</span> has not been run against production since the Instances feature was added.
          </div>
          <div className="text-xs font-mono text-amber-200/70">
            instances table: {readiness.instancesTableReady ? 'READY' : 'MISSING'} • app_config.activeInstanceId: {readiness.appConfigActiveInstanceReady ? 'READY' : 'MISSING'}
          </div>
        </section>
      )}

      {/* ACTIVE INSTANCE */}
      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Active Instance</h2>
          <Link href="/event" className="text-xs text-purple-400 hover:text-purple-300">
            View /event →
          </Link>
        </div>
        <div className="text-sm text-zinc-400">
          {activeInstanceId
            ? <span>Active instance id: <span className="font-mono text-zinc-200">{activeInstanceId}</span></span>
            : <span className="italic text-zinc-500">No active instance selected (single-instance mode).</span>
          }
        </div>
      </section>

      {/* CREATE / UPDATE */}
      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Create / Update Instance</h2>
        <form action={upsertInstance} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="hidden" name="id" value="" />

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Slug</label>
            <input name="slug" placeholder="birthday-fundraiser-2026" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Name</label>
            <input name="name" placeholder="Birthday + Fundraiser" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Domain Type</label>
            <select name="domainType" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" required>
              <option value="">Select…</option>
              <option value="party">party</option>
              <option value="fundraiser">fundraiser</option>
              <option value="hackathon">hackathon</option>
              <option value="business">business</option>
              <option value="house">house</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Theme</label>
            <input name="theme" placeholder="Heist at Construct Conclave" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Target Description</label>
            <input name="targetDescription" placeholder="Raise $3000 for Bruised Banana Residency Fund (Allyship target: Wendell)" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Wake Up: Learn the story</label>
            <textarea name="wakeUpContent" rows={4} placeholder="The Bruised Banana Residency is a creative space and community supporting artists, healers, and changemakers. Your awareness and participation help the collective thrive." className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Show Up: Contribute to the campaign</label>
            <textarea name="showUpContent" rows={4} placeholder="Contribute money (Donate above) or play the game by signing up and choosing your domains. This instance runs on quests, BARs, vibeulons, and story clock." className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Story bridge (game ↔ real world)</label>
            <textarea name="storyBridgeCopy" rows={2} placeholder="This residency is your Conclave; the fundraiser is the heist; your contribution powers the construct; vibeulons are the emotional energy that moves through this space." className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Campaign ref (default when /campaign has no ref)</label>
            <input name="campaignRef" placeholder="bruised-banana" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Source instance (fork from)</label>
            <select name="sourceInstanceId" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white">
              <option value="">— None —</option>
              {instances.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.slug})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Parent instance (sub-campaign of)</label>
            <select name="parentInstanceId" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white">
              <option value="">— None (top-level) —</option>
              {instances.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.slug})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Linked instance (e.g. Fundraising → Bruised Banana)</label>
            <select name="linkedInstanceId" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white">
              <option value="">— None —</option>
              {instances.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.slug})</option>
              ))}
            </select>
          </div>

          {promotedMoves.length > 0 && (
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">
                Move pool (campaign-curated moves)
              </label>
              <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto p-2 bg-black/50 border border-zinc-800 rounded">
                {promotedMoves.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                    <input type="checkbox" name="moveIds" value={m.id} className="rounded border-zinc-600 bg-zinc-800" />
                    <span>{m.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Goal Amount (USD)</label>
            <input name="goalAmount" inputMode="decimal" placeholder="3000" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Current Amount (USD)</label>
            <input name="currentAmount" inputMode="decimal" placeholder="0" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Stripe Payment Link (one-time)</label>
            <input name="stripeOneTimeUrl" placeholder="https://buy.stripe.com/..." className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Patreon Link</label>
            <input name="patreonUrl" placeholder="https://patreon.com/..." className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Venmo Link</label>
            <input name="venmoUrl" placeholder="https://venmo.com/..." className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Cash App Link</label>
            <input name="cashappUrl" placeholder="https://cash.app/..." className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">PayPal Link</label>
            <input name="paypalUrl" placeholder="https://paypal.me/..." className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Kotter Stage</label>
            <select name="kotterStage" className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" defaultValue={1}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}. {KOTTER_STAGES[n as keyof typeof KOTTER_STAGES].name}
                </option>
              ))}
            </select>
          </div>

          <label className="md:col-span-2 flex items-center gap-3 text-sm text-zinc-300">
            <input type="checkbox" name="isEventMode" className="w-4 h-4" defaultChecked />
            Event Mode (show progress bar + donate CTAs)
          </label>

          <button type="submit" className="md:col-span-2 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded">
            Save Instance
          </button>
        </form>
      </section>

      {/* LIST */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px bg-zinc-800 flex-1" />
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">All Instances</h2>
          <div className="h-px bg-zinc-800 flex-1" />
        </div>

        <InstanceListWithEdit instances={instances} activeInstanceId={activeInstanceId} promotedMoves={promotedMoves} />
      </section>
    </div>
  )
}

