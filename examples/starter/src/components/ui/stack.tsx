import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const stackVariants = cva("flex", {
  variants: {
    direction: { column: "flex-col", row: "flex-row" },
    gap: { none: "gap-0", sm: "gap-2", md: "gap-4", lg: "gap-8" },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
    },
    wrap: { true: "flex-wrap", false: "flex-nowrap" },
  },
  defaultVariants: {
    direction: "column",
    gap: "md",
    align: "stretch",
    justify: "start",
    wrap: false,
  },
});

export type StackProps = ComponentPropsWithoutRef<"div"> & VariantProps<typeof stackVariants>;

/** Flex row or column with gap, align and justify props. */
export function Stack({ className, direction, gap, align, justify, wrap, ...props }: StackProps) {
  return (
    <div
      className={cn(stackVariants({ direction, gap, align, justify, wrap }), className)}
      {...props}
    />
  );
}
