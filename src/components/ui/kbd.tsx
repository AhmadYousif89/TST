import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-muted/60 pointer-events-none inline-flex h-4 w-fit min-w-5 items-center justify-center gap-1 rounded px-1.5 select-none",
        "[&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    />
  );
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn(
        "text-muted-foreground inline-flex items-center gap-1",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
