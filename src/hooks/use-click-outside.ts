import { useEffect, useCallback, RefObject } from "react";

export const useClickOutside = (
  ref: RefObject<HTMLElement | null>,
  callback: () => void,
  active: boolean = true,
) => {
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    },
    [ref, callback],
  );

  useEffect(() => {
    if (active) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [active, handleClick]);
};
