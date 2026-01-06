import { TypingSessionDoc } from "@/lib/types";
import { ResultFooter } from "./footer";
import { ResultHeader } from "./header";
import { ResultSummary } from "./summary";

type Props = {
  session: TypingSessionDoc;
  text: string;
  nextTextId?: string | null;
};

export const NormalRound = ({ session, text, nextTextId }: Props) => {
  return (
    <>
      <ResultHeader
        title="Test Complete!"
        subTitle="Solid run. Keep pushing to beat your high score."
      />
      <ResultSummary session={session} />
      <ResultFooter
        caption="Beat The Score"
        session={session}
        text={text}
        nextTextId={nextTextId}
      />
    </>
  );
};
