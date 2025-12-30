"use client";

import { cn } from "@/lib/utils";
import { useUrlState } from "@/hooks/use-url-state";
import { TextDifficulty, TextCategory, TextMode } from "../../engine/types";

import { useEngineState } from "../../engine/engine.context";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@radix-ui/react-select";
import { ThemeSelector } from "@/components/theme-selector";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const ControlPanel = () => {
  const { updateURL } = useUrlState();
  const { mode, textData } = useEngineState();

  const handleDifficultyChange = (val: string) => {
    if (val) {
      const next = val as TextDifficulty;
      updateURL({ difficulty: next, id: null });
    }
  };

  const handleCategoryChange = (val: string) => {
    if (val) {
      const next = val as TextCategory;
      updateURL({ category: next, id: null });
    }
  };

  const handleModeChange = (val: string) => {
    if (val) {
      const next = val as TextMode;
      updateURL({ mode: next });
    }
  };

  return (
    <div className="grid px-4">
      <div className="flex flex-col gap-4 py-4 lg:flex-row lg:flex-wrap lg:px-4 xl:justify-between">
        <div className="flex items-center">
          <span className="text-muted-foreground text-6 md:text-5 min-w-14 md:min-w-20">
            Mode
          </span>
          <span className="text-muted-foreground mx-1 md:mx-2">:</span>
          <div className="flex items-center gap-2">
            <Select
              value={mode === "passage" ? "" : mode.split(":")[1]}
              onValueChange={(val) =>
                handleModeChange(val ? `t:${val}` : "t:60")
              }
            >
              <SelectTrigger
                size="sm"
                className={cn(
                  "min-w-26 md:min-w-32",
                  mode !== "passage" &&
                    "hover:text-foreground border-0 bg-blue-600",
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
                  <SelectItem value="15" className="text-6 md:text-5">
                    Timed (15s)
                  </SelectItem>
                  <Separator className="bg-border my-1 h-px w-full" />
                  <SelectItem value="30" className="text-6 md:text-5">
                    Timed (30s)
                  </SelectItem>
                  <Separator className="bg-border my-1 h-px w-full" />
                  <SelectItem value="60" className="text-6 md:text-5">
                    Timed (60s)
                  </SelectItem>
                  <Separator className="bg-border my-1 h-px w-full" />
                  <SelectItem value="120" className="text-6 md:text-5">
                    Timed (120s)
                  </SelectItem>
                  <Separator className="bg-border my-1 h-px w-full" />
                  <SelectItem value="180" className="text-6 md:text-5">
                    Timed (180s)
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Toggle
              variant="outline"
              aria-label="Passage"
              className="text-6 md:text-5 h-8"
              pressed={mode === "passage"}
              onPressedChange={(pressed) =>
                handleModeChange(pressed ? "passage" : "t:60")
              }
            >
              Passage
            </Toggle>
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-muted-foreground text-6 md:text-5 min-w-14 md:min-w-20">
            Difficulty
          </span>
          <span className="text-muted-foreground mx-1 md:mx-2">:</span>
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
        <div className="flex items-center">
          <span className="text-muted-foreground text-6 md:text-5 min-w-14 md:min-w-20">
            Category
          </span>
          <span className="text-muted-foreground mx-1 md:mx-2">:</span>
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
      <div className="bg-border my-4 h-px w-full" />
      <ThemeSelector />
    </div>
  );
};
