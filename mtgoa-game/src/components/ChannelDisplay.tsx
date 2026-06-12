/**
 * ChannelDisplay — Wuxing channel energy readout.
 * Shows each element's glyph, name, and current pool amount in its token color.
 */
import { CHANNELS, ELEMENTS, type ChannelPool } from "@/data/channels";
import { channelClass } from "../../design-system/theme";
import { cn } from "@/lib/utils";

interface Props {
  pool: ChannelPool;
}

export function ChannelDisplay({ pool }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {ELEMENTS.map((el) => {
        const def = CHANNELS[el];
        const amount = pool[el] ?? 0;
        return (
          <div
            key={el}
            className={cn(
              "flex min-w-[64px] flex-col items-center rounded-md border bg-surf px-2 py-1.5",
              channelClass[el].border,
              amount === 0 && "opacity-40",
            )}
            title={`${def.element} · ${def.emotion} · ${def.quality}`}
          >
            <span className={cn("text-lg leading-none", channelClass[el].text)}>{def.glyph}</span>
            <span className="ds-label mt-1 text-muted">{el}</span>
            <span className={cn("text-sm font-bold tabular-nums", channelClass[el].text)}>
              {amount}
            </span>
          </div>
        );
      })}
    </div>
  );
}
