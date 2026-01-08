"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  [
    "text-6 md:text-5 cursor-pointer outline-none transition-[color,box-shadow] inline-flex items-center justify-center gap-2 rounded-md whitespace-nowrap",

    "focus-visible:ring-offset-background focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:ring-offset-2",

    "data-[state=on]:text-foreground data-[state=on]:border-0 data-[state=on]:bg-blue-400",
    "dark:data-[state=on]:bg-blue-600 dark:data-[state=on]:text-foreground",

    "disabled:pointer-events-none disabled:opacity-50",

    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 ",

    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  ],
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border text-muted-foreground hover:border-blue-600 hover:text-blue-600 bg-transparent shadow-xs dark:hover:text-blue-400 dark:hover:border-blue-400 ",
      },
      size: {
        default: "h-9 px-3 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
