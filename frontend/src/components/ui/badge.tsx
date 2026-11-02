import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "secondary" | "outline";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-indigo-900/60 text-indigo-300 border-indigo-700/60",
    success: "bg-emerald-900/60 text-emerald-300 border-emerald-700/60",
    warning: "bg-amber-900/60 text-amber-300 border-amber-700/60",
    danger: "bg-red-900/60 text-red-300 border-red-700/60",
    secondary: "bg-slate-800 text-slate-300 border-slate-700",
    outline: "bg-transparent text-slate-300 border-slate-700",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
