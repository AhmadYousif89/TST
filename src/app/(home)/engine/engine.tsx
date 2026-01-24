"use client";

import { useEffect, useRef, useMemo, useState } from "react";

import { Words } from "./words";
import { EngineOverlay } from "./overlay";
import { LiveMetrics } from "./live-metrics";
import { TypingInput } from "./typing-input";
import { TypingCursor } from "./typing-cursor";

import { TimeWarning } from "../_components/main/timer-warning";
import { LanguageSwitcher } from "../_components/main/language-switcher";
import { useEngineActions, useEngineConfig } from "./engine.context";

export const EngineContainer = () => {
  const { pauseSession, resumeSession, setShowOverlay } = useEngineActions();
  const { status, textData, showOverlay } = useEngineConfig();

  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const characters = useMemo(
    () => textData?.text.split("") || [],
    [textData?.text],
  );

  useEffect(() => {
    if (status === "idle" && !showOverlay) hiddenInputRef.current?.focus();
  }, [status, showOverlay]);

  const pauseTimerRef = useRef<NodeJS.Timeout>(undefined);
  const blurTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  /* ------------- Handlers ------------- */

  const handleMouseDown = (e: React.MouseEvent) => {
    if (status === "finished") return;
    e.preventDefault();
    hiddenInputRef.current?.focus();
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    setIsFocused(false);
    if (status === "typing") {
      pauseTimerRef.current = setTimeout(() => pauseSession(), 1000);
    } else {
      blurTimeoutRef.current = setTimeout(() => setShowOverlay(true), 300);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowOverlay(false);
    hiddenInputRef.current?.focus();
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = undefined;
    }
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = undefined;
    }
  };

  const handleResumeSession = () => {
    resumeSession();
    hiddenInputRef.current?.focus();
  };

  if (!textData) return null;

  return (
    <div className="flex grow flex-col justify-center">
      <TimeWarning />
      {/* <LanguageSwitcher /> */}
      <div
        onBlur={handleBlur}
        onFocus={handleFocus}
        onMouseDown={handleMouseDown}
        className="relative h-43.25 md:h-54.5"
      >
        <TypingInput
          hiddenInputRef={hiddenInputRef}
          containerRef={containerRef}
          characters={characters}
        />
        {/* <LiveMetrics /> */}
        <div
          ref={containerRef}
          className="scrollbar-none relative size-full overflow-hidden overscroll-none scroll-smooth"
        >
          <Words characters={characters} />
          <TypingCursor containerRef={containerRef} isFocused={isFocused} />
        </div>
        <EngineOverlay
          hiddenInputRef={hiddenInputRef}
          handleResumeSession={handleResumeSession}
        />
      </div>
    </div>
  );
};
