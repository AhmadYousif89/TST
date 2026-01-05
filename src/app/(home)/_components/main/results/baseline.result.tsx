import { TypingSessionDoc } from "@/lib/types";
import { ResultFooter } from "./footer";
import { ResultHeader } from "./header";
import { ResultSummary } from "./summary";

export const BaselineRound = ({ session }: { session: TypingSessionDoc }) => {
  return (
    <>
      <ResultHeader
        title="Baseline Established!"
        subTitle="You’ve set the bar. Now the real challenge begins—time to beat it."
      />
      <ResultSummary session={session} />
      <ResultFooter session={session} />
    </>
  );
};
