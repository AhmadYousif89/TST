"use client";

import { useEngineConfig } from "./engine.context";
import { Button } from "@/components/ui/button";
import { ArrowIcon } from "@/components/arrow.icon";

type EngineOverlayProps = {
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>;
  handleResumeSession: () => void;
};

export const EngineOverlay = ({
  hiddenInputRef,
  handleResumeSession,
}: EngineOverlayProps) => {
  const { status, showOverlay, isPending } = useEngineConfig();

  if (!showOverlay) return null;

  if (status === "idle") {
    return (
      <div
        onClick={() => hiddenInputRef.current?.focus()}
        className="bg-background/5 absolute inset-0 z-20 flex translate-y-0 items-center justify-center"
      >
        {!isPending && (
          <div className="flex flex-col items-center gap-5">
            <Button
              onClick={() => hiddenInputRef.current?.focus()}
              className="hover:text-foreground min-h-14 min-w-52 border-0 bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-400"
            >
              Start Typing Test
            </Button>
            <p className="text-foreground pointer-events-none font-semibold">
              Or click the text and start typing
            </p>
          </div>
        )}
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div
        onClick={handleResumeSession}
        className="bg-background/5 absolute inset-0 z-20 flex translate-y-0 items-center justify-center"
      >
        {!isPending && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-orange dark:text-yellow text-3 animate-pulse font-medium">
              Test Paused
            </p>
            <p className="text-foreground text-5 flex items-center gap-1 font-medium tracking-wide">
              <ArrowIcon />
              <span>Click here to resume</span>
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
};
