"use client";

import { cn } from "@/lib/utils";
import { useUrlState } from "@/hooks/use-url-state";
import { useEngineConfig } from "@/app/(home)/engine/engine.context";
import {
  TextDifficulty,
  TextCategory,
  TextMode,
} from "@/app/(home)/engine/types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TopLoader } from "@/components/top-loader";

export const TestSettings = () => {
  const { updateURL, isPending } = useUrlState();
  const { mode, textData } = useEngineConfig();

  const handleDifficultyChange = (val: string) => {
    if (val) {
      updateURL({ difficulty: val as TextDifficulty, id: null });
    }
  };

  const handleCategoryChange = (val: string) => {
    if (val) {
      updateURL({ category: val as TextCategory, id: null });
    }
  };

  const handleModeChange = (val: string) => {
    if (val) {
      updateURL({ mode: val as TextMode });
    }
  };

  return (
    <>
      <TopLoader isPending={isPending} />
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-6 md:text-5 min-w-14 md:min-w-18">
            Mode
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={mode === "passage" ? "" : mode.split(":")[1]}
              onValueChange={(val) =>
                handleModeChange(val ? (`t:${val}` as TextMode) : "t:60")
              }
            >
              <SelectTrigger
                size="sm"
                className={cn(
                  "min-w-26 md:min-w-32",
                  mode !== "passage" && "border-0 bg-blue-400 dark:bg-blue-600",
                )}
              >
                <SelectValue placeholder="Timed" />
              </SelectTrigger>
              <SelectContent
                side="top"
                position="popper"
                className="duration-300 ease-out"
              >
                <SelectGroup>
                  <SelectItem value="15">Timed (15s)</SelectItem>
                  <SelectSeparator className="bg-border my-1 h-px w-full" />
                  <SelectItem value="30">Timed (30s)</SelectItem>
                  <SelectSeparator className="bg-border my-1 h-px w-full" />
                  <SelectItem value="60">Timed (60s)</SelectItem>
                  <SelectSeparator className="bg-border my-1 h-px w-full" />
                  <SelectItem value="120">Timed (120s)</SelectItem>
                  <SelectSeparator className="bg-border my-1 h-px w-full" />
                  <SelectItem value="180">Timed (180s)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Toggle
              variant="outline"
              aria-label="Passage"
              className="h-8"
              pressed={mode === "passage"}
              onPressedChange={(pressed) =>
                handleModeChange(pressed ? "passage" : "t:60")
              }
            >
              <span className="text-6 md:text-5">Passage</span>
            </Toggle>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-6 md:text-5 min-w-14 md:min-w-18">
            Difficulty
          </span>
          <ToggleGroup
            size="sm"
            spacing={2}
            type="single"
            variant="outline"
            className="text-6 md:text-5"
            value={textData?.difficulty}
            onValueChange={handleDifficultyChange}
          >
            <ToggleGroupItem value="easy" aria-label="Easy">
              Easy
            </ToggleGroupItem>
            <ToggleGroupItem value="medium" aria-label="Medium">
              Medium
            </ToggleGroupItem>
            <ToggleGroupItem value="hard" aria-label="Hard">
              Hard
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-6 md:text-5 min-w-14 md:min-w-18">
            Category
          </span>
          <ToggleGroup
            size="sm"
            type="single"
            variant="outline"
            spacing={2}
            className="text-6 md:text-5"
            value={textData?.category}
            onValueChange={handleCategoryChange}
          >
            <ToggleGroupItem value="general" aria-label="General">
              General
            </ToggleGroupItem>
            <ToggleGroupItem value="lyrics" aria-label="Lyrics">
              Lyrics
            </ToggleGroupItem>
            <ToggleGroupItem value="quotes" aria-label="Quotes">
              Quotes
            </ToggleGroupItem>
            <ToggleGroupItem value="code" aria-label="Code">
              Code
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </>
  );
};
