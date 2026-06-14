import { COLOR, FONT } from "@/lib/handbook/tokens";
import { renderInline } from "@/components/handbook/blocks/shared";

export function LetterBlock({
  kicker,
  lead,
  paras,
  signature,
  signatureNote,
  seal,
}: {
  kicker: string;
  lead: string;
  paras: string[];
  signature: string;
  signatureNote: string;
  seal: string;
}) {
  return (
    <div style={{ margin: "18px 0", padding: "26px 24px", background: COLOR.midnight, color: "#ece6d6", position: "relative" }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.22em", color: "#caa978", textTransform: "uppercase" }}>
        {kicker}
      </div>
      <p
        style={{
          fontFamily: FONT.display,
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: 23,
          lineHeight: 1.3,
          color: COLOR.goldLt,
          margin: "13px 0 14px",
        }}
      >
        {lead}
      </p>
      {paras.map((p, i) => (
        <p
          key={i}
          style={{
            fontFamily: FONT.body,
            fontSize: 16.5,
            lineHeight: 1.6,
            color: COLOR.parchOnDark,
            margin: i === paras.length - 1 ? "0 0 18px" : "0 0 12px",
          }}
        >
          {renderInline(p)}
        </p>
      ))}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontFamily: FONT.body, fontStyle: "italic", fontSize: 13, color: COLOR.steel }}>{signatureNote}</div>
          <div style={{ fontFamily: FONT.hand, fontWeight: 700, fontSize: 31, color: "#f1ead9", lineHeight: 0.9 }}>
            {signature}
          </div>
          <div
            style={{
              width: 140,
              height: 0,
              borderBottom: `2px solid ${COLOR.cinnabar}`,
              marginTop: 5,
              transform: "rotate(-1.5deg)",
              transformOrigin: "left",
              opacity: 0.85,
            }}
          />
        </div>
        <div style={{ position: "relative", width: 62, height: 62, flex: "0 0 auto", transform: "rotate(-6deg)" }}>
          <div style={{ position: "absolute", inset: 0, background: COLOR.cinnabar, borderRadius: 4 }} />
          <div style={{ position: "absolute", inset: 5, border: "1.5px solid rgba(247,236,224,.78)", borderRadius: 2 }} />
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <span style={{ fontFamily: FONT.seal, fontSize: 36, color: "#f6ece0" }}>{seal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
