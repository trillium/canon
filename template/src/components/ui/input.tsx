/* ds-ignore-file */
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, id, ...props }, ref) => {
    return (
      <input
        type={type}
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(
          "flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 " +
            "py-1 text-sm text-gray-900 shadow-sm transition-colors " +
            "placeholder:text-gray-400 " +
            "focus:outline-none focus:ring-2 focus:ring-primary-500 " +
            "disabled:cursor-not-allowed disabled:opacity-50 " +
            "dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100",
          error && "border-red-500 focus:ring-red-500",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
