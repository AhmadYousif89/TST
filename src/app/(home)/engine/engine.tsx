"use client";

import { useEffect, useRef, useMemo, memo, useState } from "react";

import { cn } from "@/lib/utils";
import { CharState } from "./types";
import { getCharStates, calculateNextCursor } from "./engine-logic";
import {
  useEngineActions,
  useEngineKeystroke,
  useEngineState,
} from "./engine.context";
import { Button } from "@/components/ui/button";

type CharacterProps = {
  char: string;
  isCursor: boolean;
  className?: string;
} & CharState;

const Character = memo(
  ({ char, state, typedChar, isCursor, className }: CharacterProps) => {
    return (
      <span
        className={cn(
          className,
          "text-muted-foreground relative isolate ml-2 whitespace-pre transition-colors duration-100 ease-out",
          "before:absolute before:inset-0 before:-z-10 before:-mx-0.5 before:rounded before:bg-transparent before:transition-colors",
          isCursor &&
            `text-foreground after:bg-input after:absolute after:inset-0 after:-z-10 after:-mx-0.5 after:animate-pulse after:rounded`,
          state === "correct" && "text-green before:bg-green/15",
          state === "incorrect" && "text-red before:bg-red/15",
        )}
      >
        {char}
        {state === "incorrect" && (
          <span className="animate-mistyped text-yellow pointer-events-none absolute select-none">
            {typedChar === " " ? "_" : typedChar}
          </span>
        )}
      </span>
    );
  },
);

Character.displayName = "Character";

export const EngineContainer = () => {
  const { status, textData, keystrokes } = useEngineState();
  const { cursor, progress } = useEngineKeystroke();
  const {
    setCursor,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    getTimeElapsed,
  } = useEngineActions();

  const [isFocused, setIsFocused] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [maxHeight, setMaxHeight] = useState<number | string>("none");

  const containerRef = useRef<HTMLDivElement>(null);

  const characters = useMemo(
    () => textData?.text.split("") || [],
    [textData?.text],
  );

  // Group characters into words (prevents mid-word line breaks)
  const words = useMemo(() => {
    const result: { char: string; index: number }[][] = [];
    let currentWord: { char: string; index: number }[] = [];

    characters.forEach((char: string, index: number) => {
      currentWord.push({ char, index });
      if (char === " " || index === characters.length - 1) {
        result.push(currentWord);
        currentWord = [];
      }
    });

    return result;
  }, [characters]);

  const charStates = useMemo(
    () => getCharStates(characters, keystrokes.current),
    [cursor, characters, keystrokes],
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

  const handleKeydown = (e: React.KeyboardEvent) => {
    // Prevent browser shortcuts (like ' or / for Firefox search)
    e.preventDefault();
    // Ignore system shortcuts and shift key
    if (e.ctrlKey || e.metaKey || e.altKey || e.key === "Shift") return;

    if (status === "finished") return;
    if (status === "idle") startSession();
    if (status === "paused") resumeSession();

    const typedChar = e.key;
    const expectedChar = characters[cursor];
    const timestampMs = getTimeElapsed();

    // Ignore non-character keys except backspace
    if (typedChar.length !== 1 && typedChar !== "Backspace") return;
    // Ignore backspace at the start
    if (typedChar === "Backspace" && cursor === 0) return;
    // Handle backspace
    if (cursor > 0 && typedChar === "Backspace") {
      keystrokes.current?.push({
        charIndex: cursor - 1,
        expectedChar: characters[cursor - 1],
        typedChar: "Backspace",
        isCorrect: false,
        timestampMs,
      });
      // Set cursor to the previous character
      setCursor((ps: number) =>
        calculateNextCursor(ps, "Backspace", characters.length),
      );
      return;
    }
    // Handle normal typing
    const isCorrect = typedChar === expectedChar;
    keystrokes.current?.push({
      charIndex: cursor,
      expectedChar,
      typedChar,
      isCorrect,
      timestampMs,
    });
    // Set cursor to the next character
    setCursor((ps: number) => {
      const nextCursor = calculateNextCursor(ps, typedChar, characters.length);
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

      <div
        tabIndex={0}
        ref={containerRef}
        onBlur={handleBlur}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeydown}
        style={{
          maxHeight:
            typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
        }}
        className={cn(
          "scrollbar-none overflow-auto overscroll-none scroll-smooth outline-none",
          "text-1-regular-mobile md:text-1-regular flex flex-wrap gap-y-1 pt-8",
          "transition-[opacity,filter] duration-300 ease-out",
          (status === "idle" || status === "paused") &&
            showOverlay &&
            "opacity-50 blur-xs select-none",
        )}
      >
        {words.map((word, wordIndex) => (
          <div key={wordIndex}>
            {word.map(({ char, index }) => (
              <Character
                key={index}
                char={char}
                state={charStates[index].state}
                typedChar={charStates[index].typedChar}
                isCursor={index === cursor && isFocused}
                className={cn(index === cursor && "active-cursor")}
              />
            ))}
          </div>
        ))}
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
          <div className="text-3-semibold flex flex-col items-center gap-3">
            <p className="text-yellow animate-pulse">Test Paused</p>
            <p className="text-muted-foreground">Click to resume</p>
          </div>
        </div>
      )}
    </div>
  );
};
