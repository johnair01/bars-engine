import Link from "next/link";
import { COLOR, FONT } from "@/lib/handbook/tokens";

/**
 * End-of-chapter CTA. The next-chapter link is the conversion point: from the
 * free Prologue it leads to the gated next chapter, which shows the paywall
 * (buy on Gumroad) until the reader is entitled. `nextHref` defaults to the
 * first paid chapter.
 */
export function FooterBlock({
  nextLabel,
  nextHref = "/handbook/chapter-one",
}: {
  nextLabel: string;
  nextHref?: string;
}) {
  return (
    <div style={{ marginTop: 20, padding: 24, textAlign: "center", borderTop: "1px solid #d5c8aa" }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.18em", color: "#9a8d72" }}>
        — THE OPENING ENDS HERE —
      </div>
      <Link
        href={nextHref}
        style={{ marginTop: 14, display: "inline-block", border: `1px solid ${COLOR.cinnabar}`, borderRadius: 8, padding: "11px 20px", textDecoration: "none" }}
      >
        <span style={{ fontFamily: FONT.label, fontSize: 15, color: COLOR.cinnabar }}>{nextLabel}</span>
      </Link>
    </div>
  );
}
