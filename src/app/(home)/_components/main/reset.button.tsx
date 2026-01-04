"use client";

import { Button } from "@/components/ui/button";
import { RestartIcon } from "@/components/restart.icon";
import { useEngineActions } from "@/app/(home)/engine/engine.context";

export const ResetButton = () => {
  const { resetSession } = useEngineActions();

  return (
    <Button
      variant="secondary"
      onClick={resetSession}
      className="h-12 w-36 sm:h-14 sm:w-45"
    >
      Restart <span className="hidden sm:inline">Test</span>
      <RestartIcon />
    </Button>
  );
};
