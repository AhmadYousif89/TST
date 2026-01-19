"use client";

import { useState, useEffect } from "react";

/**
 * A hook that manages a simulated progress value (0-100) based on a pending state.
 * Useful for transitions where the actual progress is unknown.
 */
export function useIncrementalProgress(isPending: boolean) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPending) {
      setProgress(1);
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress >= 90) return oldProgress;
          // Random increment between 1% and 10%
          const diff = Math.random() * 10;
          return Math.min(oldProgress + diff, 90);
        });
      }, 100);

      return () => {
        clearInterval(timer);
      };
    } else {
      // If we were pending and now we are not, it means the transition finished
      if (progress > 0) {
        setProgress(100);
        const timer = setTimeout(() => setProgress(0), 500); // Reset after some time to allow animation to finish
        return () => clearTimeout(timer);
      }
    }
  }, [isPending, progress]);

  return progress;
}
