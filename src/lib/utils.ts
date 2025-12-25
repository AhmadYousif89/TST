import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type LocalStats = {
  bestWpm: number;
  bestAccuracy: number;
  totalSessions: number;
  lastUpdated: number;
};

const STORAGE_KEY = "typing_stats";

export const getLocalStats = (): LocalStats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        bestWpm: 0,
        bestAccuracy: 0,
        totalSessions: 0,
        lastUpdated: Date.now(),
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      bestWpm: 0,
      bestAccuracy: 0,
      totalSessions: 0,
      lastUpdated: Date.now(),
    };
  }
};

export const updateLocalStats = ({
  wpm,
  accuracy,
}: {
  wpm: number;
  accuracy: number;
}) => {
  const current = getLocalStats();

  const updated: LocalStats = {
    bestWpm: Math.max(current.bestWpm, wpm),
    bestAccuracy: Math.max(current.bestAccuracy, accuracy),
    totalSessions: current.totalSessions + 1,
    lastUpdated: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return updated;
};
