import { COLOR, FONT } from "@/lib/handbook/tokens";
import { Kicker, renderInline } from "@/components/handbook/blocks/shared";

export function ProseBlock({
  kicker,
  lead,
  paras,
}: {
  kicker?: string;
  lead?: string;
  paras: string[];
}) {
  return (
    <div style={{ padding: "30px 24px 8px" }}>
      {kicker && <Kicker>{kicker}</Kicker>}
      <div style={{ width: 46, height: 2, background: COLOR.cinnabar, margin: "13px 0 16px" }} />
      {lead && (
        <p
          style={{
            fontFamily: FONT.display,
            fontWeight: 500,
            fontSize: 30,
            lineHeight: 1.08,
            color: "#1d1a15",
            margin: "0 0 16px",
            letterSpacing: "-0.01em",
          }}
        >
          {renderInline(lead)}
        </p>
      )}
      {paras.map((p, i) => (
        <p
          key={i}
          style={{
            fontFamily: FONT.body,
            fontSize: 18,
            lineHeight: 1.62,
            color: COLOR.body,
            margin: "0 0 14px",
          }}
        >
          {renderInline(p)}
        </p>
      ))}
    </div>
  );
}
