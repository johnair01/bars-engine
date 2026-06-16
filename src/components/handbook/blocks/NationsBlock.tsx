import { COLOR, FONT } from "@/lib/handbook/tokens";
import { artSrc } from "@/lib/handbook/assets";
import { Kicker } from "@/components/handbook/blocks/shared";

// Canonical Nation tiles — static block, no JSON data.
const NATIONS: { name: string; art: string; element: string; color: string }[] = [
  { name: "Pyrakanth", art: "pyrakanth-bold-heart.png", element: "FIRE", color: COLOR.fire },
  { name: "Lamenth", art: "lamenth-truth-seer.png", element: "WATER", color: COLOR.water },
  { name: "Virelune", art: "virelune-joyful-connector.png", element: "WOOD", color: COLOR.wood },
  { name: "Argyra", art: "argyra-still-point.png", element: "METAL", color: COLOR.metal },
  { name: "Meridia", art: "meridia-devoted-guardian.png", element: "EARTH", color: COLOR.earth },
];

export function NationsBlock() {
  return (
    <div style={{ padding: "26px 24px 8px" }}>
      <Kicker>Where you&apos;re from · what trains you</Kicker>
      <p style={{ fontFamily: FONT.body, fontSize: 16.5, lineHeight: 1.55, color: COLOR.body, margin: "11px 0 14px" }}>
        The ship is a worldship. Your <b>Nation</b> is the element you were raised inside; your <b>School</b> is the
        discipline it trains into you.
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {NATIONS.map((n) => (
          <div key={n.name} style={{ flex: 1 }}>
            <div style={{ aspectRatio: "3 / 4", overflow: "hidden", borderRadius: 4, border: "1px solid #c2ad84" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={artSrc(n.art)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 11, color: "#211d18", textAlign: "center", marginTop: 3, lineHeight: 1 }}>
              {n.name}
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 6, color: n.color, textAlign: "center" }}>{n.element}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: FONT.hand, fontSize: 19, color: COLOR.cinnabar, lineHeight: 1.1 }}>
        Heritage is where you begin. Discipline is who you become.
      </div>
    </div>
  );
}
