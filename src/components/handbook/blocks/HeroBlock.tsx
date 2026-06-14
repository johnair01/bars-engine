import { COLOR, FONT } from "@/lib/handbook/tokens";
import { artSrc } from "@/lib/handbook/assets";

export function HeroBlock({
  art,
  kicker,
  title,
  sub,
}: {
  art: string;
  kicker: string;
  title: string;
  sub: string;
}) {
  return (
    <div style={{ position: "relative", height: 300, overflow: "hidden", background: COLOR.lacquer }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artSrc(art)}
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.82 }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(8,10,18,.25), transparent 40%, rgba(8,10,18,.9))",
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "22px 22px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.24em", color: "#e3b98c" }}>{kicker}</div>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 33,
            lineHeight: 1.04,
            color: "#f4ecda",
            margin: "8px 0 6px",
            whiteSpace: "pre-line",
          }}
        >
          {title}
        </div>
        <div style={{ width: 40, height: 1, background: COLOR.gold, margin: "0 auto 8px" }} />
        <div style={{ fontFamily: FONT.body, fontStyle: "italic", fontSize: 13, color: "#cbd2dc" }}>{sub}</div>
      </div>
    </div>
  );
}
