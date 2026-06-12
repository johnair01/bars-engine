import { COLOR, FONT } from "@/lib/handbook/tokens";
import { MOVE_ICONS } from "@/lib/handbook/assets";
import { Kicker } from "@/components/handbook/blocks/shared";

// Canonical copy lives here — static block, no JSON data.
const MOVES: { icon: string; name: string; gloss: string }[] = [
  { icon: MOVE_ICONS.wakeUp, name: "Wake Up", gloss: "understand what's really happening" },
  { icon: MOVE_ICONS.cleanUp, name: "Clean Up", gloss: "repair harm, restore integrity" },
  { icon: MOVE_ICONS.growUp, name: "Grow Up", gloss: "build capacity under pressure" },
  { icon: MOVE_ICONS.showUp, name: "Show Up", gloss: "act to change the situation" },
];

export function MovesBlock() {
  return (
    <div style={{ padding: "24px 24px 6px" }}>
      <Kicker>How you play · the four moves</Kicker>
      <p style={{ fontFamily: FONT.body, fontSize: 17, lineHeight: 1.55, color: COLOR.body, margin: "11px 0 16px" }}>
        Every risky moment enters through one of four moves. Roll <b>2d6 + a School stat</b> and read what your move
        does to the field.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {MOVES.map((m) => (
          <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: COLOR.chip,
                border: "1.5px solid #c2ad84",
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.icon} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontFamily: FONT.label, fontSize: 17, color: "#211d18", lineHeight: 1 }}>{m.name}</div>
              <div style={{ fontFamily: FONT.body, fontStyle: "italic", fontSize: 14, color: COLOR.muteInk }}>
                {m.gloss}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
