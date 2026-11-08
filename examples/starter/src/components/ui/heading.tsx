import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-bold tracking-tight", {
  variants: {
    size: {
      xl: "text-3xl",
      lg: "text-2xl",
      md: "text-lg font-semibold",
    },
  },
  defaultVariants: { size: "lg" },
});

export type HeadingProps = ComponentPropsWithoutRef<"h2"> &
  VariantProps<typeof headingVariants> & {
    /** Semantic level. The visual size comes from `size`, not from the level. */
    level?: 1 | 2 | 3 | 4 | 5 | 6;
  };

export function Heading({ level = 2, size, className, ...props }: HeadingProps) {
  const Tag = `h${level}` as const;
  return <Tag className={cn(headingVariants({ size }), className)} {...props} />;
}
