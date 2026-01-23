"use client";

import { useMemo } from "react";

import {
  getModeLabel,
  calculateRawWpm,
  calculateConsistency,
} from "@/app/(home)/engine/engine-logic";
import { useResult } from "./result.context";

export const SessionStatistics = () => {
  const { session } = useResult();

  const stats = useMemo(() => {
    // If we have keystrokes, calculate on the fly for maximum accuracy
    // Otherwise, use the pre-calculated stats from the session doc
    const raw =
      session.keystrokes && session.keystrokes.length > 0
        ? calculateRawWpm(session.keystrokes.length, session.durationMs)
        : session.rawWpm || 0;

    const consistency =
      session.keystrokes && session.keystrokes.length > 0
        ? calculateConsistency(session.keystrokes, session.durationMs)
        : session.consistency || 0;

    return {
      raw,
      consistency,
      testType: {
        mode: getModeLabel(session.mode),
        cat: session.category,
      },
      duration: Math.round(session.durationMs / 1000),
    };
  }, [session]);

  return (
    <div className="flex items-start justify-between gap-4 py-2 font-mono">
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
