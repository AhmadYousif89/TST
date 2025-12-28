import { AnonUserDoc } from "@/lib/types";
import { Logo } from "./logo";
import { PersonalBest } from "./personal-best";

export const Header = ({ user }: { user: AnonUserDoc | null }) => {
  return (
    <header className="flex items-center justify-between gap-2">
      <Logo />
      <PersonalBest initialUser={user} />
    </header>
  );
};
