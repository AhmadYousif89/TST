"use client";

import Image from "next/image";
import { useState } from "react";

import Star1 from "@/assets/images/pattern-star-1.svg";

import { Button } from "@/components/ui/button";
import { RestartIcon } from "@/components/restart.icon";
import { useUrlState } from "@/hooks/use-url-state";
import { TypingSessionDoc } from "@/lib/types";
import { SessionChart } from "./chart";

type Props = {
  caption?: string;
  isNewRecord?: boolean;
  session?: TypingSessionDoc;
  isOwner?: boolean;
};

export const ResultFooter = ({
  caption = "Beat This Score",
  isNewRecord = false,
  isOwner = true,
  session,
}: Props) => {
  const { updateURL } = useUrlState();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <footer className="text-background relative flex flex-col items-center justify-center gap-8">
      {session && <AnalyticsSection session={session} />}

      <div className="flex items-center justify-center gap-4 max-md:flex-col">
        <Button
          variant="secondary"
          className="bg-foreground hover:bg-foreground/90 min-h-14 min-w-54 gap-2.5 font-semibold"
          onClick={() => updateURL({ sid: null })}
        >
          <span>{caption}</span>
          <RestartIcon />
        </Button>

        {isOwner && (
          <Button
            className="text-foreground min-h-14 min-w-54 gap-2.5"
            onClick={handleShare}
          >
            <span>{copied ? "Copied!" : "Share Result"}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </Button>
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

const AnalyticsSection = ({ session }: { session: TypingSessionDoc }) => {
  return (
    <section className="grid w-full">
      <SessionChart session={session} />
    </section>
  );
};
