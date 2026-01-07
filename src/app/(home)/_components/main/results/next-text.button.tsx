"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { RandomIcon } from "@/components/random.icon";
import { ChevronIcon } from "@/components/chevron.icon";
import { useUrlState } from "@/hooks/use-url-state";

type Props = {
  nextTextId: string;
  className?: string;
  inSession?: boolean;
};

export const NextTextButton = ({ nextTextId, className, inSession }: Props) => {
  const { updateURL, isPending } = useUrlState();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={cn("text-foreground", className)}
          onClick={() => updateURL({ id: nextTextId, sid: null })}
          disabled={isPending}
        >
          {isPending ? (
            <RandomIcon className="animate-spin opacity-60" />
          ) : (
            <ChevronIcon />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={inSession ? "bottom" : "top"}>
        <span>Next Text</span>
      </TooltipContent>
    </Tooltip>
  );
};
