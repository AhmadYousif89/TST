"use client";

import { useTransition } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@/components/trash.icon";
import { deleteSessionAction } from "@/app/dal/actions";
import { useUrlState } from "@/hooks/use-url-state";
import { RandomIcon } from "@/components/random.icon";
import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/responsive-tooltip";

type Props = {
  sessionId: string;
  className?: string;
  inSession?: boolean;
};

export const DeleteSessionButton = ({
  sessionId,
  className,
  inSession,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const { updateURL, getParam } = useUrlState();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this session?")) return;

    startTransition(async () => {
      const res = await deleteSessionAction(sessionId);
      if (res.success) {
        // If we are currently viewing this session, navigate home
        if (getParam("sid") === sessionId) updateURL({ sid: null });
      } else {
        alert(res.error);
      }
    });
  };

  if (inSession) {
    return (
      <ResponsiveTooltip>
        <ResponsiveTooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            disabled={isPending}
            onClick={handleDelete}
            className={cn(
              "text-muted-foreground hover:bg-red/10 hover:text-red",
              className,
            )}
          >
            {isPending ? (
              <RandomIcon className="animate-spin" />
            ) : (
              <TrashIcon className="size-5" />
            )}
          </Button>
        </ResponsiveTooltipTrigger>
        <ResponsiveTooltipContent side="bottom">
          <span>Delete Session</span>
        </ResponsiveTooltipContent>
      </ResponsiveTooltip>
    );
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      disabled={isPending}
      onClick={handleDelete}
      className={cn(
        "text-muted-foreground hover:bg-red/10 hover:text-red",
        className,
      )}
    >
      {isPending ? (
        <RandomIcon className="animate-spin" />
      ) : (
        <TrashIcon className="size-5" />
      )}
    </Button>
  );
};
