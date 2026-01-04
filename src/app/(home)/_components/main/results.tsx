import { NormalRound } from "./results/normal.result";
import { BaselineRound } from "./results/baseline.result";
import { NewRecordRound } from "./results/new-record.result";
import { InvalidRound } from "./results/invalid.result";
import { SharedRound } from "./results/shared.result";

import { AnonUserDoc, TypingSessionDoc } from "@/lib/types";

type Props = {
  session: TypingSessionDoc | null;
  user: AnonUserDoc | null;
  currentAnonUserId?: string;
};

export const Results = ({ session, user, currentAnonUserId }: Props) => {
  if (!session) return null;

  const isInvalid = session.isInvalid;

  if (isInvalid) {
    return (
      <main className="py-4 md:py-6">
        <InvalidRound session={session} />
      </main>
    );
  }

  const isOwner = currentAnonUserId === session.anonUserId;

  if (!isOwner) {
    return (
      <main className="py-4 md:py-6">
        <SharedRound session={session} />
      </main>
    );
  }

  // For valid sessions where user is owner, we try to show personalized stats
  const isBaseline = user?.totalSessions === 1;
  const isNewRecord = user && !isBaseline && session.wpm >= user.bestWpm;

  return (
    <main className="py-4 md:py-6">
      {isBaseline ? (
        <BaselineRound session={session} />
      ) : isNewRecord ? (
        <NewRecordRound session={session} />
      ) : (
        <NormalRound session={session} />
      )}
    </main>
  );
};
