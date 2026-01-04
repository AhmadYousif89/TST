import { TypingSessionDoc } from "@/lib/types";
import { ResultFooter } from "./footer";
import { ResultHeader } from "./header";
import { ResultSummary } from "./summary";
import { ResultTitle } from "./title";

export const NormalRound = ({ session }: { session: TypingSessionDoc }) => {
  return (
    <section className="flex flex-col gap-6 md:gap-8">
      <ResultHeader />
      <ResultTitle
        title="Test Complete!"
        subTitle="Solid run. Keep pushing to beat your high score."
      />
      <ResultSummary session={session} />
      <ResultFooter caption="Go Again" />
    </section>
  );
};
