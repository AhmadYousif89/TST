import Image from "next/image";
import LogoIcon from "@/assets/images/logo.svg";
import { ControlLegends } from "../main/control-legends";

export const Footer = ({ isFinished }: { isFinished?: boolean }) => {
  if (isFinished) return null;

  return (
    <footer className="mt-auto grid gap-4">
      <ControlLegends />

      <p className="text-muted text-6 flex items-center justify-center gap-1 dark:opacity-60">
        <span>© {new Date().getFullYear()}</span>
        <span className="flex items-center gap-1">
          <Image src={LogoIcon} alt="Logo" width={20} height={20} />
          TST
        </span>
        <span>. All rights reserved.</span>
      </p>
    </footer>
  );
};
