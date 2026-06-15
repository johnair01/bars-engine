import Link from "next/link";
import { COLOR, FONT } from "@/lib/handbook/tokens";

/**
 * Shown to an *entitled* reader who opens a chapter that doesn't have in-app
 * content yet. At launch the paid product is the Gumroad-hosted PDF; the
 * in-app reader gains chapters over time. This keeps the post-purchase
 * experience honest instead of an error. See book-launch-paywall spec.
 */
export function UnlockedComingSoon() {
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
      <div style={{ maxWidth: 460, textAlign: "center" }}>
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
          You&rsquo;re unlocked
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
          Thank you for joining the academy
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
          Your full copy of <em>Mastering the Game of Allyship</em> is your
          download from Gumroad. The interactive in-app chapters are being
          released here over time &mdash; your access already covers them as
          they arrive.
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
          Get your download on Gumroad
        </a>

        <Link
          href="/handbook"
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
          Re-read the Prologue
        </Link>
      </div>
    </main>
  );
}
