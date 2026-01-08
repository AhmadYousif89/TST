import { useTheme } from "next-themes";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const ThemeSelector = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-4">
      <span className="text-muted-foreground text-6 md:text-5 min-w-14 md:min-w-18">
        Theme
      </span>
      <ToggleGroup
        size="sm"
        spacing={2}
        type="single"
        variant="outline"
        className="text-6 md:text-5"
        value={resolvedTheme}
        onValueChange={(val) => {
          if (val) setTheme(val);
        }}
      >
        <ToggleGroupItem value="dark" aria-label="Dark">
          Dark
        </ToggleGroupItem>
        <ToggleGroupItem value="light" aria-label="Light">
          Light
        </ToggleGroupItem>
        {/* <ToggleGroupItem value="sepia" aria-label="Sepia">
          Sepia
        </ToggleGroupItem> */}
      </ToggleGroup>
    </div>
  );
};
