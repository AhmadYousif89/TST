import { AnonUserDoc } from "@/lib/types";
import { PBIcon } from "@/components/personal-best.icon";

type Props = { initialUser: AnonUserDoc | null };

export const PersonalBest = ({ initialUser }: Props) => {
  const bestWpm = initialUser?.bestWpm || 0;

  return (
    <div className="flex items-center gap-2.5">
      <PBIcon />
      <p className="text-3-mobile md:text-4">
        <span className="text-muted-foreground md:hidden">Best:</span>
        <span className="text-muted-foreground hidden md:inline-block">
          Personal best:
        </span>
        <span> {Math.round(bestWpm)} WPM</span>
      </p>
    </div>
  );
};
