import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ScriptText({
  children,
  className,
  underline = false,
  underlineClassName = "text-accent",
}: {
  children: ReactNode;
  className?: string;
  underline?: boolean;
  underlineClassName?: string;
}) {
  return (
    <span className={cn("relative inline-block font-script font-bold", className)}>
      {children}
      {underline ? (
        <svg
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -bottom-1 left-0 h-[10px] w-full",
            underlineClassName,
          )}
          viewBox="0 0 120 10"
          preserveAspectRatio="none"
        >
          <path
            d="M2 7 C 22 2, 48 9, 70 5 C 88 2, 104 8, 118 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      ) : null}
    </span>
  );
}
