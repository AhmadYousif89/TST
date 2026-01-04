import { TypingSessionDoc } from "@/lib/types";
import { ResultFooter } from "./footer";
import { ResultHeader } from "./header";
import { ResultSummary } from "./summary";
import { ResultTitle } from "./title";

export const BaselineRound = ({ session }: { session: TypingSessionDoc }) => {
  return (
    <section className="flex flex-col gap-6 md:gap-8">
      <ResultHeader />
      <ResultTitle
        title="Baseline Established!"
        subTitle="You’ve set the bar. Now the real challenge begins—time to beat it."
      />
      <ResultSummary session={session} />
      <ResultFooter />
    </section>
  );
};
