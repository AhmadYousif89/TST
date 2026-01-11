import { useUrlState } from "@/hooks/use-url-state";
import { useMediaQuery } from "@/hooks/use-media-query";

import { Button } from "@/components/ui/button";
import { StackIcon } from "@/components/stack.icon";
import { RandomIcon } from "@/components/random.icon";
import { ReplayIcon } from "@/components/replay.icon";
import { RestartIcon } from "@/components/restart.icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ShareMenu } from "./share.menu";
import { NextTextButton } from "./next-text.button";
import { DeleteSessionButton } from "../delete-session.button";
import { useResult } from "./result.context";

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
  const { updateURL, isPending } = useUrlState();

  const id = session?.textId.toString() || null;
  const category = session?.category || null;
  const difficulty = session?.difficulty || null;
  const buildUrl = () => {
    updateURL({ id, category, difficulty, sid: null });
  };

  const sessionIsValid = session && !session.isInvalid;
  const sessionHasKeystrokes =
    sessionIsValid && (session.keystrokes?.length ?? 0) > 0;

  return (
    <div className="flex items-center justify-center gap-4">
      <NextTextButton inResults />
      {/* Restart */}
      <Tooltip open={isMobile ? false : undefined}>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="text-foreground"
            onClick={buildUrl}
          >
            {isPending ? (
              <RandomIcon className="animate-spin opacity-60" />
            ) : (
              <RestartIcon />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>{caption}</span>
        </TooltipContent>
      </Tooltip>

      {sessionHasKeystrokes ? (
        <>
          {/* Input History */}
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
          {/* Replay Test */}
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
