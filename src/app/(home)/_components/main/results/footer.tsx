"use client";

import Image from "next/image";
import { Activity, useState } from "react";

import Star1 from "@/assets/images/pattern-star-1.svg";

import { cn } from "@/lib/utils";
import { TypingSessionDoc } from "@/lib/types";
import { useUrlState } from "@/hooks/use-url-state";

import { SessionChart } from "./chart";
import { ReplaySection } from "./replay";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ReplayIcon } from "@/components/replay.icon";
import { CopyLinkIcon } from "@/components/copy.icon";
import { RestartIcon } from "@/components/restart.icon";

type Props = {
  caption?: string;
  isNewRecord?: boolean;
  session?: TypingSessionDoc;
  isOwner?: boolean;
  text?: string;
};

export const ResultFooter = ({
  isNewRecord = false,
  isOwner = true,
  session,
  text,
}: Props) => {
  const { updateURL } = useUrlState();
  const [copied, setCopied] = useState(false);
  const [isReplayVisible, setIsReplayVisible] = useState(false);

  const [isAnimating, setIsAnimating] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleReplay = () => {
    setIsReplayVisible(!isReplayVisible);
    setIsAnimating(true);
  };

  return (
    <footer className="text-background relative flex flex-col items-center justify-center gap-4">
      {session && <ChartSection session={session} />}

      <div
        className={cn(
          "grid w-full transition-[grid-template-rows] duration-300 ease-in-out",
          isReplayVisible ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
        onTransitionEnd={() => setIsAnimating(false)}
      >
        <Activity mode={isReplayVisible || isAnimating ? "visible" : "hidden"}>
          <ReplaySection session={session} text={text} />
        </Activity>
      </div>

      <div className="flex items-center justify-center gap-4">
        {/* Restart */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-foreground"
              onClick={() => updateURL({ sid: null })}
            >
              <RestartIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Restart</span>
          </TooltipContent>
        </Tooltip>

        {/* Replay Test */}
        <Tooltip>
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
          <TooltipContent>
            <span>Replay</span>
          </TooltipContent>
        </Tooltip>

        {/* Share Link */}
        {isOwner && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-foreground relative"
                onClick={handleShare}
              >
                <CopyLinkIcon />
                <span
                  className={cn(
                    "text-6 text-muted-foreground absolute left-1/2 -translate-x-1/2 transition duration-200 ease-in-out",
                    copied
                      ? "translate-y-10 opacity-100"
                      : "translate-y-full opacity-0",
                  )}
                >
                  Copied!
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Copy result link</span>
            </TooltipContent>
          </Tooltip>
        )}

        {!isNewRecord && (
          <Image
            src={Star1}
            alt="Star Pattern"
            className="absolute right-0 -bottom-10 -z-10 max-md:size-10"
          />
        )}
      </div>
    </footer>
  );
};

const ChartSection = ({ session }: { session: TypingSessionDoc }) => {
  return (
    <div className="h-64 w-full">
      <SessionChart session={session} />
    </div>
  );
};
