import { Logo } from "./logo";
import { PersonalBest } from "./personal-best";

export const Header = () => {
  return (
    <header className="flex items-center justify-between gap-2">
      <Logo />
      <PersonalBest />
    </header>
  );
};
