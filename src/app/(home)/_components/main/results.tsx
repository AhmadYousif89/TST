"use client";

import { AnonUserDoc, TypingSessionDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

import { ResultProvider, useResult } from "./results/result.context";
import { NormalRound } from "./results/normal.result";
import { BaselineRound } from "./results/baseline.result";
import { NewRecordRound } from "./results/new-record.result";
import { InvalidRound } from "./results/invalid.result";
import { SharedRound } from "./results/shared.result";

type Props = {
  text: string;
  user: AnonUserDoc | null;
  session: TypingSessionDoc | null;
  nextTextId?: string | null;
  currentAnonUserId?: string;
};

export const Results = ({
  user,
  text,
  session,
  nextTextId,
  currentAnonUserId,
}: Props) => {
  if (!session) return null;

  const isOwner = currentAnonUserId === session.anonUserId;

  return (
    <ResultProvider
      user={user}
      text={text}
      session={session}
      isOwner={isOwner}
      nextTextId={nextTextId}
    >
      <ResultLayout />
    </ResultProvider>
  );
};

const ResultLayout = () => {
  const { session, isScreenshotting, isOwner, user } = useResult();

  const isBaseline = user?.totalSessions === 1;
  const isNewRecord = user && !isBaseline && session.wpm >= user.bestWpm;

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
        ) : isBaseline ? (
          <BaselineRound />
        ) : isNewRecord ? (
          <NewRecordRound />
        ) : (
          <NormalRound />
        )}
      </div>
    </main>
  );
};
