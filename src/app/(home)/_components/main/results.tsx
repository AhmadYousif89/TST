"use client";

import { TypingSessionDoc, TextDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

import { ResultProvider, useResult } from "./results/result.context";
import { NormalRound } from "./results/normal.result";
import { BaselineRound } from "./results/baseline.result";
import { NewRecordRound } from "./results/new-record.result";
import { InvalidRound } from "./results/invalid.result";
import { SharedRound } from "./results/shared.result";

type Props = {
  text: string;
  session: TypingSessionDoc | null;
  nextText?: TextDoc | null;
  currentAnonUserId?: string;
  language?: "en" | "ar";
};

export const Results = ({
  text,
  session,
  nextText,
  currentAnonUserId,
  language,
}: Props) => {
  if (!session) return null;

  const isOwner = currentAnonUserId === session.anonUserId;

  return (
    <ResultProvider
      text={text}
      session={session}
      isOwner={isOwner}
      nextText={nextText}
      language={language}
    >
      <ResultLayout />
    </ResultProvider>
  );
};

const ResultLayout = () => {
  const { session, isScreenshotting, isOwner } = useResult();
  const sessionCount = session.validSessionsCount || 0;

  const isNewRecord = !!session.isBest && sessionCount > 1;
  const isBaseline = !!session.isFirst;

  return (
    <main className="py-4 md:py-6">
      <div
        id="result-screen"
        className={cn(
          "flex flex-col gap-6 md:gap-8",
          isScreenshotting && "px-4 md:px-6",
        )}
      >
        {session.isInvalid ? (
          <InvalidRound />
        ) : !isOwner ? (
          <SharedRound />
        ) : isNewRecord ? (
          <NewRecordRound />
        ) : isBaseline ? (
          <BaselineRound />
        ) : (
          <NormalRound />
        )}
      </div>
    </main>
  );
};
