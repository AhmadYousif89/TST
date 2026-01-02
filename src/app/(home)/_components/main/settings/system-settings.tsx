import { SoundSettings } from "./sound-settings";
import { ThemeSelector } from "./theme-selector";

export const SystemSettings = () => {
  return (
    <div className="space-y-4">
      <SoundSettings />
      <ThemeSelector />
    </div>
  );
};
