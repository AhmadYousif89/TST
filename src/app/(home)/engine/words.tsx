import { useRef, useState, useEffect, memo, useMemo } from "react";

import { cn } from "@/lib/utils";
import { getCharStates } from "./engine-logic";
import { useEngineKeystroke, useEngineConfig } from "./engine.context";
import { CursorStyle } from "./types";

// Group characters into words (prevents mid-word line breaks)
export const wordsGroup = (characters: string[]) => {
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

  const groupedWords = useMemo(() => wordsGroup(characters), [characters]);

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
      {groupedWords.map((word, wordIndex) => (
        <Word
          key={wordIndex}
          word={word}
          cursor={cursor}
          charStates={charStates}
        />
      ))}
    </div>
  );
};

type WordProps = {
  word: { char: string; index: number }[];
  charStates: any[];
  cursor: number;
  className?: string;
};

export const Word = ({ word, charStates, cursor, className }: WordProps) => {
  const lastCharObj = word[word.length - 1];
  const isLastCharSpace = lastCharObj.char === " ";
  const endIndex = lastCharObj.index;
  const wordIsProcessed = cursor > endIndex;
  const wordHasError =
    wordIsProcessed &&
    word.some(
      (w) =>
        charStates[w.index].state === "incorrect" ||
        (charStates[w.index].extras?.length ?? 0) > 0,
    );

  return (
    <div
      data-error={wordHasError}
      className={cn(
        "relative flex items-center",
        "text-1-regular-mobile md:text-1-regular",
        className,
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
              index === cursor && "active-cursor text-foreground/80",
            )}
          />
        );
      })}
      {/* Error underline */}
      <div
        style={{ width: isLastCharSpace ? "calc(100% - 1ch)" : "100%" }}
        className={cn(
          "bg-red pointer-events-none absolute bottom-0 left-0 -z-10 h-0.5 rounded-full",
          "origin-left scale-x-0 transform transition-transform duration-100 ease-in-out",
          wordHasError && "scale-x-100",
        )}
      />
    </div>
  );
};

type CharacterProps = {
  char: string;
  state: "not-typed" | "correct" | "incorrect";
  extras?: string[];
  className?: string;
};

export const Character = memo(
  ({ char, state, extras, className }: CharacterProps) => {
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
            state === "correct" && "text-green",
            state === "incorrect" && "text-red",
            state === "not-typed" && "text-muted-foreground",
            className,
          )}
        >
          {char === " " ? "\u00a0" : char}
        </span>
      </>
    );
  },
);

Character.displayName = "Character";

type CursorProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isFocused: boolean;
  cursor: number;
  extraOffset: number;
  cursorStyle?: CursorStyle;
};

type CursorPosition = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export const Cursor = memo(
  ({
    containerRef,
    isFocused,
    cursor,
    extraOffset,
    cursorStyle: cursorStyleProp,
  }: CursorProps) => {
    const { cursorStyle: configCursorStyle } = useEngineConfig();
    const cursorStyle = cursorStyleProp || configCursorStyle;
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
          cursorStyle === "box" &&
            "border border-blue-400 bg-transparent opacity-50",
        )}
        style={{
          top: position.top || 0,
          left: position.left || 0,
          width:
            cursorStyle === "box" || cursorStyle === "underline"
              ? position.width || 0
              : 3,
          height:
            cursorStyle === "box"
              ? position.height || 0
              : cursorStyle === "underline"
                ? 2
                : (position.height || 0) * 0.8,
          transform:
            cursorStyle === "box"
              ? "none"
              : cursorStyle === "underline"
                ? `translateY(${(position.height || 0) - 2}px)`
                : `translateY(${(position.height || 0) * 0.125}px)`,
        }}
      />
    );
  },
);
