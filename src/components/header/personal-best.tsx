import Image from "next/image";
import PBIcon from "@/assets/images/icon-personal-best.svg";

export const PersonalBest = () => {
  return (
    <div className="flex items-center gap-2.5">
      <Image src={PBIcon} alt="personal best" width={20} height={20} className="size-5" />
      <p className="text-3-mobile md:text-4">
        <span className="text-muted-foreground md:hidden">Best:</span>
        <span className="text-muted-foreground hidden md:inline-block">
          Personal best:
        </span>
        <span> {123} WPM</span>
      </p>
    </div>
  );
};
