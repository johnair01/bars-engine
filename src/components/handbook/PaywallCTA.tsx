import Link from "next/link";
import { COLOR, FONT } from "@/lib/handbook/tokens";

/**
 * Paywall call-to-action — shown in place of a gated chapter when the reader
 * has no entitlement. Two paths: buy on Gumroad, or redeem a code already held.
 * See book-launch-paywall spec (P4).
 */
export function PaywallCTA() {
  const buyUrl = process.env.GUMROAD_PRODUCT_URL || "https://gumroad.com";

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "2rem 1.25rem",
        background: COLOR.lacquer,
        color: COLOR.parchOnDark,
      }}
    >
      <div style={{ maxWidth: 440, textAlign: "center" }}>
        <p
          style={{
            fontFamily: FONT.mono,
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: COLOR.gold,
            marginBottom: 14,
          }}
        >
          The rest of the book
        </p>
        <h1
          style={{
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 30,
            lineHeight: 1.15,
            color: COLOR.paperHi,
            margin: "0 0 14px",
          }}
        >
          Continue the journey
        </h1>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize: 16,
            lineHeight: 1.6,
            color: COLOR.steelLt,
            margin: "0 0 28px",
          }}
        >
          You&rsquo;ve reached the end of the free Prologue. Unlock the full
          reader and a downloadable copy of <em>Mastering the Game of
          Allyship</em>.
        </p>

        <a
          href={buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            fontFamily: FONT.label,
            fontSize: 16,
            letterSpacing: "0.04em",
            padding: "14px 20px",
            borderRadius: 10,
            background: COLOR.cinnabar,
            color: COLOR.paperHi,
            textDecoration: "none",
            marginBottom: 14,
          }}
        >
          Buy on Gumroad
        </a>

        <Link
          href="/handbook/unlock"
          style={{
            display: "block",
            fontFamily: FONT.label,
            fontSize: 15,
            letterSpacing: "0.04em",
            padding: "12px 20px",
            borderRadius: 10,
            border: `1px solid ${COLOR.steel}`,
            color: COLOR.parchOnDark,
            textDecoration: "none",
          }}
        >
          I already have a code
        </Link>

        <p style={{ marginTop: 24 }}>
          <Link
            href="/handbook"
            style={{
              fontFamily: FONT.mono,
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: COLOR.muteInk,
              textDecoration: "none",
            }}
          >
            ← Back to the Prologue
          </Link>
        </p>
      </div>
    </main>
  );
}
