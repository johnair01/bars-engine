import type { Metadata } from "next";
import Link from "next/link";
import { UnlockForm } from "@/components/handbook/UnlockForm";
import { COLOR, FONT } from "@/lib/handbook/tokens";

export const metadata: Metadata = {
  title: "Unlock the book — Mastering the Game of Allyship",
  description: "Enter your Gumroad license key to unlock the full reader and download.",
};

export default function HandbookUnlockPage() {
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
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
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
          Already purchased?
        </p>
        <h1
          style={{
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 30,
            color: COLOR.paperHi,
            margin: "0 0 12px",
          }}
        >
          Unlock the book
        </h1>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize: 16,
            lineHeight: 1.6,
            color: COLOR.steelLt,
            margin: "0 0 26px",
          }}
        >
          Enter the license key from your Gumroad receipt to unlock the full
          reader and a downloadable copy.
        </p>

        <div style={{ display: "grid", placeItems: "center" }}>
          <UnlockForm />
        </div>

        <p style={{ marginTop: 26 }}>
          <span
            style={{
              fontFamily: FONT.body,
              fontSize: 14,
              color: COLOR.steel,
            }}
          >
            Don&rsquo;t have a key yet?{" "}
          </span>
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: FONT.label, fontSize: 14, color: COLOR.goldLt }}
          >
            Buy on Gumroad
          </a>
        </p>

        <p style={{ marginTop: 14 }}>
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
