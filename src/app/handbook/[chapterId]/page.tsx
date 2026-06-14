import type { Metadata } from "next";
import { HandbookReader } from "@/components/handbook/HandbookReader";
import { PaywallCTA } from "@/components/handbook/PaywallCTA";
import { getCurrentPlayer } from "@/lib/auth";
import { hasBookAccess, isFreeChapter } from "@/lib/book-access";

export const metadata: Metadata = {
  title: "The Handbook — Mastering the Game of Allyship",
};

/**
 * Gated chapter route. Free chapters (the Prologue funnel) render for anyone;
 * every other chapter requires an active book entitlement, else the paywall.
 * See book-launch-paywall spec (P2/FR5).
 */
export default async function HandbookChapterPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;

  if (!isFreeChapter(chapterId)) {
    const player = await getCurrentPlayer();
    if (!(await hasBookAccess(player))) {
      return <PaywallCTA />;
    }
  }

  return <HandbookReader chapterId={chapterId} />;
}
