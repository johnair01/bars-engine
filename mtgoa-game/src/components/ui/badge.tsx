import * as React from "react";
import { cn } from "@/lib/utils";

/** Small uppercase tag, mirrors tokens.typography.label / .tag. */
export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-label",
        className,
      )}
      {...props}
    />
  );
}
