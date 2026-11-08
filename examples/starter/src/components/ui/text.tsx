import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const textVariants = cva("", {
  variants: {
    size: { sm: "text-sm", md: "text-base" },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      danger: "text-destructive",
    },
  },
  defaultVariants: { size: "md", tone: "default" },
});

export type TextProps = ComponentPropsWithoutRef<"p"> &
  VariantProps<typeof textVariants> & {
    /** Render inline text instead of a paragraph. */
    inline?: boolean;
  };

export function Text({ inline = false, size, tone, className, ...props }: TextProps) {
  const Tag = inline ? "span" : "p";
  return <Tag className={cn(textVariants({ size, tone }), className)} {...props} />;
}
