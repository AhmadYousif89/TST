import { Logo } from "./logo";
import { AnonUserDoc } from "@/lib/types";
import { PersonalBest } from "./personal-best";
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
import { SettingsPanel } from "../main/settings";
import { HistoryPanel } from "../main/history";
import { SettingsIcon } from "@/components/settings.icon";
import { NotificationIcon } from "@/components/notification.icon";

export const Header = ({ user }: { user: AnonUserDoc | null }) => {
  return (
    <header className="flex items-center justify-between gap-2">
      <Logo />
      <div className="flex items-center">
        <PersonalBest initialUser={user} />

        <div className="bg-border mr-2 ml-4 h-8 w-px" />

        <Drawer>
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
            <SettingsPanel />
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="destructive">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Drawer direction="right">
          <DrawerTrigger asChild suppressHydrationWarning>
            <Button size="icon" variant="ghost">
              <NotificationIcon />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="w-[calc(100%-1.5rem)]!">
            <DrawerHeader className="items-center border-b">
              <DrawerTitle>History</DrawerTitle>
              <DrawerDescription>Review your typing history</DrawerDescription>
            </DrawerHeader>
            <HistoryPanel />
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="destructive">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  );
};
