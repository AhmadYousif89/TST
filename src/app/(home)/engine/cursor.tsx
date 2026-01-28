import { useState, useEffect, memo } from "react";

import { cn } from "@/lib/utils";
import { CursorStyle } from "./types";
import { isRtlLang } from "./engine-utils";
import { useEngineConfig, useEngineKeystroke } from "./engine.context";

export type CursorProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isFocused: boolean;
  cursor?: number;
  extraOffset?: number;
  cursorStyle?: CursorStyle;
  disableOverlayStyles?: boolean;
  isRTL?: boolean;
};

type CursorPosition = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export const Cursor = memo(
  ({
    isFocused,
    containerRef,
    disableOverlayStyles,
    isRTL: isRTLProp,
    cursor: cursorProp,
    extraOffset: extraOffsetProp,
    cursorStyle: cursorStyleProp,
  }: CursorProps) => {
    const config = useEngineConfig();
    const keystroke = useEngineKeystroke();

    const cursor = cursorProp ?? keystroke?.cursor ?? 0;
    const extraOffset = extraOffsetProp ?? keystroke?.extraOffset ?? 0;
    const configCursorStyle = config?.cursorStyle;
    const showOverlay = config?.showOverlay;
    const textData = config?.textData;
    const layout = config?.layout;

    const isRTL = isRTLProp || isRtlLang(textData?.language);
    const [position, setPosition] = useState<CursorPosition>({
      top: 0,
      left: 0,
      width: 0,
      height: 0,
    });

    const cursorStyle = cursorStyleProp ?? configCursorStyle ?? "pip";
    const isBoxy = cursorStyle === "box" || cursorStyle === "underline";
    const layoutVersion = layout?.version ?? 0;

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
    }, [
      containerRef,
      cursor,
      extraOffset,
      showOverlay,
      isRTL,
      cursorStyle,
      isBoxy,
      layoutVersion,
    ]);

    const left = position.left;
    const width = isBoxy ? position.width || 0 : 2;
    const height =
      cursorStyle === "underline"
        ? 2
        : (position.height || 0) * (isRTL ? 0.85 : 0.9);
    const top =
      cursorStyle === "underline"
        ? position.top - (isRTL ? 3 : 0) + (position.height || 0)
        : position.top +
          (isRTL ? 2 : 0) +
          ((position.height || 0) - height) / 2;

    return (
      <div
        style={{ top, left, width, height }}
        className={cn(
          "pointer-events-none absolute z-10 rounded bg-blue-400/90 transition-[left,top,width,height] ease-in-out will-change-[left,top]",
          !disableOverlayStyles &&
            showOverlay &&
            "opacity-50 blur-xs duration-300",
          isFocused && cursor === 0 && "animate-blink ease-linear",
          cursorStyle === "box" && "border-2 border-blue-400/90 bg-transparent",
        )}
      />
    );
  },
);

Cursor.displayName = "Cursor";
