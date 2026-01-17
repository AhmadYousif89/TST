"use client";

import { useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { SettingsIcon } from "@/components/settings.icon";
import { NotificationIcon } from "@/components/notification.icon";
import { useEngineActions, useEngineConfig } from "../../engine/engine.context";

type Props = {
  personalBest: React.ReactNode;
  historyPanel: React.ReactNode;
  settingsPanel: React.ReactNode;
};

export const Wrapper = ({
  personalBest,
  historyPanel,
  settingsPanel,
}: Props) => {
  const { isSettingsOpen, isHistoryOpen } = useEngineConfig();
  const { setIsSettingsOpen, setIsHistoryOpen } = useEngineActions();

  // Ensure panels receive focus when opened via keyboard shortcuts
  useEffect(() => {
    if (isSettingsOpen || isHistoryOpen) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Small delay to ensure the portal is rendered
      const timer = setTimeout(() => {
        const drawer = document.querySelector('[data-slot="drawer-content"]');
        if (drawer instanceof HTMLElement) drawer.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSettingsOpen, isHistoryOpen]);

  return (
    <div className="flex items-center">
      {personalBest}

      <div className="bg-border mr-2 ml-4 h-8 w-px" />

      <Drawer open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DrawerTrigger asChild suppressHydrationWarning>
          <Button size="icon" variant="ghost">
            <SettingsIcon />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>
              Configure your typing settings
            </DrawerDescription>
          </DrawerHeader>
          {settingsPanel}
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="destructive">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        direction="right"
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
      >
        <DrawerTrigger asChild suppressHydrationWarning>
          <Button size="icon" variant="ghost">
            <NotificationIcon />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="w-[calc(100%-4rem)]!">
          <DrawerHeader className="items-center border-b">
            <DrawerTitle>History</DrawerTitle>
            <DrawerDescription>Review your typing history</DrawerDescription>
          </DrawerHeader>
          {historyPanel}
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="destructive">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
