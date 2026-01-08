import { useState, useRef } from "react";

import { cn } from "@/lib/utils";
import {
  useEngineActions,
  useEngineConfig,
} from "@/app/(home)/engine/engine.context";
import { SoundNames } from "@/app/(home)/engine/types";
import { useClickOutside } from "@/hooks/use-click-outside";
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
import { Button } from "@/components/ui/button";
import { VolumeOff, VolumeOn } from "@/components/volume.icon";
import { useSound } from "@/app/(home)/engine/sound.context";

export const SoundSettings = () => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const { setSoundName, setIsMuted, setVolume } = useEngineActions();
  const { soundName, volume, isMuted } = useEngineConfig();
  const { playSound } = useSound();

  // Close slider when clicking outside
  useClickOutside(
    sliderRef,
    () => setShowVolumeSlider(false),
    showVolumeSlider,
  );

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-muted-foreground text-6 md:text-5 min-w-14 md:min-w-18">
        Sound
      </span>
      <div className="flex items-center gap-2">
        <Select
          // open
          value={soundName}
          onValueChange={(val) => setSoundName(val as SoundNames)}
        >
          <SelectTrigger
            size="sm"
            className={cn(
              "min-w-26.5",
              soundName === "none"
                ? "text-muted-foreground hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400"
                : "border-0 bg-blue-400 dark:bg-blue-600",
            )}
          >
            <SelectValue placeholder="Sound" />
          </SelectTrigger>
          <SelectContent
            side="top"
            position="popper"
            className="duration-300 ease-out"
          >
            <SelectGroup>
              <SelectItem value="none">None</SelectItem>
              <SelectSeparator className="bg-border my-1 h-px w-full" />
              <SelectItem value="click">Click</SelectItem>
              <SelectSeparator className="bg-border my-1 h-px w-full" />
              <SelectItem value="beep">Beep</SelectItem>
              <SelectSeparator className="bg-border my-1 h-px w-full" />
              <SelectItem value="creamy">Creamy</SelectItem>
              <SelectSeparator className="bg-border my-1 h-px w-full" />
              <SelectItem value="hitmarker">Hitmarker</SelectItem>
              <SelectSeparator className="bg-border my-1 h-px w-full" />
              <SelectItem value="osu">Osu</SelectItem>
              <SelectSeparator className="bg-border my-1 h-px w-full" />
              <SelectItem value="pop">Pop</SelectItem>
              <SelectSeparator className="bg-border my-1 h-px w-full" />
              <SelectItem value="punch">Punch</SelectItem>
              <SelectSeparator className="bg-border my-1 h-px w-full" />
              <SelectItem value="rubber">Rubber</SelectItem>
              <SelectSeparator className="bg-border my-1 h-px w-full" />
              <SelectItem value="typewriter">Typewriter</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="relative" ref={sliderRef}>
          <Toggle
            size="sm"
            variant="outline"
            aria-label="Volume settings"
            pressed={showVolumeSlider || isMuted}
            onPressedChange={() => setShowVolumeSlider(!showVolumeSlider)}
            className="text-muted-foreground dark:aria-pressed:text-foreground size-8"
          >
            {isMuted || volume === 0 ? <VolumeOff /> : <VolumeOn />}
          </Toggle>

          {showVolumeSlider && (
            <div
              className="bg-background border-border animate-in fade-in slide-in-from-bottom-2 absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md border px-0 py-4 shadow-xl lg:mb-4"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-3">
                <input
                  min="0"
                  max="1"
                  step="0.01"
                  type="range"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="bg-secondary h-28 w-1 cursor-pointer appearance-none rounded-full [direction:rtl] [writing-mode:vertical-lr]"
                />
                <div className="text-foreground text-6 w-10 text-center">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </div>
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -mt-px -translate-x-1/2 border-8 border-transparent border-t-inherit" />
            </div>
          )}
        </div>

        <Button
          size="sm"
          onClick={() => playSound()}
          className="hover:text-muted-foreground text-background dark:text-foreground dark:bg-muted bg-muted-foreground/60 border-0 hover:bg-blue-400 dark:hover:bg-blue-600"
          disabled={soundName === "none" || isMuted}
        >
          Play
        </Button>
      </div>
    </div>
  );
};
