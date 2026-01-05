import { TypingSessionDoc } from "@/lib/types";
import { ResultFooter } from "./footer";
import { ResultHeader } from "./header";
import { ResultSummary } from "./summary";

type Props = {
  session: TypingSessionDoc;
  text: string;
};

export const BaselineRound = ({ session, text }: Props) => {
  return (
    <>
      <ResultHeader
        title="Baseline Established!"
        subTitle="You’ve set the bar. Now the real challenge begins—time to beat it."
      />
      <ResultSummary session={session} />
      <ResultFooter session={session} text={text} />
    </>
  );
};
