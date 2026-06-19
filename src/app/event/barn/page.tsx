import type { Metadata } from "next";
import Link from "next/link";
import { BarnRaisingBar } from "@/components/event/BarnRaisingBar";
import { PREVIEW_BARN_STATE, type BarnState } from "@/lib/event/barn-raising";
import { getBarnSnapshot } from "@/actions/barn";

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

  // `?preview=1` forces illustrative fill; otherwise read live wall totals (tolerate
  // DB-down on public/preview deploys → fall back to the empty "be the first plank" state).
  let state: BarnState | undefined = preview ? PREVIEW_BARN_STATE : undefined;
  if (!preview) {
    try {
      state = await getBarnSnapshot();
    } catch {
      state = undefined;
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-5 pb-20 pt-20 sm:px-8">
        <BarnRaisingBar state={state} variant="full" />

        {/* Show Up — three ways to back the barn: give, buy, or come stand a plank. */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">
            Show up
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/event/donate?dswPath=money&wall=car"
              className="flex min-h-[44px] items-center justify-center rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3 text-center text-sm font-bold text-white shadow-lg transition-all hover:from-amber-500 hover:to-orange-500"
            >
              Chip in for the car
            </Link>
            <Link
              href="/launch"
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-zinc-700 px-5 py-3 text-center text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
            >
              Buy from the pre-sale
            </Link>
            <Link
              href="/event"
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-zinc-700 px-5 py-3 text-center text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
            >
              RSVP to the send-off
            </Link>
          </div>
          <p className="text-xs text-zinc-600">
            Any one of the three raises a wall — give to the car, back the pre-sale, or come stand a
            plank on July 18.
          </p>
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
