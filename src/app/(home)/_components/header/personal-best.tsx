import { AnonUserDoc } from "@/lib/types";
import { PBIcon } from "@/components/personal-best.icon";

type Props = { initialUser: AnonUserDoc | null };

export const PersonalBest = ({ initialUser }: Props) => {
  const bestWpm = initialUser?.bestWpm || 0;

  return (
    <div className="flex items-center gap-2.5">
      <span className="not-dark:**:fill-orange">
        <PBIcon />
      </span>
      <p className="text-3-mobile md:text-4">
        <span className="dark:text-muted-foreground text-muted-foreground md:hidden">
          Best:
        </span>
        <span className="dark:text-muted-foreground text-muted-foreground hidden md:inline-block">
          Personal best:
        </span>
        <span className="font-mono font-medium">
          {" "}
          {Math.round(bestWpm)} WPM
        </span>
      </p>
    </div>
  );
};
