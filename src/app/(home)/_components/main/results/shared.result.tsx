"use client";

import { ResultFooter } from "./footer";
import { ResultHeader } from "./header";
import { ResultSummary } from "./summary";

export const SharedRound = () => {
  return (
    <>
      <ResultHeader
        title="Shared Result"
        subTitle="Check out this typing performance!"
      />
      <ResultSummary />
      <ResultFooter caption="Try It Yourself" />
    </>
  );
};
