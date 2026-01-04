"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

import { TypingSessionDoc } from "@/lib/types";
import { ResultHeader } from "./header";
import { ResultTitle } from "./title";
import { ResultSummary } from "./summary";
import { ResultFooter } from "./footer";

export const NewRecordRound = ({ session }: { session: TypingSessionDoc }) => {
  useEffect(() => {
    confetti({
      particleCount: 200,
      spread: 100,
      angle: -220,
      origin: { y: 0.225, x: 0.525 },
      gravity: 1,
      shapes: ["circle", "square"],
      colors: ["#177dff", "#4dd67b", "#f4dc73", "#d64d5b", "#ffffff"],
      drift: 1,
    });
  }, []);

  return (
    <section className="flex flex-col gap-6 md:gap-8">
      <ResultHeader isNewRecord />
      <ResultTitle
        title="High Score Smashed!"
        subTitle="You’re getting faster. That was incredible typing."
      />
      <ResultSummary session={session} />
      <ResultFooter isNewRecord />
    </section>
  );
};
