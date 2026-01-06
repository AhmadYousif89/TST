"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { TrashIcon } from "@/components/trash.icon";
import { deleteSessionAction } from "@/app/dal/actions";
import { useUrlState } from "@/hooks/use-url-state";

export const DeleteSessionButton = ({ sessionId }: { sessionId: string }) => {
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
        if (getParam("sid") === sessionId) {
          updateURL({ sid: null });
        }
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      disabled={isPending}
      onClick={handleDelete}
      className="text-muted-foreground hover:text-red size-4 transition-colors hover:bg-transparent!"
    >
      <TrashIcon className="size-5" />
    </Button>
  );
};
