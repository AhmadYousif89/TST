"use client";

import { useEffect, useRef, useMemo, memo, useState } from "react";
import { cn } from "@/lib/utils";
import { useEngine } from "@/app/(home)/engine.context";
import { CharState, Keystroke } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { getCharStates, calculateNextCursor } from "@/lib/engine-logic";

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
          "text-muted-foreground relative isolate mr-2 whitespace-pre transition-colors duration-100 ease-out",
          "before:absolute before:inset-0 before:-z-10 before:-mx-0.5 before:rounded before:bg-transparent before:transition-colors",
          isCursor &&
            `text-foreground after:bg-input after:absolute after:inset-0 after:-z-10 after:-mx-0.5 after:animate-pulse after:rounded`,
          state === "correct" && "text-green before:bg-green/15",
          state === "incorrect" && "text-red before:bg-red/15",
        )}
      >
        {char}
        {state === "incorrect" && (
          <span className="animate-mistyped text-red pointer-events-none absolute top-0 left-0 select-none">
            {typedChar}
          </span>
        )}
      </span>
    );
  },
);

Character.displayName = "Character";

export const TypingEngine = () => {
  const {
    cursor,
    status,
    textData,
    progress,
    keystrokes,
    setCursor,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    getTimeElapsed,
  } = useEngine();

  const [isFocused, setIsFocused] = useState(false);
  const [showPauseOverlay, setShowPauseOverlay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);

  const characters = useMemo(
    () => textData?.text.split("") || [],
    [textData?.text],
  );

  // Group characters into words (prevents mid-word line breaks)
  const words = useMemo(() => {
    const result: { char: string; index: number }[][] = [];
    let currentWord: { char: string; index: number }[] = [];

    characters.forEach((char, index) => {
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
        wordsContainerRef.current?.querySelector<HTMLElement>(".is-cursor");
      if (cursorElement) {
        cursorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [cursor, isFocused, status]);

  // Reset scroll when session is reset
  useEffect(() => {
    if (status === "idle") {
      wordsContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [status]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isFocused && status === "paused") {
      timer = setTimeout(() => setShowPauseOverlay(true), 100);
    } else {
      setShowPauseOverlay(false);
    }
    return () => clearTimeout(timer);
  }, [isFocused, status]);

  const handleKeydown = (e: React.KeyboardEvent) => {
    // Ignore system shortcuts (command/ctrl keys)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (status === "finished") return;
    if (cursor >= characters.length) return;

    const typedChar = e.key;
    const expectedChar = characters[cursor];
    const timestampMs = getTimeElapsed();

    // Ignore non-character keys except backspace
    if (typedChar.length !== 1 && typedChar !== "Backspace") return;

    // Prevent browser shortcuts (like ' or / for Firefox search)
    e.preventDefault();

    if (status === "idle") {
      startSession();
    }

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
      setCursor((ps) =>
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
    setCursor((ps) => calculateNextCursor(ps, typedChar, characters.length));
    // End session if the cursor is at the end of the text
    if (cursor + 1 >= characters.length) endSession();
  };

  if (!textData) return null;

  const handleFocus = () => {
    setIsFocused(true);
    resumeSession();
  };

  const handleBlur = () => {
    setIsFocused(false);
    pauseSession();
  };

  return (
    <div
      tabIndex={0}
      ref={containerRef}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeydown}
      className="relative isolate flex grow flex-col gap-4 outline-none"
    >
      {/* Progress Bar */}
      <div className="bg-border h-px w-full overflow-hidden rounded-full">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        ref={wordsContainerRef}
        className={cn(
          "max-h-[calc(100vh-31rem)] overflow-y-auto scroll-smooth",
          "text-1-regular-mobile md:text-1-regular break-word flex flex-wrap gap-y-1 pt-8",
          "transition-opacity duration-300 ease-out",
          !isFocused &&
            (status === "idle" || status === "paused") &&
            "opacity-50 blur-xs select-none",
        )}
      >
        {words.map((word, wordIndex) => (
          <div key={wordIndex} className="flex h-fit">
            {word.map(({ char, index }) => (
              <Character
                key={index}
                char={char}
                className={cn(index === cursor && "is-cursor")}
                state={charStates[index].state}
                typedChar={charStates[index].typedChar}
                isCursor={index === cursor && isFocused}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Start Button Backdrop overlay */}
      {!isFocused && status === "idle" && (
        <div
          className="bg-background/5 absolute inset-0 z-20 flex items-center justify-center"
          onClick={() => containerRef.current?.focus()}
        >
          <div className="flex flex-col items-center gap-5">
            <Button
              onPointerDown={() => containerRef.current?.focus()}
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

      {/* Pause Button Backdrop overlay */}
      {showPauseOverlay && (
        <div
          className="bg-background/5 absolute inset-0 z-20 flex items-center justify-center"
          onClick={() => containerRef.current?.focus()}
        >
          <div className="text-3-semibold flex flex-col items-center gap-3">
            <p className="text-yellow animate-pulse">Test Paused</p>
            <p className="text-muted-foreground">Click here to resume</p>
          </div>
        </div>
      )}
    </div>
  );
};
