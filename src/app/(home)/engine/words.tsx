import { memo, useMemo, useEffect } from "react";

import { cn } from "@/lib/utils";
import { CharState } from "./types";
import { isRtlLang } from "./engine-utils";
import { getCharStates } from "./engine-logic";
import {
  useEngineKeystroke,
  useEngineConfig,
  useEngineActions,
} from "./engine.context";

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
  containerRef: React.RefObject<HTMLDivElement | null>;
};

export const Words = memo(({ characters, containerRef }: WordsProps) => {
  const configCtx = useEngineConfig();
  const keystrokeCtx = useEngineKeystroke();
  const { updateLayout } = useEngineActions();

  const { cursor, extraOffset, keystrokes, lockedCursorRef } = keystrokeCtx;
  const { showOverlay, textData, status, layout } = configCtx;
  const startIndex = layout.startIndex;

  const groupedWords = useMemo(() => wordsGroup(characters), [characters]);
  const charStates = useMemo(
    () => getCharStates(characters, keystrokes.current || []),
    [characters, cursor, extraOffset, keystrokes],
  );

  useEffect(() => {
    // Scroll to the engine top when the cursor is at the start position
    if (cursor === 0) {
      updateLayout({ shouldReset: true });
      lockedCursorRef.current = 0;
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [cursor, updateLayout]);

  // Update locked cursor when startIndex changes
  useEffect(() => {
    if (startIndex > 0 && groupedWords[startIndex]) {
      const firstVisibleWord = groupedWords[startIndex];
      const firstCharIndex = firstVisibleWord[0].index;
      lockedCursorRef.current = firstCharIndex;
      updateLayout();
    }
  }, [startIndex, groupedWords, updateLayout]);

  useEffect(() => {
    if (status !== "typing" || !containerRef.current) return;

    const container = containerRef.current;
    const activeCharEl = container.querySelector(".active-cursor");
    const activeWordEl = activeCharEl?.closest(
      "[data-word-index]",
    ) as HTMLElement;

    if (!activeWordEl) return;

    const wordElements = Array.from(
      container.querySelectorAll("[data-word-index]"),
    ) as HTMLElement[];
    if (wordElements.length === 0) return;

    // Detect row offsets
    const rowOffsets: number[] = [];
    // 5px tolerance deals with minor sub-pixel rendering or line-height differences
    // that might make words on the same line have slightly different offsetTop values.
    const fuzzPxs = 5;
    for (const el of wordElements) {
      const top = el.offsetTop;
      const isDuplicate = rowOffsets.some((o) => Math.abs(o - top) < fuzzPxs);
      if (!isDuplicate) rowOffsets.push(top);
    }

    // Sort offsets to ensure reliable row ordering
    rowOffsets.sort((a, b) => a - b);

    // If we have at least 3 rows and are on the 3rd one, hide the 1st row
    if (rowOffsets.length >= 3) {
      const thirdRowTop = rowOffsets[2];
      if (activeWordEl.offsetTop >= thirdRowTop) {
        const firstRowTop = rowOffsets[0];
        let wordsInFirstRow = 0;
        for (const el of wordElements) {
          const isTop = Math.abs(el.offsetTop - firstRowTop) < fuzzPxs;
          if (isTop) wordsInFirstRow++;
          else break;
        }
        if (wordsInFirstRow > 0) {
          updateLayout({ newStartIndex: startIndex + wordsInFirstRow });
        }
      }
    }
  }, [cursor, status, startIndex]);

  const isRTL = isRtlLang(textData?.language);

  return (
    <div
      ref={containerRef}
      dir={isRTL ? "rtl" : "ltr"}
      className={cn(
        "relative flex flex-wrap transition-[opacity,filter] duration-300 ease-in-out select-none",
        showOverlay && "opacity-50 blur-xs select-none",
        isRTL ? "font-arabic pr-2 [word-spacing:1em]" : "pl-2 font-mono",
      )}
    >
      {groupedWords.slice(startIndex).map((word, i) => {
        const wordIndex = startIndex + i;
        return (
          <Word
            key={wordIndex}
            word={word}
            cursor={cursor}
            wordIndex={wordIndex}
            charStates={charStates}
          />
        );
      })}
    </div>
  );
});

type WordProps = {
  wordIndex: number;
  word: { char: string; index: number }[];
  charStates: CharState[];
  cursor: number;
  className?: string;
  isReplay?: boolean;
};

export const Word = memo(
  ({ wordIndex, word, charStates, cursor, className, isReplay }: WordProps) => {
    const { textData } = useEngineConfig();
    const isRTL = isRtlLang(textData?.language);

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
        data-word-index={wordIndex}
        className={cn(
          "text-1-regular-mobile md:text-1-regular relative",
          isRTL ? "inline-block tracking-normal" : "flex items-center",
          className,
        )}
      >
        {/* Characters */}
        {word.map(({ char, index }) => {
          return (
            <Character
              key={`${index}-${char}`}
              isRTL={isRTL}
              char={char}
              state={charStates[index].state}
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
            "bg-red pointer-events-none absolute -z-10 h-0.5 scale-x-0 transform rounded-full transition-transform duration-100 ease-in-out",
            isRTL
              ? "right-0 -bottom-0.5 origin-right"
              : "bottom-0.5 left-0 origin-left",
            isReplay && "bottom-0",
            wordHasError && "scale-x-100",
          )}
        />
      </div>
    );
  },
  areWordsEqual,
);

function areWordsEqual(prev: WordProps, next: WordProps) {
  if (
    prev.wordIndex !== next.wordIndex ||
    prev.className !== next.className ||
    prev.isReplay !== next.isReplay ||
    prev.word !== next.word
  )
    return false;

  const startIndex = prev.word[0].index;
  const endIndex = prev.word[prev.word.length - 1].index;

  // If the cursor enters or leaves the word, it must re-render
  const wasCursorInWord = prev.cursor >= startIndex && prev.cursor <= endIndex;
  const isCursorInWord = next.cursor >= startIndex && next.cursor <= endIndex;
  if (wasCursorInWord !== isCursorInWord) return false;

  // If the cursor is inside the word and it moved, we need to re-render to update the active-cursor
  if (isCursorInWord && prev.cursor !== next.cursor) return false;

  // wordIsProcessed check (affects error underline)
  const wasProcessed = prev.cursor > endIndex;
  const isProcessed = next.cursor > endIndex;
  if (wasProcessed !== isProcessed) return false;

  // Check if character states changed (only for characters in this word)
  for (let i = 0; i < prev.word.length; i++) {
    const idx = prev.word[i].index;
    const p = prev.charStates[idx];
    const n = next.charStates[idx];

    const charNotEqual =
      p.state !== n.state ||
      p.typedChar !== n.typedChar ||
      p.extras?.length !== n.extras?.length;

    if (charNotEqual) return false;

    // Deep check for extras if they exist
    if (p.extras && n.extras)
      for (let j = 0; j < p.extras.length; j++)
        if (p.extras[j] !== n.extras[j]) return false;
  }

  return true;
}

type CharacterProps = {
  char: string;
  state: CharState["state"];
  isRTL: boolean;
  extras?: string[];
  className?: string;
};

export const Character = memo(
  ({ char, state, isRTL, extras, className }: CharacterProps) => {
    return (
      <>
        {extras?.length ? (
          <div
            className={cn(isRTL ? "inline" : "inline-flex")}
            style={isRTL ? { letterSpacing: 0 } : undefined}
          >
            {extras?.map((extra, i) => (
              <span key={i} className="text-red">
                {extra}
              </span>
            ))}
          </div>
        ) : null}
        <span
          className={cn(
            "relative transition-colors duration-100 ease-linear",
            isRTL ? "inline" : "inline-flex",
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
