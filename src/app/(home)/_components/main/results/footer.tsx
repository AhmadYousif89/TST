"use client";

import Image from "next/image";
import { Activity, useState } from "react";

import Star1 from "@/assets/images/pattern-star-1.svg";

import { cn } from "@/lib/utils";
import { TypingSessionDoc } from "@/lib/types";
import { useUrlState } from "@/hooks/use-url-state";

import { SessionChart } from "./chart";
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
};

export const ResultFooter = ({
  isNewRecord = false,
  isOwner = true,
  session,
}: Props) => {
  const { updateURL } = useUrlState();
  const [copied, setCopied] = useState(false);
  const [isReplayVisible, setIsReplayVisible] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <footer className="text-background relative flex flex-col items-center justify-center gap-8">
      {session && <ChartSection session={session} />}

      <Activity mode={isReplayVisible ? "visible" : "hidden"}>
        <ReplaySection isVisiable={isReplayVisible} />
      </Activity>

      <div className="flex items-center justify-center gap-4 max-md:flex-col">
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
              onClick={() => setIsReplayVisible(!isReplayVisible)}
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
            className="absolute right-0 -bottom-1/4 -z-10 max-md:mt-11 max-md:size-10"
          />
        )}
      </div>
    </footer>
  );
};

const ChartSection = ({ session }: { session: TypingSessionDoc }) => {
  return (
    <div className="w-full">
      <SessionChart session={session} />
    </div>
  );
};

const ReplaySection = ({ isVisiable }: { isVisiable: boolean }) => {
  return (
    <div
      className={cn(
        "text-foreground h-0 w-full",
        isVisiable &&
          "h-full transition-[height] transition-discrete duration-200 ease-in-out",
      )}
    >
      <div className="text-muted-foreground flex items-center gap-2">
        <h2 className="text-5">watch replay</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost">
              <svg
                className="size-6"
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="M320-200v-560l440 280-440 280Z" />
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Play</span>
          </TooltipContent>
        </Tooltip>
      </div>
      {/* TODO: Add text data for replay */}
      <p className="text-5 text-foreground/75">
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quisquam alias
        quo, quos molestias nostrum ipsa iure deserunt voluptatem.
      </p>
    </div>
  );
};
