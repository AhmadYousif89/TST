"use client";

import { useMemo, useRef } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { useReplay } from "./use-replay";
import { useResult } from "./result.context";
import { useSound } from "@/app/(home)/engine/sound.context";
import { Cursor } from "@/app/(home)/engine/cursor";
import { wordsGroup, Word } from "@/app/(home)/engine/words";
import { calculateWpm, getCharStates } from "@/app/(home)/engine/engine-logic";
import { isRtlLang } from "@/app/(home)/engine/engine-utils";

export const ReplaySection = () => {
  const { playSound } = useSound();
  const { session, text = "", language } = useResult();
  const containerRef = useRef<HTMLDivElement>(null);

  const isRTL = isRtlLang(language);
  const ks = useMemo(() => session.keystrokes || [], [session.keystrokes]);

  const characters = useMemo(() => {
    if (!text) return [];
    const lastIdx = ks.reduce((max, k) => Math.max(max, k.charIndex), 0);
    return text.split("").slice(0, lastIdx + 1);
  }, [text, ks]);

  const { isPlaying, play, pause, reset, currentIndex } = useReplay({
    keystrokes: ks,
    playSound,
  });

  const replayedKeystrokes = useMemo(
    () => ks.slice(0, currentIndex),
    [ks, currentIndex],
  );

  const charStates = useMemo(
    () => getCharStates(characters, replayedKeystrokes),
    [characters, replayedKeystrokes],
  );

  const groupedWords = useMemo(() => wordsGroup(characters), [characters]);

  // Get cursor position and extra offset
  const { cursor: cursorIndex, extraOffset } = useMemo(() => {
    let cursor = 0;

    // Iterate through all played keystrokes to calculate current cursor state
    for (const k of replayedKeystrokes) {
      if (k.typedChar === "Backspace") {
        if (k.skipOrigin !== undefined) cursor = k.skipOrigin;
        else cursor = k.charIndex;
      } else {
        const isExtra = characters[k.charIndex] === " " && k.typedChar !== " ";
        if (isExtra) cursor = k.charIndex;
        else cursor = k.charIndex + 1;
      }
    }

    const currentExtras = charStates[cursor]?.extras?.length || 0;

    return { cursor, extraOffset: currentExtras };
  }, [replayedKeystrokes, characters, charStates]);

  const currentTimeMs = useMemo(() => {
    if (currentIndex === 0 || !ks[currentIndex - 1]) return 0;
    return ks[currentIndex - 1].timestampMs;
  }, [currentIndex, ks]);

  const currentWpm = useMemo(() => {
    if (currentTimeMs === 0) return 0;
    const correctChars = charStates.filter((s) => s.state === "correct").length;
    return calculateWpm(correctChars, currentTimeMs);
  }, [charStates, currentTimeMs]);

  const currentTimeSec = Math.floor(currentTimeMs / 1000);

  return (
    <div className="overflow-hidden">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <p className="text-6 md:text-5 text-muted-foreground/60 tracking-wide">
              watch replay
            </p>
            <div className="flex items-center">
              {/* Play/Pause button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={isPlaying ? pause : play}
                className="text-muted-foreground size-6 rounded-full"
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </Button>
              {/* Reset button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={reset}
                className="text-muted-foreground size-6 rounded-full"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                </svg>
              </Button>
            </div>
          </div>
          {/* WPM and time */}
          <div className="text-6 md:text-5 flex items-center gap-2 font-mono">
            <span className="text-blue-400">{currentWpm}wpm</span>
            <span className="text-muted-foreground">{currentTimeSec}s</span>
          </div>
        </div>
        {/* Key count */}
        <div className="text-6 text-muted-foreground/60 tabular-nums">
          <span className="text-muted-foreground">{currentIndex} </span>/
          <span> {ks.length} keys</span>
        </div>
      </div>

      {/* Replay */}
      <div
        ref={containerRef}
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "relative flex flex-wrap items-center gap-1 pb-2 select-none",
          isRTL ? "font-arabic" : "font-mono",
        )}
      >
        <Cursor
          isRTL={isRTL}
          containerRef={containerRef}
          isFocused={isPlaying}
          cursor={cursorIndex}
          extraOffset={extraOffset}
          cursorStyle="underline"
          disableOverlayStyles
        />
        {groupedWords.map((word, wordIndex) => (
          <Word
            key={wordIndex}
            wordIndex={wordIndex}
            word={word}
            charStates={charStates}
            cursor={cursorIndex}
            className="text-5!"
            isReplay
          />
        ))}
      </div>
    </div>
  );
};

const PlayIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);
