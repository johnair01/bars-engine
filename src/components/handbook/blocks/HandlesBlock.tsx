import { COLOR, FONT } from "@/lib/handbook/tokens";
import { Kicker } from "@/components/handbook/blocks/shared";

/**
 * Static reference of the six character handles. Canonical copy lives here.
 * Not used by `front-of-book` yet, but defined so the reader's `switch` stays
 * exhaustive and later chapters can drop in `{ "type": "handles" }`.
 */
const HANDLES: { name: string; gloss: string }[] = [
  { name: "House", gloss: "your practice lineage — how you tend to help" },
  { name: "School", gloss: "the discipline your Nation trains into you" },
  { name: "Offer", gloss: "what you bring to the table" },
  { name: "Cost", gloss: "what your help asks of you" },
  { name: "Line", gloss: "the boundary you will not cross" },
  { name: "Bond", gloss: "who you are accountable to" },
];

export function HandlesBlock() {
  return (
    <div style={{ padding: "24px 24px 6px" }}>
      <Kicker>Your handles · what the sheet tracks</Kicker>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        {HANDLES.map((h) => (
          <div key={h.name} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: FONT.label, fontSize: 16, color: COLOR.ink, flex: "0 0 88px" }}>{h.name}</span>
            <span style={{ fontFamily: FONT.body, fontStyle: "italic", fontSize: 15, color: COLOR.muteInk, lineHeight: 1.4 }}>
              {h.gloss}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
