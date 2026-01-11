import { getInitialText } from "@/app/dal/data";
import { AnonUserDoc, TypingSessionDoc } from "@/lib/types";

import { ResultProvider } from "./results/result.context";
import { NormalRound } from "./results/normal.result";
import { BaselineRound } from "./results/baseline.result";
import { NewRecordRound } from "./results/new-record.result";
import { InvalidRound } from "./results/invalid.result";
import { SharedRound } from "./results/shared.result";

type Props = {
  user: AnonUserDoc | null;
  session: TypingSessionDoc | null;
  nextTextId?: string | null;
  currentAnonUserId?: string;
};

export const Results = async ({
  user,
  session,
  nextTextId,
  currentAnonUserId,
}: Props) => {
  if (!session) return null;

  const isOwner = currentAnonUserId === session.anonUserId;
  const textData = await getInitialText({ id: session.textId.toString() });
  const text = textData?.text || "";

  if (session.isInvalid) {
    return (
      <Wrapper>
        <ResultProvider
          session={session}
          text={text}
          user={user}
          nextTextId={nextTextId}
          isOwner={isOwner}
        >
          <InvalidRound />
        </ResultProvider>
      </Wrapper>
    );
  }

  if (!isOwner) {
    return (
      <Wrapper>
        <ResultProvider
          session={session}
          text={text}
          user={user}
          nextTextId={nextTextId}
          isOwner={isOwner}
        >
          <div
            id="result-screen"
            className="bg-background flex flex-col gap-6 md:gap-8"
          >
            <SharedRound />
          </div>
        </ResultProvider>
      </Wrapper>
    );
  }

  const isBaseline = user?.totalSessions === 1;
  const isNewRecord = user && !isBaseline && session.wpm >= user.bestWpm;

  return (
    <Wrapper>
      <ResultProvider
        session={session}
        text={text}
        user={user}
        nextTextId={nextTextId}
        isOwner={isOwner}
      >
        <div
          id="result-screen"
          className="bg-background flex flex-col gap-6 md:gap-8"
        >
          {isBaseline ? (
            <BaselineRound />
          ) : isNewRecord ? (
            <NewRecordRound />
          ) : (
            <NormalRound />
          )}
        </div>
      </ResultProvider>
    </Wrapper>
  );
};

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="py-4 md:py-6">
      <div className="flex flex-col gap-6 md:gap-8">{children}</div>
    </main>
  );
};
