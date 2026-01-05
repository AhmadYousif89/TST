import { TypingSessionDoc } from "@/lib/types";
import { ResultFooter } from "./footer";
import { ResultHeader } from "./header";
import { ResultSummary } from "./summary";

type Props = { session: TypingSessionDoc; text: string };

export const SharedRound = ({ session, text }: Props) => {
  return (
    <>
      <ResultHeader
        title="Shared Result"
        subTitle="Check out this typing performance!"
      />
      <ResultSummary session={session} />
      <ResultFooter
        caption="Try It Yourself"
        session={session}
        isOwner={false}
        text={text}
      />
    </>
  );
};
