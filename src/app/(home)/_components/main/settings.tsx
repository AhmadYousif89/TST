import { TestSettings } from "./settings/test-settings";
import { SystemSettings } from "./settings/system-settings";

export const SettingsPanel = () => {
  return (
    <div className="grid px-4">
      <div className="grid py-4 md:grid-cols-[1fr_auto_minmax(min(100%,0px),1fr)] lg:px-4">
        <TestSettings />
        {/* Divider */}
        <div className="bg-border h-px w-full max-md:my-4 md:mx-4 md:h-full md:w-px" />
        <SystemSettings />
      </div>
    </div>
  );
};
