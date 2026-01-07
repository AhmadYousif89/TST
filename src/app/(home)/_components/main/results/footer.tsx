"use client";

import Image from "next/image";
import { useState } from "react";

import Star1 from "@/assets/images/pattern-star-1.svg";

import { cn } from "@/lib/utils";
import { TypingSessionDoc } from "@/lib/types";
import { useUrlState } from "@/hooks/use-url-state";

import { AnalyticSection } from "./analytics";
import { NextTextButton } from "./next-text.button";
import { DeleteSessionButton } from "../delete-session.button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { StackIcon } from "@/components/stack.icon";
import { CopyLinkIcon } from "@/components/copy.icon";
import { RandomIcon } from "@/components/random.icon";
import { ReplayIcon } from "@/components/replay.icon";
import { RestartIcon } from "@/components/restart.icon";

type Props = {
  caption?: string;
  isNewRecord?: boolean;
  session?: TypingSessionDoc;
  isOwner?: boolean;
  text?: string;
  nextTextId?: string | null;
};

export const ResultFooter = ({
  caption,
  nextTextId,
  isNewRecord = false,
  isOwner = true,
  session,
  text,
}: Props) => {
  const [copied, setCopied] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [isAnimatingReplay, setIsAnimatingReplay] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isAnimatingHistory, setIsAnimatingHistory] = useState(false);

  const { updateURL, isPending } = useUrlState();

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleReplay = () => {
    setShowReplay(!showReplay);
    setIsAnimatingReplay(true);
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
    setIsAnimatingHistory(true);
  };

  return (
    <footer className="text-background relative flex flex-col items-center justify-center gap-4 pb-4">
      {session && !session.isInvalid && (
        <AnalyticSection
          text={text}
          session={session}
          showReplay={showReplay}
          showHistory={showHistory}
          isAnimatingReplay={isAnimatingReplay}
          isAnimatingHistory={isAnimatingHistory}
          setIsAnimatingReplay={setIsAnimatingReplay}
          setIsAnimatingHistory={setIsAnimatingHistory}
        />
      )}

      <div className="flex items-center justify-center gap-4">
        {/* Next Text */}
        {nextTextId && <NextTextButton nextTextId={nextTextId} inSession />}
        {/* Restart */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-foreground"
              onClick={() => updateURL({ sid: null })}
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
        {/* Replay Test */}
        {!session?.isInvalid && (
          <>
            <Tooltip>
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
              <TooltipContent side="bottom">
                <span>{showReplay ? "Hide Replay" : "Watch Replay"}</span>
              </TooltipContent>
            </Tooltip>
          </>
        )}
        {/* Share Link */}
        {isOwner && !session?.isInvalid && (
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
                    "text-muted-foreground absolute left-1/2 -translate-x-1/2 text-[12px] transition duration-200 ease-in-out",
                    copied
                      ? "translate-y-10 opacity-100"
                      : "translate-y-full opacity-0",
                  )}
                >
                  Link Copied!
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Share Result</span>
            </TooltipContent>
          </Tooltip>
        )}

        {isOwner && session?._id && (
          <DeleteSessionButton
            inSession
            sessionId={session._id.toString()}
            className="text-foreground *:size-6"
          />
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
