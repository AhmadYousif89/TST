"use client";

import { useState, useEffect, memo } from "react";

import { cn } from "@/lib/utils";
import { CursorStyle } from "./types";
import { useEngineConfig } from "./engine.context";

export type CursorProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isFocused: boolean;
  cursor: number;
  extraOffset: number;
  cursorStyle?: CursorStyle;
  isRTL?: boolean;
  disableOverlayStyles?: boolean;
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
    isRTL,
    disableOverlayStyles,
  }: CursorProps) => {
    const { cursorStyle: configCursorStyle, showOverlay } = useEngineConfig();
    const cursorStyle = cursorStyleProp || configCursorStyle;
    const [position, setPosition] = useState<CursorPosition>({
      top: 0,
      left: 0,
      width: 0,
      height: 0,
    });

    const isBoxy = cursorStyle === "box" || cursorStyle === "underline";

    useEffect(() => {
      if (!containerRef.current) return;

      const cursorEl = containerRef.current.querySelector(
        ".active-cursor",
      ) as HTMLElement;

      if (cursorEl) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const cursorRect = cursorEl.getBoundingClientRect();
        const { scrollTop, scrollLeft } = containerRef.current;

        const left = isRTL
          ? isBoxy
            ? cursorRect.left - containerRect.left + scrollLeft
            : cursorRect.right - containerRect.left + scrollLeft
          : cursorRect.left - containerRect.left + scrollLeft;

        setPosition({
          top: cursorRect.top - containerRect.top + scrollTop,
          left,
          width: cursorRect.width,
          height: cursorRect.height,
        });
      }
    }, [containerRef, cursor, extraOffset, showOverlay, isRTL, cursorStyle]);

    const left = position.left;
    const width = isBoxy ? position.width || 0 : 2;
    const height =
      cursorStyle === "underline" ? 2 : (position.height || 0) * 0.8;
    const top =
      cursorStyle === "underline"
        ? position.top + (position.height || 0) - 3
        : position.top + ((position.height || 0) - height) / 2;

    return (
      <div
        style={{ top, left, width, height }}
        className={cn(
          "pointer-events-none absolute z-10 rounded bg-blue-400/90 transition-all",
          // !disableOverlayStyles &&
          //   showOverlay &&
          //   "opacity-50 blur-xs duration-300 ease-in-out",
          isFocused && cursor === 0 && "animate-blink duration-100 ease-linear",
          cursorStyle === "box" && "border-2 border-blue-400/90 bg-transparent",
        )}
      />
    );
  },
);

Cursor.displayName = "Cursor";
