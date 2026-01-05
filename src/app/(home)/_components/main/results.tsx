import { NormalRound } from "./results/normal.result";
import { BaselineRound } from "./results/baseline.result";
import { NewRecordRound } from "./results/new-record.result";
import { InvalidRound } from "./results/invalid.result";
import { SharedRound } from "./results/shared.result";

import { AnonUserDoc, TypingSessionDoc } from "@/lib/types";
import { getInitialText } from "@/app/dal/data";

type Props = {
  session: TypingSessionDoc | null;
  user: AnonUserDoc | null;
  currentAnonUserId?: string;
};

export const Results = async ({ session, user, currentAnonUserId }: Props) => {
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

  const textData = await getInitialText({ id: session.textId.toString() });

  if (!isOwner) {
    return (
      <main className="py-4 md:py-6">
        <div className="flex flex-col gap-6 md:gap-8">
          <SharedRound session={session} text={textData?.text || ""} />
        </div>
      </main>
    );
  }
  // For valid sessions where user is owner, we try to show personalized stats
  const isBaseline = user?.totalSessions === 1;
  const isNewRecord = user && !isBaseline && session.wpm >= user.bestWpm;

  return (
    <main className="py-4 md:py-6">
      <div className="flex flex-col gap-6 md:gap-8">
        {isBaseline ? (
          <BaselineRound session={session} text={textData?.text || ""} />
        ) : isNewRecord ? (
          <NewRecordRound session={session} text={textData?.text || ""} />
        ) : (
          <NormalRound session={session} text={textData?.text || ""} />
        )}
      </div>
    </main>
  );
};
