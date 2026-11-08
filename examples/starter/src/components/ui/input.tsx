import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export type InputProps = ComponentPropsWithoutRef<"input"> & {
  /** Marks the field as invalid for assistive technology and styles the error state. */
  invalid?: boolean;
};

export function Input({ invalid = false, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}
