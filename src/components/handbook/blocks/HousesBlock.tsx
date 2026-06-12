"use client";

import { COLOR, FONT } from "@/lib/handbook/tokens";

// Canonical House copy — static block; the only data is the player's choice.
export const HOUSES: { name: string; domain: string; question: string; accent: string; domainColor: string }[] = [
  { name: "Provisioners", domain: "GATHER RESOURCES", question: "“What is actually depleted?”", accent: COLOR.provisioners, domainColor: "#c08a5a" },
  { name: "Weavers", domain: "SKILLFUL ORGANIZING", question: "“What structure lets work continue?”", accent: COLOR.weavers, domainColor: "#c8975a" },
  { name: "Linekeepers", domain: "DIRECT ACTION", question: "“What line must be drawn?”", accent: COLOR.linekeepers, domainColor: "#d06a52" },
  { name: "Lanternbearers", domain: "RAISE AWARENESS", question: "“What truth must become visible?”", accent: COLOR.lanternbearers, domainColor: COLOR.gold },
];

export function HousesBlock({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <div style={{ marginTop: 24, padding: "24px 24px 8px", background: COLOR.midnight }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.22em", color: "#caa978", textTransform: "uppercase" }}>
        Which House would you be in?
      </div>
      <p style={{ fontFamily: FONT.body, fontSize: 15.5, lineHeight: 1.5, color: COLOR.steelLt, margin: "9px 0 14px" }}>
        Tap to choose your practice lineage. It saves to your character — and the app remembers.
      </p>

      {selected && (
        <div
          style={{
            background: "rgba(200,163,90,.12)",
            border: `1px solid ${COLOR.gold}`,
            borderRadius: 8,
            padding: "9px 12px",
            marginBottom: 13,
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <span style={{ color: COLOR.gold, fontSize: 15 }}>✦</span>
          <span style={{ fontFamily: FONT.body, fontSize: 15, color: "#e7ddc9" }}>
            You joined the <b style={{ color: COLOR.goldLt }}>{selected}</b> — saved to your record.
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {HOUSES.map((h) => {
          const isSelected = selected === h.name;
          return (
            <button
              key={h.name}
              type="button"
              onClick={() => onSelect(h.name)}
              style={{
                textAlign: "left",
                background: COLOR.card,
                border: `1px solid #2a3047`,
                borderTop: `3px solid ${h.accent}`,
                borderRadius: 7,
                padding: "12px 13px",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 18, color: "#f1ead9", lineHeight: 1 }}>
                {h.name}
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 7.5, color: h.domainColor, letterSpacing: "0.05em", margin: "3px 0 6px" }}>
                {h.domain}
              </div>
              <div style={{ fontFamily: FONT.body, fontStyle: "italic", fontSize: 12.5, color: COLOR.steelLt, lineHeight: 1.3 }}>
                {h.question}
              </div>
              {isSelected && (
                <div style={{ position: "absolute", top: 8, right: 9, color: COLOR.gold, fontSize: 13 }}>✓</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
