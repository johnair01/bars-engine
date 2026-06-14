import { Fragment, type ReactNode } from "react";
import { COLOR, FONT } from "@/lib/handbook/tokens";

/**
 * Lightweight inline markup for prose authored in the JSON:
 *   **text** → cinnabar emphasis span
 *   *text*   → italic
 * Everything else renders verbatim. Keep the writers' surface tiny on purpose.
 */
export function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Split on **…** (group 1) or *…* (group 2), keeping the captured inner text.
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={key++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1] !== undefined) {
      out.push(
        <span key={key++} style={{ color: COLOR.cinnabar }}>
          {m[1]}
        </span>
      );
    } else if (m[2] !== undefined) {
      out.push(
        <i key={key++} style={{ fontStyle: "italic" }}>
          {m[2]}
        </i>
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return out;
}

/** The small uppercase mono kicker used above most sections. */
export function Kicker({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 9.5,
        letterSpacing: "0.22em",
        color: dark ? "#caa978" : COLOR.lanternbearers,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}
