"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { KeystrokeDoc } from "@/lib/types";

type Props = {
  keystrokes: KeystrokeDoc[];
  onComplete?: () => void; // optionaly trigger an action when replay finish
  playSound: () => void;
};

export const useReplay = ({ keystrokes, onComplete, playSound }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when keystrokes change
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [keystrokes]);

  const play = useCallback(() => {
    if (currentIndex >= keystrokes.length) setCurrentIndex(0);
    setIsPlaying(true);
  }, [currentIndex, keystrokes.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (!isPlaying || currentIndex >= keystrokes.length) {
      if (isPlaying && currentIndex >= keystrokes.length) {
        setIsPlaying(false);
        onComplete?.();
      }
      return;
    }

    const currentKs = keystrokes[currentIndex];
    const prevKs = currentIndex > 0 ? keystrokes[currentIndex - 1] : null;

    if (!currentKs) return;

    // We want the delay to be the time between this keystroke and the previous one
    const delay = prevKs
      ? currentKs.timestampMs - prevKs.timestampMs
      : currentKs.timestampMs;

    timeoutRef.current = setTimeout(() => {
      playSound?.();
      setCurrentIndex((prev) => prev + 1);
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPlaying, currentIndex, keystrokes, onComplete, playSound]);

  return { isPlaying, play, pause, reset, currentIndex };
};
