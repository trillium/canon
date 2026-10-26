import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export type CodeProps = ComponentPropsWithoutRef<"code"> & {
  /** Render a scrollable block instead of an inline snippet. */
  block?: boolean;
};

export function Code({ block = false, className, ...props }: CodeProps) {
  const code = (
    <code
      className={cn("rounded bg-muted px-1 font-mono text-sm text-foreground", className)}
      {...props}
    />
  );
  return block ? <pre className="overflow-x-auto rounded bg-muted p-4">{code}</pre> : code;
}
