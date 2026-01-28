import { memo, useMemo, useEffect, useRef, type RefObject } from "react";

import { cn } from "@/lib/utils";
import { Word } from "./word";
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
  containerRef: RefObject<HTMLDivElement | null>;
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

  // Calculate row breaks for layout shifting
  const rowBreaks = useRef<number[]>([]);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculate = () => {
      const wordElementsNodes = container.querySelectorAll("[data-word-index]");
      const wordElemList = Array.from(wordElementsNodes) as HTMLElement[];

      if (wordElemList.length === 0) {
        rowBreaks.current = [];
        return;
      }

      const breaks: number[] = [];
      let lastTop: number | null = null;
      const fuzzPxs = 5;

      for (const el of wordElemList) {
        const top = el.offsetTop;
        const wordIndexAttr = el.getAttribute("data-word-index") || "0";
        const wordIndex = parseInt(wordIndexAttr, 10);
        if (lastTop === null || Math.abs(top - lastTop) > fuzzPxs) {
          breaks.push(wordIndex);
          lastTop = top;
        }
      }
      rowBreaks.current = breaks;
    };

    calculate();

    const resizeObserver = new ResizeObserver(calculate);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [startIndex, groupedWords, containerRef]);

  const lastWordChecked = useRef(-1);
  useEffect(() => {
    if (status !== "typing") return;
    // Find the word index the cursor is currently in
    const activeWordIndex = groupedWords.findIndex(
      (w) => cursor >= w[0].index && cursor <= w[w.length - 1].index,
    );
    // Only run logic if we've moved to a new word
    if (activeWordIndex === lastWordChecked.current) return;
    lastWordChecked.current = activeWordIndex;

    const breaks = rowBreaks.current;
    // Layout shifting logic (keep active word on first two rows)
    if (breaks.length >= 3) {
      const thirdRowStart = breaks[2];
      if (activeWordIndex >= thirdRowStart) {
        // Shift by the number of words in the first row
        const firstRowWordCount = breaks[1] - breaks[0];
        updateLayout({ newStartIndex: startIndex + firstRowWordCount });
      }
    }
  }, [cursor, status, startIndex, groupedWords, updateLayout]);

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
            isRTL={isRTL}
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
