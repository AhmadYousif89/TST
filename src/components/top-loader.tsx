"use client";

import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { useIncrementalProgress } from "@/hooks/use-incremental-progress";

type Props = {
  isPending?: boolean;
  progress?: number;
  className?: string;
};

export const TopLoader = ({
  isPending = false,
  progress: progressProp,
  className,
}: Props) => {
  const simulatedProgress = useIncrementalProgress(isPending);
  const progress =
    progressProp !== undefined ? progressProp : simulatedProgress;

  if (progress === 0 || typeof window === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 isolate z-1000 grid size-full place-items-start">
      <div
        className={cn(
          "dark:bg-green h-0.5 bg-blue-400 transition-all duration-500 ease-out",
          className,
        )}
        style={{ width: `${progress}%` }}
      />
    </div>,
    document.body,
  );
};
