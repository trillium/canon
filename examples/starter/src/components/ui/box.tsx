import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export type BoxProps = ComponentPropsWithoutRef<"div">;

/** Generic container. Use Stack when the children need flex layout. */
export function Box({ className, ...props }: BoxProps) {
  return <div className={cn(className)} {...props} />;
}
