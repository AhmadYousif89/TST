"use client";

import { useState } from "react";
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
import { useEngineActions, useEngineConfig } from "../../engine/engine.context";

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
  const { getParam } = useUrlState();
  const { updateURL } = useEngineActions();
  const { isPending, pendingAction } = useEngineConfig();
  const [isDeleting, setIsDeleting] = useState(false);

  const isCurrentSession = getParam("sid") === sessionId;
  const isPendingDelete =
    (isPending && pendingAction === "delete-session" && isCurrentSession) ||
    isDeleting;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this session?")) return;

    setIsDeleting(true);
    try {
      const res = await deleteSessionAction(sessionId);
      if (res.success) {
        // If we are currently viewing this session, navigate home
        if (isCurrentSession) updateURL({ sid: null }, "delete-session");
      } else {
        alert(res.error);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error(error);
      setIsDeleting(false);
    }
  };

  if (inSession) {
    return (
      <ResponsiveTooltip>
        <ResponsiveTooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            disabled={isPendingDelete}
            onClick={handleDelete}
            className={cn(
              "text-muted-foreground hover:bg-red/10 hover:text-red dark:hover:bg-red/10 dark:hover:text-red",
              className,
            )}
          >
            {isPendingDelete ? (
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
      disabled={isPendingDelete}
      data-deleting={isPendingDelete}
      onClick={handleDelete}
      className={cn(
        "text-muted-foreground hover:bg-red/10 hover:text-red data-[deleting=true]:text-red dark:hover:bg-red/10 dark:hover:text-red",
        className,
      )}
    >
      {isPendingDelete ? (
        <RandomIcon className="animate-spin" />
      ) : (
        <TrashIcon className="size-5" />
      )}
    </Button>
  );
};
