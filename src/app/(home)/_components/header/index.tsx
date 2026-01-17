import { Logo } from "./logo";
import { AnonUserDoc } from "@/lib/types";
import { PersonalBest } from "./personal-best";
import { Wrapper } from "./header.client";
import { HistoryPanel } from "../main/history";
import { SettingsPanel } from "../main/settings";

export const Header = ({ user }: { user: AnonUserDoc | null }) => {
  return (
    <header className="flex items-center justify-between gap-2">
      <Logo />
      <Wrapper
        personalBest={<PersonalBest initialUser={user} />}
        settingsPanel={<SettingsPanel />}
        historyPanel={<HistoryPanel />}
      />
    </header>
  );
};
