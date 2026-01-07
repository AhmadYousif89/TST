"use client";

import { ComponentProps, createContext, useContext } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

const ResponsiveTooltipContext = createContext<{ isMobile: boolean } | null>(
  null,
);

export function ResponsiveTooltipProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useMediaQuery("(max-width: 1024px)");
  return (
    <ResponsiveTooltipContext.Provider value={{ isMobile }}>
      {children}
    </ResponsiveTooltipContext.Provider>
  );
}

export function ResponsiveTooltip({
  children,
  ...props
}: ComponentProps<typeof Tooltip> & ComponentProps<typeof Popover>) {
  const context = useContext(ResponsiveTooltipContext);
  const isMobileFallback = useMediaQuery("(max-width: 1024px)");
  const isMobile = context ? context.isMobile : isMobileFallback;

  return (
    <ResponsiveTooltipContext.Provider value={{ isMobile }}>
      {isMobile ? (
        <Popover {...props}>{children}</Popover>
      ) : (
        <Tooltip {...props}>{children}</Tooltip>
      )}
    </ResponsiveTooltipContext.Provider>
  );
}

export function ResponsiveTooltipTrigger({
  children,
  ...props
}: ComponentProps<typeof TooltipTrigger> &
  ComponentProps<typeof PopoverTrigger>) {
  const context = useContext(ResponsiveTooltipContext);
  const isMobileFallback = useMediaQuery("(max-width: 1024px)");
  const isMobile = context ? context.isMobile : isMobileFallback;

  if (isMobile) {
    return <PopoverTrigger {...props}>{children}</PopoverTrigger>;
  }

  return <TooltipTrigger {...props}>{children}</TooltipTrigger>;
}

export function ResponsiveTooltipContent({
  className,
  children,
  ...props
}: ComponentProps<typeof TooltipContent> &
  ComponentProps<typeof PopoverContent>) {
  const context = useContext(ResponsiveTooltipContext);
  const isMobileFallback = useMediaQuery("(max-width: 1024px)");
  const isMobile = context ? context.isMobile : isMobileFallback;

  if (isMobile) {
    return (
      <PopoverContent
        className={cn(
          "bg-border text-foreground text-6 z-50 w-fit rounded-md border-0 px-3 py-1.5 text-balance shadow-none outline-hidden",
          className,
        )}
        {...props}
      >
        {children}
        <PopoverPrimitive.Arrow className="bg-border fill-border z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px]" />
      </PopoverContent>
    );
  }

  return (
    <TooltipContent className={className} {...props}>
      {children}
    </TooltipContent>
  );
}
