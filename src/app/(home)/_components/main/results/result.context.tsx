"use client";

import { createPortal } from "react-dom";
import { createContext, useContext, ReactNode, useState } from "react";

import { TypingSessionDoc, AnonUserDoc } from "@/lib/types";
import { TopLoader } from "@/components/top-loader";

type ResultContextType = {
  text: string;
  isOwner: boolean;
  session: TypingSessionDoc;
  user: AnonUserDoc | null;
  nextTextId?: string | null;
  language: "en" | "ar";
  loadingProgress: number;
  isScreenshotting: boolean;

  setLoadingProgress: (value: number) => void;
  setIsScreenshotting: (value: boolean) => void;
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
  language,
}: ResultProviderProps) => {
  const [isScreenshotting, setIsScreenshotting] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  return (
    <ResultContext.Provider
      value={{
        text,
        user,
        session,
        isOwner,
        language,
        nextTextId,
        loadingProgress,
        isScreenshotting,
        setLoadingProgress,
        setIsScreenshotting,
      }}
    >
      {children}
      {isScreenshotting && (
        <TopLoader progress={loadingProgress} className="duration-1000" />
      )}
      {isScreenshotting &&
        createPortal(
          <div className="animate-flash bg-foreground pointer-events-none fixed inset-0 z-1001 delay-50" />,
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
