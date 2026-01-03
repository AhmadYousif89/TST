"use client";

import { useState, useEffect } from "react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SettingsIcon } from "@/components/settings.icon";

import { SettingsPanel } from "./settings";
import { formatTime, getModeLabel } from "../../engine/engine-logic";
import { useEngineConfig, useEngineMetrics } from "../../engine/engine.context";

export const Metrics = () => {
  const { wpm, accuracy, timeLeft } = useEngineMetrics();
  const { textData, mode, status } = useEngineConfig();

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  let timeLeftStyle = "";
  if (status === "typing" || status === "paused") timeLeftStyle = "text-yellow";
  if (mode !== "passage" && timeLeft < 10) timeLeftStyle = "text-red";
  if (mode === "passage" && status === "finished") timeLeftStyle = "text-green";

  return (
    <section className="grid gap-5 pb-4 md:gap-4 xl:grid-flow-col">
      <div className="flex items-center border-b pb-4 text-center xl:border-0 xl:pb-0">
        <div className="flex flex-col gap-2 max-md:grow md:flex-row md:gap-3">
          <span className="text-muted-foreground text-3-mobile md:text-3">
            WPM:
          </span>
          <span className="text-2">{Math.round(wpm)}</span>
        </div>
        <div className="bg-border mx-5 h-full w-px" />
        <div className="flex flex-col gap-2 max-md:grow md:flex-row md:gap-3">
          <span className="text-muted-foreground text-3-mobile md:text-3">
            Accuracy:
          </span>
          <span
            className={`text-2 ${status !== "idle" && accuracy === 100 ? "text-green" : accuracy < 100 ? "text-red" : ""}`}
          >
            {Math.round(accuracy)}%
          </span>
        </div>
        <div className="bg-border mx-5 h-full w-px" />
        <div className="flex flex-col gap-2 max-md:grow md:flex-row md:gap-3">
          <span className="text-muted-foreground text-3-mobile md:text-3">
            Time:
          </span>
          <span className={`text-2 ${timeLeftStyle}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 xl:justify-end">
        <div className="flex h-8 items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-6 md:text-5 hidden sm:inline">
              Category:
            </span>
            <Badge className="text-muted-foreground text-6 bg-blue-600 font-medium capitalize">
              {textData?.category}
            </Badge>
          </div>
          <div className="bg-border mx-4 h-full w-px" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-6 md:text-5 hidden sm:inline">
              Difficulty:
            </span>
            <Badge className="text-muted-foreground text-6 bg-blue-600 font-medium capitalize">
              {textData?.difficulty}
            </Badge>
          </div>
          <div className="bg-border mx-4 h-full w-px" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-6 md:text-5 hidden sm:inline">
              Mode:
            </span>
            <Badge className="text-muted-foreground text-6 bg-blue-600 font-medium">
              {getModeLabel(mode)}
            </Badge>
          </div>
        </div>

        {hasMounted ? (
          <Drawer>
            <DrawerTrigger asChild>
              <Button size="icon">
                <SettingsIcon className="size-6" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Settings</DrawerTitle>
                <DrawerDescription>
                  Configure your typing settings
                </DrawerDescription>
              </DrawerHeader>
              <SettingsPanel />
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="destructive">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        ) : (
          <Button size="icon">
            <SettingsIcon className="size-6" />
          </Button>
        )}
      </div>
    </section>
  );
};
