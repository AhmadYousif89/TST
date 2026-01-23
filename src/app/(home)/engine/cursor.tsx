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

    useEffect(() => {
      if (!containerRef.current) return;

      const cursorEl = containerRef.current.querySelector(
        ".active-cursor",
      ) as HTMLElement;

      if (cursorEl) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const cursorRect = cursorEl.getBoundingClientRect();
        const { scrollTop, scrollLeft } = containerRef.current;

        setPosition({
          top: cursorRect.top - containerRect.top + scrollTop,
          left: cursorRect.left - containerRect.left + scrollLeft,
          width: cursorRect.width,
          height: cursorRect.height,
        });
      }
    }, [containerRef, cursor, extraOffset, showOverlay]);

    return (
      <div
        className={cn(
          "pointer-events-none absolute z-10 rounded bg-blue-400/90 transition-all",
          !disableOverlayStyles &&
            showOverlay &&
            "opacity-50 blur-xs duration-300 ease-in-out",
          isFocused && cursor === 0 && "animate-blink duration-100 ease-linear",
          cursorStyle === "box" && "border-2 border-blue-400/90 bg-transparent",
        )}
        style={{
          top: position.top || 0 + (cursorStyle === "box" ? 5 : 0),
          left: position.left || 0,
          width:
            cursorStyle === "box" || cursorStyle === "underline"
              ? position.width || 0
              : 2,
          height:
            cursorStyle === "underline"
              ? 2
              : (position.height || 0) * (cursorStyle === "box" ? 0.9 : 0.8),
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

Cursor.displayName = "Cursor";
