import { useRef, useState, useEffect, memo, useMemo } from "react";

import { cn } from "@/lib/utils";
import { getCharStates } from "./engine-logic";
import { useEngineKeystroke } from "./engine.context";

// Group characters into words (prevents mid-word line breaks)
const words = (characters: string[]) => {
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
};

type WordsProps = {
  characters: string[];
  isFocused: boolean;
};

export const Words = ({ characters, isFocused }: WordsProps) => {
  const { cursor, extraOffset, keystrokes } = useEngineKeystroke();
  const containerRef = useRef<HTMLDivElement>(null);

  const charStates = useMemo(
    () => getCharStates(characters, keystrokes.current || []),
    [characters, cursor, extraOffset, keystrokes],
  );

  const groupedWords = useMemo(() => words(characters), [characters]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-wrap items-center justify-start font-mono select-none"
    >
      <Cursor
        containerRef={containerRef}
        isFocused={isFocused}
        cursor={cursor}
        extraOffset={extraOffset}
      />
      {/* Words */}
      {groupedWords.map((word, wordIndex) => {
        const lastCharObj = word[word.length - 1];
        const isLastCharSpace = lastCharObj.char === " ";
        const endIndex = lastCharObj.index;
        const wordIsComplete = cursor > endIndex;
        const wordHasError =
          wordIsComplete &&
          word.some(
            (w) =>
              charStates[w.index].state === "incorrect" ||
              charStates[w.index].extras?.length,
          );
        return (
          <div
            data-error={wordHasError}
            key={wordIndex}
            className={cn(
              "group text-1-regular-mobile md:text-1-regular relative flex items-center",
            )}
          >
            {/* Characters */}
            {word.map(({ char, index }) => {
              const state = charStates[index].state;
              return (
                <Character
                  key={`${index}-${char}`}
                  char={char}
                  state={state}
                  extras={charStates[index].extras}
                  className={cn(
                    index === cursor && "active-cursor text-foreground",
                  )}
                />
              );
            })}
            {/* Error underline */}
            <div
              style={{ width: isLastCharSpace ? "calc(100% - 1ch)" : "100%" }}
              className={cn(
                "bg-red pointer-events-none absolute bottom-0 left-0 h-0.5",
                "origin-left scale-x-0 transform transition-transform duration-100 ease-in-out",
                wordHasError && "scale-x-100",
              )}
            />
          </div>
        );
      })}
    </div>
  );
};

type CharacterProps = {
  char: string;
  state: "not-typed" | "correct" | "incorrect";
  extras?: string[];
  className?: string;
};

const Character = memo(({ char, state, extras, className }: CharacterProps) => {
  const isSpace = char === " ";

  return (
    <>
      {extras?.length ? (
        <div className="flex">
          {extras?.map((extra, i) => (
            <span key={i} className="text-red">
              {extra}
            </span>
          ))}
        </div>
      ) : null}
      <span
        className={cn(
          "relative flex transition-colors duration-100 ease-linear",
          isSpace && "opacity-0",
          state === "correct" && "text-green",
          state === "incorrect" && "text-red",
          state === "not-typed" && "text-muted-foreground",
          className,
        )}
      >
        {isSpace ? "\u00a0" : char}
      </span>
    </>
  );
});

Character.displayName = "Character";

type CursorProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isFocused: boolean;
  cursor: number;
  extraOffset: number;
};

type CursorPosition = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const Cursor = memo(
  ({ containerRef, isFocused, cursor, extraOffset }: CursorProps) => {
    const [position, setPosition] = useState<CursorPosition>({
      top: 0,
      left: 0,
      width: 0,
      height: 0,
    });

    useEffect(() => {
      if (!containerRef.current) return;

      const cursorEl = containerRef.current.querySelector(
        ".active-cursor",
      ) as HTMLElement;

      if (cursorEl) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const cursorRect = cursorEl.getBoundingClientRect();

        setPosition({
          top: cursorRect.top - containerRect.top,
          left: cursorRect.left - containerRect.left,
          width: cursorRect.width,
          height: cursorRect.height,
        });
      }
    }, [containerRef, cursor, extraOffset]);

    return (
      <div
        className={cn(
          "pointer-events-none absolute z-10 rounded bg-blue-400 transition-all duration-100 ease-linear",
          isFocused && cursor === 0 && "animate-blink",
          !isFocused && "bg-blue-400/50",
        )}
        style={{
          top: position.top,
          left: position.left,
          width: 3,
          height: position.height * 0.8,
          transform: `translateY(${position.height * 0.125}px)`,
        }}
      />
    );
  },
);
