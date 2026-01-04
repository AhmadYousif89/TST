"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  TextDifficulty,
  TextCategory,
  TextMode,
} from "@/app/(home)/engine/types";

type URLParamMap = {
  difficulty: TextDifficulty;
  category: TextCategory;
  mode: TextMode;
  id?: string;
};

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
        router.push(next, { scroll: false });
      });
    },
    [searchParams, pathname, router],
  );

  function getParam<K extends keyof URLParamMap>(
    key: K,
  ): URLParamMap[K] | undefined;
  function getParam<K extends keyof URLParamMap>(
    key: K,
    defaultValue: URLParamMap[K],
  ): URLParamMap[K];
  function getParam(key: string, defaultValue?: string) {
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
  }

  return { updateURL, getParam, isPending };
}
