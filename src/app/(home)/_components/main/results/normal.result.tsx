"use client";

import { ResultFooter } from "./footer";
import { ResultHeader } from "./header";
import { ResultSummary } from "./summary";

export const NormalRound = () => {
  return (
    <>
      <ResultHeader
        title="Test Complete!"
        subTitle="Solid run. Keep pushing to beat your high score."
      />
      <ResultSummary />
      <ResultFooter caption="Beat The Score" />
    </>
  );
};
