import type { Metadata } from "next";
import Link from "next/link";
import { getAppConfig } from "@/actions/config";
import {
  MARKETING_PRODUCTS,
  formatPrice,
  otherProducts,
} from "@/lib/marketing/products";

export const metadata: Metadata = {
  title: "Get Started — Mastering the Game of Allyship",
  description:
    "The book, the deck, and the game in one place. Understand the whole offering, then dig in — most of it is free and needs no account.",
};

/**
 * @route /pricing
 * @page /pricing
 * @entity SYSTEM
 * @description Public sales hub — the funnel front door. Presents the book, deck,
 *   and game with cross-sell, routing visitors into each product before login.
 * @permissions public
 * @energyCost 0 (read-only marketing view)
 * @dimensions WHO:visitor, WHAT:SYSTEM, WHERE:funnel, ENERGY:N/A
 * @agentDiscoverable true
 * @example /pricing
 */
export default async function PricingPage() {
  // Public page: must render even when the DB is unreachable (preview deploys).
  let heroTitle = "Mastering the Game of Allyship";
  let heroSubtitle =
    "Increase the capacity for mutual satisfaction over time.";
  try {
    const cfg = await getAppConfig();
    if (cfg?.heroTitle) heroTitle = cfg.heroTitle;
    if (cfg?.heroSubtitle) heroSubtitle = cfg.heroSubtitle;
  } catch {
    /* keep defaults — never block the front door on the database */
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-5 pb-20 pt-24 sm:px-8">
        {/* Hero */}
        <header className="flex flex-col items-center gap-4 text-center">
          <h1 className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            {heroTitle}
          </h1>
          <p className="max-w-2xl text-lg text-zinc-400">{heroSubtitle}</p>
          <p className="max-w-xl text-sm text-zinc-500">
            One practice, many doors: the app, the book, the RPG, the deck, and
            more. Start anywhere — most of it has a free preview, no account
            needed.
          </p>
        </header>

        {/* Product cards */}
        <section className="grid gap-5 md:grid-cols-3">
          {MARKETING_PRODUCTS.map((p) => (
            <article
              key={p.key}
              className={`flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-colors ${p.accent.ring}`}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                  {p.tagline}
                </span>
                <h2 className={`text-xl font-bold ${p.accent.text}`}>{p.name}</h2>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-zinc-400">
                {p.description}
              </p>

              {/* Pricing — variants, or a bundled/included note */}
              <div className="flex flex-col gap-1.5 border-t border-zinc-800 pt-3">
                {p.prices.length > 0 ? (
                  p.prices.map((v) => (
                    <div
                      key={v.label}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <span className="text-xs text-zinc-400">
                        {v.label}
                        {v.note && (
                          <span className="block text-[10px] text-zinc-600">
                            {v.note}
                          </span>
                        )}
                      </span>
                      <span className={`text-sm font-bold ${p.accent.text}`}>
                        {formatPrice(v)}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs italic text-zinc-500">
                    {p.priceNote ?? "Free"}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href={p.href}
                  className={`min-h-[44px] w-full rounded-lg px-4 py-3 text-center text-sm font-bold shadow-lg transition-all ${p.accent.button}`}
                >
                  {p.cta}
                </Link>
                {p.secondary && (
                  <Link
                    href={p.secondary.href}
                    className="min-h-[44px] w-full rounded-lg border border-zinc-700 px-4 py-3 text-center text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
                  >
                    {p.secondary.label}
                  </Link>
                )}
                {p.prices.length === 0 && (
                  <span className="text-[11px] text-zinc-500">
                    {p.publicAccess
                      ? "Free · no account needed"
                      : "Create a free account to open it"}
                  </span>
                )}
              </div>

              {/* Cross-sell: every door points to the others */}
              <div className="border-t border-zinc-800 pt-3">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                  Also explore
                </span>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {otherProducts(p.key).map((o) => (
                    <Link
                      key={o.key}
                      href={o.href}
                      className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
                    >
                      {o.name} →
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Funnel CTAs: support + account */}
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <h2 className="text-lg font-bold text-white">Ready to go deeper?</h2>
          <p className="max-w-xl text-sm text-zinc-400">
            Create a free account to build your own BARs and turn charged moments
            into quests — or support the residency that funds the work.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/conclave/guided"
              className="min-h-[44px] rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-900/30 transition-all hover:from-green-500 hover:to-emerald-500"
            >
              Create your character
            </Link>
            <Link
              href="/event"
              className="min-h-[44px] rounded-lg border border-zinc-700 px-6 py-3 text-sm font-bold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
            >
              Support the residency
            </Link>
            <Link
              href="/login"
              className="min-h-[44px] rounded-lg px-6 py-3 text-sm font-semibold text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Already have an account? Log in
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
