"use client";

import { useEffect, useRef, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  useEngineActions,
  useEngineKeystroke,
  useEngineState,
} from "./engine.context";
import {
  calculateNextCursor,
  getCharStates,
  getWordStart,
  isWordPerfect,
} from "./engine-logic";
import { Words } from "./words";

export const EngineContainer = () => {
  const {
    setCursor,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    getTimeElapsed,
  } = useEngineActions();
  const { cursor, progress, keystrokes } = useEngineKeystroke();
  const { status, textData } = useEngineState();

  const lockedCursorRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [maxHeight, setMaxHeight] = useState<number | string>("none");

  const characters = useMemo(
    () => textData?.text.split("") || [],
    [textData?.text],
  );

  // Scroll to cursor when it changes
  useEffect(() => {
    if (isFocused && status === "typing") {
      const cursorElement =
        containerRef.current?.querySelector<HTMLElement>(".active-cursor");
      if (cursorElement && containerRef.current) {
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const cursorRect = cursorElement.getBoundingClientRect();
        // Calculate the top position relative to the container and center it
        const relativeTop =
          cursorRect.top - containerRect.top + container.scrollTop;
        const targetTop = relativeTop - containerRect.height / 2;
        // Dynamic horizontal scroll
        let targetLeft = container.scrollLeft;
        // If cursor is hitting the right boundary, reveal more text
        if (cursorRect.right > containerRect.right - 40) {
          targetLeft =
            container.scrollLeft +
            (cursorRect.right - containerRect.right + 40);
        }
        // If cursor moves back towards the left (new line), reset scroll
        if (cursorRect.left < containerRect.left + 40) {
          targetLeft = 0;
        }

        container.scrollTo({
          top: targetTop,
          left: targetLeft,
          behavior: "smooth",
        });
      }
    }
  }, [cursor, isFocused, status]);

  // Reset scroll when session is reset
  useEffect(() => {
    if (status === "idle") {
      containerRef.current?.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  }, [status]);

  // Calculate dynamic max-height
  useEffect(() => {
    const calculateHeight = () => {
      if (!containerRef.current) return;

      // Use visualViewport for mobile stability if available
      const viewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const rect = containerRef.current.getBoundingClientRect();
      const topOffset = rect.top;
      // Calculate height of all elements (around the engine container) marked as offsets
      const offsets = document.querySelectorAll("[data-engine-offset]");
      let totalOffsetHeight = 0;
      offsets.forEach((el) => {
        totalOffsetHeight += el.getBoundingClientRect().height;
      });
      // Approximate accumulation of total gaps/spaces around the engine container
      const safetyBuffer = 120;
      const containerMinHeight = 150;
      const availableHeight =
        viewportHeight - topOffset - totalOffsetHeight - safetyBuffer;

      setMaxHeight(Math.max(availableHeight, containerMinHeight));
    };
    // Calculate height on initial render
    calculateHeight();

    const currentContainer = containerRef.current;
    const observer = new ResizeObserver(calculateHeight);
    if (currentContainer?.parentElement) {
      observer.observe(currentContainer.parentElement);
    }
    window.addEventListener("resize", calculateHeight);

    return () => {
      window.removeEventListener("resize", calculateHeight);
      observer.disconnect();
    };
  }, [status]);

  // Reset locked cursor when session is reset or cursor is back at start
  useEffect(() => {
    if (status === "idle" || cursor === 0) {
      lockedCursorRef.current = 0;
    }
  }, [status, cursor]);

  const handleKeydown = (e: React.KeyboardEvent) => {
    if (status === "finished") return;
    const typedChar = e.key;

    // Ignore non-character keys except backspace
    if (typedChar.length !== 1 && typedChar !== "Backspace") return;
    // Ignore backspace at the start
    if (typedChar === "Backspace" && cursor === 0) return;
    // Ignore backspace at the locked cursor
    if (typedChar === "Backspace" && cursor <= lockedCursorRef.current) return;

    // Ignore standalone meta keys and shift key (allow only if typing or Backspace)
    const isControlModifier = e.ctrlKey || e.metaKey || e.altKey;
    const isBackspace = typedChar === "Backspace";
    const isShiftKey = typedChar === "Shift";
    // If it's a modifier alone or Shift key, ignore
    if ((isControlModifier && !isBackspace) || isShiftKey) return;
    // Ignore non-character keys except backspace
    if (typedChar.length !== 1 && !isBackspace) return;
    // Ignore F1~F12 keys
    if (/^F([1-9]|1[0-2])$/.test(typedChar)) return;

    if (status === "idle") startSession();
    if (status === "paused") resumeSession();

    e.preventDefault();
    e.stopPropagation();

    const expectedChar = characters[cursor];
    const timestampMs = getTimeElapsed();

    // Handle backspace
    if (cursor > 0 && typedChar === "Backspace") {
      // Calculate intended target
      let nextCursor = calculateNextCursor(
        cursor,
        "Backspace",
        characters,
        isControlModifier,
        lockedCursorRef.current,
      );

      // If we are already at the lock, do nothing
      if (cursor <= lockedCursorRef.current) return;

      // Record a backspace for every character skipped (important for Ctrl+Backspace)
      for (let i = cursor - 1; i >= nextCursor; i--) {
        keystrokes.current?.push({
          charIndex: i,
          expectedChar: characters[i],
          typedChar: "Backspace",
          isCorrect: false,
          timestampMs,
          positionGroup: Math.floor(i / 10),
        });
      }

      setCursor(nextCursor);
      return;
    }

    // Handle normal typing
    const isCorrect = typedChar === expectedChar;

    // Logic to prevent correction over correct words
    if (typedChar === " " && isCorrect) {
      const currentStates = getCharStates(characters, keystrokes.current);
      const wordStart = getWordStart(cursor, characters);
      const wordIsPerfect = isWordPerfect(wordStart, cursor, currentStates);

      if (wordIsPerfect) {
        lockedCursorRef.current = cursor + 1;
      }
    }

    keystrokes.current?.push({
      charIndex: cursor,
      expectedChar,
      typedChar,
      isCorrect,
      timestampMs,
      positionGroup: Math.floor(cursor / 10),
    });

    // Set cursor to the next character
    setCursor((ps: number) => {
      const nextCursor = calculateNextCursor(ps, typedChar, characters);
      if (nextCursor >= characters.length) {
        endSession();
      }
      return nextCursor;
    });
  };

  if (!textData) return null;

  const handleBlur = () => {
    setIsFocused(false);
    setShowOverlay(true);
    pauseSession();
  };

  return (
    <div className="relative isolate flex grow flex-col">
      {/* Progress Bar */}
      <div className="bg-border h-px w-full overflow-hidden rounded-full">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Engine Container */}
      <div
        tabIndex={0}
        ref={containerRef}
        onBlur={handleBlur}
        onKeyDown={handleKeydown}
        onFocus={() => setIsFocused(true)}
        style={{
          maxHeight:
            typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
        }}
        className={cn(
          "scrollbar-none my-auto overflow-auto overscroll-none scroll-smooth outline-none",
          "transition-[opacity,filter] duration-300 ease-out",
          // (status === "idle" || status === "paused") &&
          //   showOverlay &&
          //   "opacity-50 blur-xs select-none",
        )}
      >
        <Words characters={characters} isFocused={isFocused} />
      </div>

      {/* Start backdrop overlay */}
      {status === "idle" && showOverlay && (
        <div
          onClick={() => {
            setShowOverlay(false);
            containerRef.current?.focus();
          }}
          className="bg-background/5 absolute inset-0 z-20 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-5">
            <Button
              // Click will probagate to the parent and invoke setShowOverlay(false)
              onClick={() => containerRef.current?.focus()}
              className="text-3-semibold hover:text-foreground min-h-14 min-w-52 border-0 bg-blue-600 px-6 py-3 hover:bg-blue-400"
            >
              Start Typing Test
            </Button>
            <p className="text-foreground text-3-semibold pointer-events-none">
              Or click the text and start typing
            </p>
          </div>
        </div>
      )}

      {/* Pause backdrop overlay */}
      {status === "paused" && showOverlay && (
        <div
          onClick={() => {
            resumeSession();
            setShowOverlay(false);
            containerRef.current?.focus();
          }}
          className="bg-background/5 absolute inset-0 z-20 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-3">
            <p className="text-yellow text-5 animate-pulse">Test Paused</p>
            <p className="text-muted-foreground text-4 flex items-center gap-1 font-medium tracking-wide">
              <svg
                width="20px"
                height="20px"
                fill="currentColor"
                viewBox="0 -960 960 960"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M537-96 399-391 240-192v-672l528 432H486l138 295-87 41Z" />
              </svg>
              <span>Click to resume</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
