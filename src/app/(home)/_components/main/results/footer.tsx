"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

import Star1 from "@/assets/images/pattern-star-1.svg";

import { useResult } from "./result.context";
import { AnalyticSection } from "./analytics";
import { ResultToolbar } from "./toolbar.result";
import { LogoImage } from "../../header/logo";

type Props = {
  caption?: string;
  isNewRecord?: boolean;
};

export const ResultFooter = ({ caption, isNewRecord = false }: Props) => {
  const { session, isScreenshotting } = useResult();
  const [showReplay, setShowReplay] = useState(false);
  const [isAnimatingReplay, setIsAnimatingReplay] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isAnimatingHistory, setIsAnimatingHistory] = useState(false);

  const toggleReplay = useCallback(() => {
    setShowReplay((prev) => !prev);
    setIsAnimatingReplay(true);
  }, []);

  const toggleHistory = useCallback(() => {
    setShowHistory((prev) => !prev);
    setIsAnimatingHistory(true);
  }, []);

  const sessionIsValid = session && !session.isInvalid;
  const sessionHasKeystrokes =
    sessionIsValid && (session.keystrokes?.length ?? 0) > 0;

  return (
    <footer className="text-background relative flex flex-col items-center justify-center gap-4 pb-4">
      {sessionHasKeystrokes ? (
        <AnalyticSection
          showReplay={showReplay}
          showHistory={showHistory}
          isAnimatingReplay={isAnimatingReplay}
          isAnimatingHistory={isAnimatingHistory}
          setIsAnimatingReplay={setIsAnimatingReplay}
          setIsAnimatingHistory={setIsAnimatingHistory}
        />
      ) : (
        <p className="text-muted-foreground pb-4 whitespace-nowrap">
          Analytics are no longer available for this test.
        </p>
      )}

      {!isScreenshotting && (
        <ResultToolbar
          caption={caption}
          isNewRecord={isNewRecord}
          toggleHistory={toggleHistory}
          toggleReplay={toggleReplay}
        />
      )}

      {!isNewRecord && (
        <Image
          src={Star1}
          alt="Star Pattern"
          className="absolute right-0 -bottom-20 max-md:size-10"
        />
      )}

      {/* Watermark */}
      {isScreenshotting && (
        <div
          id="screenshot-watermark"
          className="text-muted text-5 flex items-end justify-end gap-2 self-end px-4 font-bold"
        >
          <span>
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="flex items-end gap-1 border-l-2 pl-2">
            <LogoImage className="size-6" /> TST
          </span>
        </div>
      )}
    </footer>
  );
};
