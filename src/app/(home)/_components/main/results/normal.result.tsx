import { TypingSessionDoc } from "@/lib/types";
import { ResultFooter } from "./footer";
import { ResultHeader } from "./header";
import { ResultSummary } from "./summary";

type Props = {
  session: TypingSessionDoc;
  text: string;
};

export const NormalRound = ({ session, text }: Props) => {
  return (
    <>
      <ResultHeader
        title="Test Complete!"
        subTitle="Solid run. Keep pushing to beat your high score."
      />
      <ResultSummary session={session} />
      <ResultFooter caption="Go Again" session={session} text={text} />
    </>
  );
};
