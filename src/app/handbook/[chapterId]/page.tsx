import type { Metadata } from "next";
import { HandbookReader } from "@/components/handbook/HandbookReader";
import { PaywallCTA } from "@/components/handbook/PaywallCTA";
import { UnlockedComingSoon } from "@/components/handbook/UnlockedComingSoon";
import { getCurrentPlayer } from "@/lib/auth";
import { hasBookAccess, isFreeChapter, isPublishedChapter } from "@/lib/book-access";

export const metadata: Metadata = {
  title: "The Handbook — Mastering the Game of Allyship",
};

/**
 * Gated chapter route. Free chapters (the Prologue funnel) render for anyone.
 * Non-free chapters require an active entitlement → else the paywall. Entitled
 * readers see the reader when the chapter has in-app content, or an honest
 * "unlocked / download on Gumroad / coming soon" panel until it's authored.
 * See book-launch-paywall spec (P2/FR5).
 */
export default async function HandbookChapterPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;

  if (isFreeChapter(chapterId)) {
    return <HandbookReader chapterId={chapterId} />;
  }

  const player = await getCurrentPlayer();
  if (!(await hasBookAccess(player))) {
    return <PaywallCTA />;
  }

  return isPublishedChapter(chapterId) ? (
    <HandbookReader chapterId={chapterId} />
  ) : (
    <UnlockedComingSoon />
  );
}
