import { COLOR, FONT } from "@/lib/handbook/tokens";

export function FooterBlock({ nextLabel }: { nextLabel: string }) {
  return (
    <div style={{ marginTop: 20, padding: 24, textAlign: "center", borderTop: "1px solid #d5c8aa" }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.18em", color: "#9a8d72" }}>
        — THE OPENING ENDS HERE —
      </div>
      <div style={{ marginTop: 14, display: "inline-block", border: `1px solid ${COLOR.cinnabar}`, borderRadius: 8, padding: "11px 20px", cursor: "pointer" }}>
        <span style={{ fontFamily: FONT.label, fontSize: 15, color: COLOR.cinnabar }}>{nextLabel}</span>
      </div>
      <div style={{ fontFamily: FONT.mono, fontSize: 9, color: "#b3a583", marginTop: 16, lineHeight: 1.6 }}>
        PROTOTYPE · front-of-book vertical slice
        <br />
        content + skin shared with the print export
      </div>
    </div>
  );
}
