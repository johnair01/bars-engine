import type { Metadata } from "next";
import Link from "next/link";
import { BarnRaisingBar } from "@/components/event/BarnRaisingBar";
import { PREVIEW_BARN_STATE } from "@/lib/event/barn-raising";

export const metadata: Metadata = {
  title: "The Barn Raising — July 18",
  description:
    "One send-off, three walls: replace the car, back the pre-sale, fund the runway. Raise the barn together.",
};

/**
 * @route /event/barn
 * @page /event/barn
 * @entity SYSTEM
 * @description Public "barn raising" centerpiece — the three-wall Milestone BAR for the
 *   July 18 send-off. Big-screen friendly (kiosk). `?preview=1` shows illustrative fill
 *   for design review; default is the honest pre-launch (empty) state.
 * @permissions public
 * @energyCost 0 (read-only)
 * @dimensions WHO:visitor, WHAT:SYSTEM, WHERE:event, ENERGY:N/A
 * @agentDiscoverable true
 * @example /event/barn
 */
export default async function BarnPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const state = preview ? PREVIEW_BARN_STATE : undefined;

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-5 pb-20 pt-20 sm:px-8">
        <BarnRaisingBar state={state} variant="full" />

        <div className="flex flex-wrap gap-3">
          <Link
            href="/event/donate/wizard"
            className="min-h-[44px] rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:from-amber-500 hover:to-orange-500"
          >
            Raise a plank
          </Link>
          <Link
            href="/pricing"
            className="min-h-[44px] rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
          >
            Browse the pre-sale
          </Link>
        </div>

        {preview && (
          <p className="text-[11px] text-zinc-600">
            Preview mode — figures are illustrative, not real contributions.
          </p>
        )}
      </div>
    </div>
  );
}
