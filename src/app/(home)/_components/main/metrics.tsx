import { SettingsIcon } from "@/components/settings.icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export const Metrics = () => {
  return (
    <section className="grid gap-5 border-b pb-4 md:gap-4 xl:grid-flow-col">
      <div className="flex items-center text-center">
        <div className="flex flex-col gap-2 max-md:grow md:flex-row md:gap-3">
          <span className="text-muted-foreground text-3-mobile md:text-3">
            WPM:
          </span>
          <span className="text-2">40</span>
        </div>
        <div className="bg-border mx-5 h-full w-px" />
        <div className="flex flex-col gap-2 max-md:grow md:flex-row md:gap-3">
          <span className="text-muted-foreground text-3-mobile md:text-3">
            Accuracy:
          </span>
          <span className="text-2 text-red">100%</span>
        </div>
        <div className="bg-border mx-5 h-full w-px" />
        <div className="flex flex-col gap-2 max-md:grow md:flex-row md:gap-3">
          <span className="text-muted-foreground text-3-mobile md:text-3">
            Time:
          </span>
          <span className="text-2 text-yellow">00:00</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 xl:justify-end">
        <div className="flex h-8 items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-6 md:text-5">
              Difficulty:{" "}
            </span>
            <Badge className="text-muted-foreground text-6 bg-blue-600 px-3 font-medium">
              Easy
            </Badge>
          </div>
          <div className="bg-border mx-4 h-full w-px" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-6 md:text-5">
              Mode:{" "}
            </span>
            <Badge className="text-muted-foreground text-6 bg-blue-600 px-3 font-medium">
              Timed (60s)
            </Badge>
          </div>
        </div>

        <Drawer>
          <DrawerTrigger asChild>
            <Button
              className="rounded px-3 py-2 md:h-9 md:w-auto md:rounded-md"
              size="icon-sm"
            >
              <SettingsIcon className="size-5" />
              <span className="hidden md:inline">Settings</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Settings</DrawerTitle>
              <DrawerDescription>
                Configure your typing settings
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="destructive">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </section>
  );
};
