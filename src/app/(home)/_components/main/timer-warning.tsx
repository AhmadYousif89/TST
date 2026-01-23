import { useEffect, useRef } from "react";

import { useSound } from "../../engine/sound.context";
import { useEngineConfig, useEngineMetrics } from "../../engine/engine.context";

export const TimeWarning = () => {
  const { timeLeft } = useEngineMetrics();
  const { status, mode } = useEngineConfig();
  const { playSound, stopSound } = useSound();

  const lastPlayedTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      status === "typing" &&
      mode !== "passage" &&
      timeLeft <= 10 &&
      timeLeft > 0
    ) {
      if (lastPlayedTimeRef.current !== timeLeft) {
        playSound("warning");
        lastPlayedTimeRef.current = timeLeft;
      }
    } else {
      stopSound("warning");
      lastPlayedTimeRef.current = null;
    }
  }, [timeLeft, status, mode, playSound, stopSound]);

  return null;
};
