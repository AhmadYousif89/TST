import { TypingSessionDoc } from "@/lib/types";
import { ResultFooter } from "./footer";
import { ResultHeader } from "./header";
import { ResultSummary } from "./summary";
import { ResultTitle } from "./title";

type Props = { session: TypingSessionDoc };

export const SharedRound = ({ session }: Props) => {
  return (
    <section className="flex flex-col gap-6 md:gap-8">
      <ResultHeader />
      <ResultTitle
        title="Shared Result"
        subTitle="Check out this typing performance!"
      />
      <ResultSummary session={session} />
      <ResultFooter
        caption="Try It Yourself"
        session={session}
        isOwner={false}
      />
    </section>
  );
};
