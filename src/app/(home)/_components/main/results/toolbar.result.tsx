import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { StackIcon } from "@/components/stack.icon";
import { ReplayIcon } from "@/components/replay.icon";

import { useResult } from "./result.context";
import { ShareMenu } from "./share.menu";
import { ResetButton } from "../reset.button";
import { NextTextButton } from "./next-text.button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DeleteSessionButton } from "../delete-session.button";

type Props = {
  caption?: string;
  toggleHistory: () => void;
  toggleReplay: () => void;
  isNewRecord: boolean;
};

export const ResultToolbar = ({
  caption,
  toggleHistory,
  toggleReplay,
}: Props) => {
  const { session, isOwner } = useResult();
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const sessionIsValid = session && !session.isInvalid;
  const sessionHasKeystrokes = (session.keystrokes?.length ?? 0) > 0;

  return (
    <div className="flex items-center justify-center gap-4">
      <NextTextButton inResults />
      {/* Restart */}
      <ResetButton
        tooltip={caption}
        className="text-foreground"
        actionName="restart"
        tooltipSide="bottom"
      />

      {sessionHasKeystrokes && sessionIsValid ? (
        <>
          <Tooltip open={isMobile ? false : undefined}>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-foreground"
                onClick={toggleHistory}
              >
                <StackIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Input History</span>
            </TooltipContent>
          </Tooltip>

          <Tooltip open={isMobile ? false : undefined}>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-foreground"
                onClick={toggleReplay}
              >
                <ReplayIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Watch Replay</span>
            </TooltipContent>
          </Tooltip>
        </>
      ) : null}

      {isOwner && sessionIsValid && <ShareMenu />}

      {isOwner && session?._id && (
        <DeleteSessionButton
          inSession
          sessionId={session._id.toString()}
          className="text-foreground *:size-6"
        />
      )}
    </div>
  );
};
