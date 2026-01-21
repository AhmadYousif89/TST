import { ResultFooter } from "./footer";
import { ResultHeader } from "./header";
import { ResultSummary } from "./summary";

export const BaselineRound = () => {
  return (
    <>
      <ResultHeader
        title="Baseline Established!"
        subTitle="You’ve set the bar. Now the real challenge begins—time to beat it."
      />
      <ResultSummary />
      <ResultFooter caption="Beat This Score" />
    </>
  );
};
