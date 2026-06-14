"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { redeemBookLicense } from "@/actions/book-entitlement";
import { COLOR, FONT } from "@/lib/handbook/tokens";

/**
 * License-key redemption form. On success, routes into the reader. On
 * { needsLogin }, sends the reader to sign in and back here. See spec P1.
 */
export function UnlockForm() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await redeemBookLicense({ licenseKey: key });
      if ("success" in result) {
        router.push("/handbook");
        router.refresh();
      } else if ("needsLogin" in result) {
        const returnTo = encodeURIComponent("/handbook/unlock");
        router.push(`/login?returnTo=${returnTo}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} style={{ width: "100%", maxWidth: 420 }}>
      <label
        htmlFor="license-key"
        style={{
          display: "block",
          fontFamily: FONT.mono,
          fontSize: 12,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: COLOR.gold,
          marginBottom: 8,
        }}
      >
        License key
      </label>
      <input
        id="license-key"
        name="license-key"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
        autoComplete="off"
        spellCheck={false}
        style={{
          width: "100%",
          fontFamily: FONT.mono,
          fontSize: 15,
          padding: "12px 14px",
          borderRadius: 10,
          border: `1px solid ${COLOR.steel}`,
          background: COLOR.midnight,
          color: COLOR.paperHi,
          marginBottom: 14,
        }}
      />

      {error && (
        <p
          role="alert"
          style={{
            fontFamily: FONT.body,
            fontSize: 14,
            color: COLOR.goldLt,
            background: "rgba(168,64,46,0.18)",
            border: `1px solid ${COLOR.cinnabar}`,
            borderRadius: 8,
            padding: "10px 12px",
            margin: "0 0 14px",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !key.trim()}
        style={{
          width: "100%",
          fontFamily: FONT.label,
          fontSize: 16,
          letterSpacing: "0.04em",
          padding: "14px 20px",
          borderRadius: 10,
          border: "none",
          cursor: pending || !key.trim() ? "default" : "pointer",
          opacity: pending || !key.trim() ? 0.6 : 1,
          background: COLOR.cinnabar,
          color: COLOR.paperHi,
        }}
      >
        {pending ? "Verifying…" : "Unlock the book"}
      </button>
    </form>
  );
}
