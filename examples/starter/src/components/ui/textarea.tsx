import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = ComponentPropsWithoutRef<"textarea"> & {
  /** Marks the field as invalid for assistive technology and styles the error state. */
  invalid?: boolean;
};

export function Textarea({ invalid = false, className, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-24 py-2 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}
