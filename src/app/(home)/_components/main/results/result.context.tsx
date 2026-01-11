"use client";

import { createPortal } from "react-dom";
import { createContext, useContext, ReactNode, useState } from "react";

import { TypingSessionDoc, AnonUserDoc } from "@/lib/types";

type ResultContextType = {
  text: string;
  isOwner: boolean;
  session: TypingSessionDoc;
  user: AnonUserDoc | null;
  nextTextId?: string | null;
  isScreenshotting: boolean;
  loadingProgress: number;

  setIsScreenshotting: (value: boolean) => void;
  setLoadingProgress: (value: number) => void;
};

const ResultContext = createContext<ResultContextType | undefined>(undefined);

type ResultProviderProps = Omit<
  ResultContextType,
  | "isScreenshotting"
  | "setIsScreenshotting"
  | "loadingProgress"
  | "setLoadingProgress"
> & {
  children: ReactNode;
};

export const ResultProvider = ({
  children,
  session,
  text,
  user,
  nextTextId,
  isOwner,
}: ResultProviderProps) => {
  const [isScreenshotting, setIsScreenshotting] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  return (
    <ResultContext.Provider
      value={{
        session,
        text,
        user,
        nextTextId,
        isOwner,
        isScreenshotting,
        setIsScreenshotting,
        loadingProgress,
        setLoadingProgress,
      }}
    >
      {children}
      {isScreenshotting &&
        createPortal(
          <>
            <div className="pointer-events-none fixed inset-0 isolate z-1000 grid size-full place-items-start">
              <div
                className="bg-green h-1 w-full transition-all duration-1000 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            {loadingProgress === 1 && (
              <div className="animate-flash bg-foreground pointer-events-none fixed inset-0 z-1001" />
            )}
          </>,
          document.body,
        )}
    </ResultContext.Provider>
  );
};

export const useResult = () => {
  const context = useContext(ResultContext);
  if (context === undefined) {
    throw new Error("useResult must be used within a ResultProvider");
  }
  return context;
};

export const useOptionalResult = () => {
  return useContext(ResultContext);
};
