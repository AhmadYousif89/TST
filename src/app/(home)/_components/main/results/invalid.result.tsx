import { TypingSessionDoc } from "@/lib/types";
import { ResultFooter } from "./footer";
import { ResultHeader } from "./header";
import { ResultSummary } from "./summary";
import { ResultTitle } from "./title";

export const InvalidRound = ({ session }: { session: TypingSessionDoc }) => {
  return (
    <section className="flex flex-col gap-6 md:gap-8">
      <ResultHeader isInvalid />
      <ResultTitle
        title="Invalid Session"
        subTitle="This round was too short or had bad performance. It won't be counted in your stats."
      />
      <ResultSummary session={session} />
      <ResultFooter caption="Try Again" />
    </section>
  );
};
