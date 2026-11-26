"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SuggestionsProps = ComponentProps<"div">;

export const Suggestions = ({ className, children, ...props }: SuggestionsProps) => (
  <div className={cn("flex flex-wrap items-center justify-center gap-2", className)} {...props}>
    {children}
  </div>
);

export type SuggestionProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant = "outline",
  size = "sm",
  children,
  ...props
}: SuggestionProps) => (
  <Button
    className={cn("h-auto cursor-pointer rounded-full px-3.5 py-1.5 font-normal whitespace-normal", className)}
    onClick={() => onClick?.(suggestion)}
    size={size}
    type="button"
    variant={variant}
    {...props}
  >
    {children || suggestion}
  </Button>
);
