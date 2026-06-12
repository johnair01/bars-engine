import { COLOR, FONT } from "@/lib/handbook/tokens";

export function PullquoteBlock({ text }: { text: string }) {
  return (
    <div style={{ padding: "0 24px 8px" }}>
      <p
        style={{
          fontFamily: FONT.display,
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: 21,
          lineHeight: 1.36,
          color: COLOR.cinnabar,
          margin: "18px 0 4px",
        }}
      >
        {text}
      </p>
    </div>
  );
}
