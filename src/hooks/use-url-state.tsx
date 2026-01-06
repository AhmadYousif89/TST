"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  TextDifficulty,
  TextCategory,
  TextMode,
} from "@/app/(home)/engine/types";

export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateURL = useCallback(
    (updates: Record<string, string | null>) => {
      const urlParams = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value) urlParams.set(key, value);
        else urlParams.delete(key);
      });

      const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      const next = `${pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;

      if (next === current) return;

      startTransition(() => {
        router.replace(next, { scroll: false });
      });
    },
    [searchParams, pathname, router],
  );

  const getParam = useCallback(
    (key: string, defaultValue?: string) => {
      if (!searchParams) return defaultValue;
      const raw = searchParams.get(key);
      if (raw == null) return defaultValue;

      switch (key) {
        case "difficulty":
          return (raw || defaultValue) as TextDifficulty | undefined;
        case "category":
          return (raw || defaultValue) as TextCategory | undefined;
        case "mode":
          return (raw || defaultValue) as TextMode | undefined;
        default:
          return raw;
      }
    },
    [searchParams],
  );

  return { updateURL, getParam, isPending };
}
