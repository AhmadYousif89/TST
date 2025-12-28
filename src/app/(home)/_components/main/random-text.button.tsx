"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  useEngineActions,
  useEngineState,
} from "@/app/(home)/engine/engine.context";
import { getRandomTextAction } from "@/app/dal/actions";
import { useUrlState } from "@/hooks/use-url-state";

export const RandomTextButton = () => {
  const [isPending, startTransition] = useTransition();
  const { textData, category, difficulty } = useEngineState();
  const { resetSession } = useEngineActions();
  const { updateURL } = useUrlState();

  const handleRandomize = () => {
    if (!textData) return;

    resetSession();

    startTransition(async () => {
      const nextId = await getRandomTextAction({
        textId: textData._id.toString(),
        category,
        difficulty,
      });

      if (nextId) updateURL({ id: nextId });
    });
  };

  return (
    <Button
      className="h-12 w-36 sm:h-14 sm:w-45"
      onClick={handleRandomize}
      disabled={isPending}
    >
      <span>Randomize</span>
      <svg
        className={`size-5 ${isPending ? "animate-spin" : ""}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 -960 960 960"
        height="20px"
        width="20px"
        fill="currentColor"
      >
        <path d="M331-126q-107-45-171-141T96-479q0-32 5-62.5t15-60.5l-71 41-36-63 187-108 108 188-62 36-51-88q-11 28-17 57.5t-6 60.5q0 97 54.5 175.5T368-189l-37 63Zm293-474v-72h102q-43-55-107-87.5T480-792q-56 0-105 19t-90 51l-37-63q48-37 107-58t125-21q87 0 160.5 35.5T768-733v-83h72v216H624ZM590 0 403-108l108-187 63 36-51 88q115-17 192-104.5T792-477q0-13-1-25.5t-3-25.5h73q2 12 2.5 24.5t.5 25.5q0 136-87.5 242T555-103l71 41-36 62Z" />
      </svg>
    </Button>
  );
};
