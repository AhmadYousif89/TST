import { useEffect, useRef } from "react";

import { useTypingSound } from "@/hooks/use-typing-sound";
import { useEngineConfig, useEngineMetrics } from "../../engine/engine.context";

export const TimeWarning = () => {
  const { timeLeft } = useEngineMetrics();
  const { status, mode } = useEngineConfig();
  const { playWarningSound, stopWarningSound } = useTypingSound();
  const lastPlayedTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      status === "typing" &&
      mode !== "passage" &&
      timeLeft <= 10 &&
      timeLeft > 0
    ) {
      if (lastPlayedTimeRef.current !== timeLeft) {
        playWarningSound();
        lastPlayedTimeRef.current = timeLeft;
      }
    } else {
      stopWarningSound();
      lastPlayedTimeRef.current = null;
    }
  }, [timeLeft, status, mode, playWarningSound, stopWarningSound]);

  return null;
};
