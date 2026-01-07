"use client";

import { useMemo } from "react";
import { TypingSessionDoc } from "@/lib/types";
import { Keystroke } from "@/app/(home)/engine/types";
import { getModeLabel } from "@/app/(home)/engine/engine-logic";

type Props = {
  session: TypingSessionDoc;
};

export const SessionStatistics = ({ session }: Props) => {
  const stats = useMemo(() => {
    if (!session.keystrokes || session.keystrokes.length === 0) {
      return {
        raw: 0,
        consistency: 0,
        testType: { mode: session.mode, info: session.category },
      };
    }

    const durationMin = session.durationMs / 60000;

    // Raw WPM: (Total Keystrokes / 5) / Duration (min)
    const totalKeystrokes = session.keystrokes.length;
    const raw = Math.round(totalKeystrokes / 5 / durationMin);

    // Consistency: We break down the session into buckets (e.g. 1 second)
    const durationSec = Math.ceil(session.durationMs / 1000);
    const wpmValues: number[] = [];

    for (let s = 1; s <= durationSec; s++) {
      const startTime = (s - 1) * 1000;
      const endTime = s * 1000;

      const ksInSecond = session.keystrokes.filter(
        (k) => k.timestampMs >= startTime && k.timestampMs < endTime,
      );

      const correctInSecond = ksInSecond.filter(
        (k) => k.isCorrect && k.typedChar !== "Backspace",
      ).length;

      // WPM for this second = (correct / 5) / (1/60) = correct * 12
      const instantWpm = correctInSecond * 12;
      wpmValues.push(instantWpm);
    }

    // Calculate Mean
    const mean = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length;

    // Calculate Variance
    const variance =
      wpmValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
      wpmValues.length;

    // Calculate Standard Deviation
    const stdDev = Math.sqrt(variance);

    let consistency = 0;
    if (mean > 0) {
      const cv = stdDev / mean; // Coefficient of Variation
      // Using a sigmoid linear for simplicity: 100 - (CV * 100)
      consistency = Math.max(0, 100 - cv * 100);
    }

    return {
      raw,
      consistency: Math.round(consistency),
      testType: {
        mode: getModeLabel(session.mode),
        cat: session.category,
      },
      duration: Math.round(session.durationMs / 1000),
    };
  }, [session]);

  return (
    <div className="flex items-start justify-between gap-4 font-mono">
      {/* Test Type */}
      <div className="flex flex-col gap-1">
        <span className="text-6 md:text-5 text-muted-foreground">
          test type
        </span>
        <div className="text-6 flex flex-col text-blue-400">
          <span>{stats.testType.mode}</span>
          <span className="text-6 text-blue-400 capitalize">
            {stats.testType.cat}
          </span>
        </div>
      </div>

      {/* Raw */}
      <div className="flex flex-col gap-1">
        <span className="text-6 md:text-5 text-muted-foreground">raw</span>
        <span className="text-2 font-medium text-blue-400">{stats.raw}</span>
      </div>

      {/* Consistency */}
      <div className="flex flex-col gap-1">
        <span className="text-6 md:text-5 text-muted-foreground">
          consistency
        </span>
        <span className="text-2 font-medium text-blue-400">
          {stats.consistency}%
        </span>
      </div>

      {/* Time */}
      <div className="flex flex-col gap-1">
        <span className="text-6 md:text-5 text-muted-foreground">time</span>
        <span className="text-2 font-medium text-blue-400">
          {stats.duration}s
        </span>
      </div>
    </div>
  );
};
