import { TypingSessionDoc } from "@/lib/types";
import { ResultFooter } from "./footer";
import { ResultHeader } from "./header";
import { ResultSummary } from "./summary";

export const InvalidRound = ({ session }: { session: TypingSessionDoc }) => {
  return (
    <>
      <ResultHeader
        isInvalid
        title="Invalid Session"
        subTitle="This round was too short or had bad performance. It won't be counted in your stats."
      />
      <ResultSummary session={session} />
      <ResultFooter caption="Try Again" session={session} />
    </>
  );
};
