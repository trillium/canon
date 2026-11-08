import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export type LabelProps = ComponentPropsWithoutRef<"label">;

export function Label({ className, ...props }: LabelProps) {
  // biome-ignore lint/a11y/noLabelWithoutControl: callers pass htmlFor or wrap the control
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}
