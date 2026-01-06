import { NormalRound } from "./results/normal.result";
import { BaselineRound } from "./results/baseline.result";
import { NewRecordRound } from "./results/new-record.result";
import { InvalidRound } from "./results/invalid.result";
import { SharedRound } from "./results/shared.result";

import { AnonUserDoc, TypingSessionDoc } from "@/lib/types";
import { getInitialText } from "@/app/dal/data";

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

  if (session.isInvalid) {
    return (
      <Wrapper>
        <InvalidRound session={session} />
      </Wrapper>
    );
  }

  const isOwner = currentAnonUserId === session.anonUserId;

  const textData = await getInitialText({ id: session.textId.toString() });

  if (!isOwner) {
    return (
      <Wrapper>
        <SharedRound session={session} text={textData?.text || ""} />
      </Wrapper>
    );
  }
  // For valid sessions where user is owner, we try to show personalized stats
  const isBaseline = user?.totalSessions === 1;
  const isNewRecord = user && !isBaseline && session.wpm >= user.bestWpm;

  return (
    <Wrapper>
      {isBaseline ? (
        <BaselineRound
          session={session}
          text={textData?.text || ""}
          nextTextId={nextTextId}
        />
      ) : isNewRecord ? (
        <NewRecordRound
          session={session}
          text={textData?.text || ""}
          nextTextId={nextTextId}
        />
      ) : (
        <NormalRound
          session={session}
          text={textData?.text || ""}
          nextTextId={nextTextId}
        />
      )}
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
