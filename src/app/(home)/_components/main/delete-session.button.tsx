"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { useUrlState } from "@/hooks/use-url-state";
import { deleteSessionAction } from "@/app/dal/actions";
import { useEngineActions, useEngineConfig } from "../../engine/engine.context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@/components/trash.icon";
import { RandomIcon } from "@/components/random.icon";

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
  // Toolbar delete btn should receive both local and global pending state
  const isPendingDelete = inSession
    ? (isPending && pendingAction === "delete-session" && isCurrentSession) ||
      isDeleting
    : isDeleting; // History list items should only show local deletion state

  const handleDelete = async () => {
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

  const trigger = (
    <AlertDialogTrigger asChild>
      <Button
        size="icon"
        type="button"
        variant="ghost"
        disabled={isPendingDelete}
        data-deleting={isPendingDelete}
        onClick={(e) => e.stopPropagation()}
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
    </AlertDialogTrigger>
  );

  return (
    <AlertDialog>
      {inSession ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="bottom">
            <span>Delete Session</span>
          </TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex flex-col items-center gap-4">
            <span className="bg-red/10 flex size-12 items-center justify-center rounded-md">
              <TrashIcon className="text-red size-8" />
            </span>
            <div className="flex flex-col gap-2 text-center">
              <AlertDialogTitle className="text-3">
                Delete Session?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this session? This action cannot
                be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="justify-center">
          <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            className="border-0"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
