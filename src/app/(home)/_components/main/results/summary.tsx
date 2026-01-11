"use client";

import { useResult } from "./result.context";

export const ResultSummary = () => {
  const { session } = useResult();
  const { wpm, accuracy, errorCount, charCount } = session;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col justify-between gap-4 py-4 *:flex-1 md:flex-row md:gap-5 md:py-5 md:pb-8">
      <div className="flex flex-col gap-3 rounded-md border px-6 py-4">
        <h2 className="text-muted-foreground text-3">WPM:</h2>
        <span className="text-foreground text-2">{Math.round(wpm)}</span>
      </div>
      <div className="flex flex-col gap-3 rounded-md border px-6 py-4">
        <h2 className="text-muted-foreground text-3">Accuracy:</h2>
        <span
          className={`${accuracy < 100 ? "text-red" : "text-green"} text-2`}
        >
          {Math.round(accuracy)}%
        </span>
      </div>
      <div className="flex flex-col gap-3 rounded-md border px-6 py-4">
        <h2 className="text-muted-foreground text-3">Characters:</h2>
        <div className="text-muted-foreground text-2">
          <span className="text-foreground">{charCount}</span>
          <span> / </span>
          <span className={errorCount > 0 ? "text-red" : "text-green"}>
            {errorCount}
          </span>
        </div>
      </div>
    </section>
  );
};
