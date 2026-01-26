"use client";

import { useEffect, memo } from "react";

import { Cursor } from "./cursor";
import { EngineStatus, CursorStyle } from "./types";
import { useEngineConfig, useEngineKeystroke } from "./engine.context";
import { isRtlLang } from "./engine-utils";

const SIDE_BUFFER = 40;

type TypingCursorProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isFocused: boolean;
  cursor?: number;
  extraOffset?: number;
  status?: EngineStatus;
  cursorStyle?: CursorStyle;
  disableOverlayStyles?: boolean;
  isRTL?: boolean;
};

export const TypingCursor = memo(
  ({
    containerRef,
    isFocused,
    cursor: cursorProp,
    extraOffset: extraOffsetProp,
    status: statusProp,
    cursorStyle,
    disableOverlayStyles,
    isRTL: isRTLProp,
  }: TypingCursorProps) => {
    const { cursor: contextCursor, extraOffset: contextExtraOffset } =
      useEngineKeystroke();
    const { status: contextStatus, textData } = useEngineConfig();

    const cursor = cursorProp ?? contextCursor;
    const extraOffset = extraOffsetProp ?? contextExtraOffset;
    const status = statusProp ?? contextStatus;
    const isRTL = isRTLProp ?? isRtlLang(textData?.language);

    // Dynamically scroll to cursor position when typing
    useEffect(() => {
      if (isFocused && status === "typing") {
        const cursorElement =
          containerRef.current?.querySelector<HTMLElement>(".active-cursor");
        if (cursorElement && containerRef.current) {
          const container = containerRef.current;
          const containerRect = container.getBoundingClientRect();
          const cursorRect = cursorElement.getBoundingClientRect();

          const relativeTop =
            cursorRect.top - containerRect.top + container.scrollTop;
          const targetTop = relativeTop - containerRect.height / 2;

          let targetLeft = container.scrollLeft;

          if (isRTL) {
            if (cursorRect.left < containerRect.left + SIDE_BUFFER) {
              targetLeft =
                container.scrollLeft -
                (containerRect.left + SIDE_BUFFER - cursorRect.left);
            }
            if (cursorRect.right > containerRect.right - SIDE_BUFFER) {
              targetLeft = 0;
            }
          } else {
            if (cursorRect.right > containerRect.right - SIDE_BUFFER) {
              targetLeft =
                container.scrollLeft +
                (cursorRect.right - containerRect.right + SIDE_BUFFER);
            }
            if (cursorRect.left < containerRect.left + SIDE_BUFFER) {
              targetLeft = 0;
            }
          }

          container.scrollTo({
            top: targetTop,
            left: targetLeft,
            behavior: "smooth",
          });
        }
      }
    }, [cursor, isFocused, status, containerRef]);

    // Reset scroll logic
    useEffect(() => {
      if (status === "idle") {
        containerRef.current?.scrollTo({
          top: 0,
          left: 0,
          behavior: "smooth",
        });
      }
    }, [status, containerRef]);

    return (
      <Cursor
        isRTL={isRTL}
        containerRef={containerRef}
        isFocused={isFocused}
        cursor={cursor}
        extraOffset={extraOffset}
        cursorStyle={cursorStyle}
        disableOverlayStyles={disableOverlayStyles}
      />
    );
  },
);

TypingCursor.displayName = "TypingCursor";
