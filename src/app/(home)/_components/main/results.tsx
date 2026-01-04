import { NormalRound } from "./results/normal.result";
import { BaselineRound } from "./results/baseline.result";
import { NewRecordRound } from "./results/new-record.result";
import { InvalidRound } from "./results/invalid.result";

import { AnonUserDoc, TypingSessionDoc } from "@/lib/types";

type Props = {
  session: TypingSessionDoc | null;
  user: AnonUserDoc | null;
};

export const Results = ({ session, user }: Props) => {
  if (!session) return null;

  const isInvalid = session.isInvalid;

  if (isInvalid) {
    return (
      <main className="py-4 md:py-6">
        <InvalidRound session={session} />
      </main>
    );
  }

  // For valid sessions, we need the user object
  if (!user) return null;

  const isBaseline = user.totalSessions === 1;
  const isNewRecord = !isBaseline && session.wpm >= user.bestWpm;

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
