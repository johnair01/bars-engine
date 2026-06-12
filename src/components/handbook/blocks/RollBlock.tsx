"use client";

import { COLOR, FONT } from "@/lib/handbook/tokens";
import { Kicker, renderInline } from "@/components/handbook/blocks/shared";

export interface DiceResult {
  d1: number;
  d2: number;
  total: number;
  tier: string;
  txt: string;
}

export function RollBlock({
  scene,
  move,
  stat,
  dice,
  onRoll,
}: {
  scene: string;
  move: string;
  stat: string;
  dice: DiceResult | null;
  onRoll: () => void;
}) {
  return (
    <div style={{ padding: "26px 24px 8px" }}>
      <Kicker>A move at the table · try it</Kicker>
      <p style={{ fontFamily: FONT.body, fontSize: 17, lineHeight: 1.58, color: COLOR.body, margin: "11px 0 12px" }}>
        {renderInline(scene)}
      </p>
      <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 10, background: COLOR.pine, color: "#e7efe2", padding: "4px 9px", borderRadius: 3 }}>
          {move}
        </span>
        <span style={{ fontFamily: FONT.mono, fontSize: 10, background: COLOR.midnight, color: COLOR.gold, padding: "4px 9px", borderRadius: 3 }}>
          {stat}
        </span>
      </div>
      <button
        type="button"
        onClick={onRoll}
        style={{
          width: "100%",
          background: COLOR.cinnabar,
          border: "none",
          borderRadius: 8,
          padding: 13,
          textAlign: "center",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(168,64,46,.3)",
        }}
      >
        <span style={{ fontFamily: FONT.label, fontSize: 16, color: "#f6ece0", letterSpacing: "0.03em" }}>
          ⚄ Roll 2d6 + Sense
        </span>
      </button>

      {dice && (
        <div
          style={{
            marginTop: 14,
            border: "1.5px solid #211d18",
            background: COLOR.chip,
            borderRadius: 8,
            padding: 14,
            animation: "handbookFadeUp .3s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
            {[dice.d1, dice.d2].map((d, i) => (
              <div
                key={i}
                style={{
                  width: 38,
                  height: 38,
                  border: "2px solid #211d18",
                  borderRadius: 7,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: FONT.mono,
                  fontSize: 18,
                  fontWeight: 600,
                  background: "#fff",
                }}
              >
                {d}
              </div>
            ))}
            <span style={{ fontFamily: FONT.mono, fontSize: 13, color: "#5c5236" }}>+1 Sense</span>
            <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 26, color: COLOR.provisioners, marginLeft: "auto" }}>
              = {dice.total}
            </span>
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.1em", color: COLOR.provisioners, textTransform: "uppercase", marginBottom: 5 }}>
            {dice.tier}
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 15.5, lineHeight: 1.5, color: COLOR.body }}>{dice.txt}</div>
        </div>
      )}
    </div>
  );
}
