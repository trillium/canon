import NextLink from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type LinkProps = ComponentProps<typeof NextLink>;

/** Navigation link. Goes through Next.js routing and prefetching. */
export function Link({ className, ...props }: LinkProps) {
  return (
    <NextLink
      className={cn(
        "text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}
