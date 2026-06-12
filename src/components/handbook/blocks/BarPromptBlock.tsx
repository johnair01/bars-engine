"use client";

import { COLOR, FONT } from "@/lib/handbook/tokens";

export function BarPromptBlock({
  kicker,
  prompt,
  saved,
  savedText,
  draft,
  onDraftChange,
  onSave,
  onEdit,
  saving,
  error,
}: {
  kicker: string;
  prompt: string;
  saved: boolean;
  savedText: string;
  draft: string;
  onDraftChange: (v: string) => void;
  onSave: () => void;
  onEdit: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <div style={{ marginTop: 24, padding: "26px 24px", background: COLOR.midnight }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.22em", color: "#caa978", textTransform: "uppercase" }}>
        {kicker}
      </div>
      <p
        style={{
          fontFamily: FONT.display,
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: 20,
          lineHeight: 1.32,
          color: COLOR.goldLt,
          margin: "12px 0 14px",
        }}
      >
        {prompt}
      </p>

      {!saved ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Name the call…"
            style={{
              width: "100%",
              minHeight: 84,
              background: "#0c1018",
              border: "1px solid #2a3047",
              borderRadius: 8,
              color: "#e7ddc9",
              fontFamily: FONT.body,
              fontSize: 16,
              lineHeight: 1.5,
              padding: 12,
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <div style={{ fontFamily: FONT.mono, fontSize: 11, color: COLOR.cinnabar, marginTop: 8 }}>{error}</div>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            style={{
              width: "100%",
              marginTop: 11,
              background: COLOR.gold,
              border: "none",
              borderRadius: 8,
              padding: 12,
              textAlign: "center",
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            <span style={{ fontFamily: FONT.label, fontSize: 15, color: COLOR.midnight, letterSpacing: "0.03em" }}>
              {saving ? "Planting…" : "Plant this seed ⟶"}
            </span>
          </button>
        </div>
      ) : (
        <div
          style={{
            border: `1px solid ${COLOR.gold}`,
            borderRadius: 8,
            padding: 14,
            background: "rgba(200,163,90,.08)",
            animation: "handbookFadeUp .3s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: FONT.seal, fontSize: 18, color: COLOR.gold }}>種</span>
            <span style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.14em", color: COLOR.gold }}>
              SEED PLANTED · SAVED AS A BAR
            </span>
          </div>
          <div style={{ fontFamily: FONT.body, fontStyle: "italic", fontSize: 16, lineHeight: 1.5, color: "#ece6d6" }}>
            “{savedText}”
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 11 }}>
            <span style={{ fontFamily: FONT.body, fontSize: 13, color: COLOR.steel }}>In the app, this lands in your hand.</span>
            <button
              type="button"
              onClick={onEdit}
              style={{
                background: "transparent",
                border: "none",
                fontFamily: FONT.mono,
                fontSize: 11,
                color: COLOR.gold,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
