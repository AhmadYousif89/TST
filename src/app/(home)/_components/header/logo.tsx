import Link from "next/link";
import Image from "next/image";

import LogoIcon from "@/assets/images/logo.svg";

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src={LogoIcon}
        alt="logo"
        width={40}
        height={40}
        className="size-8 self-start"
      />
      <div className="hidden gap-0.5 md:grid">
        <span className="text-2 from-muted-foreground dark:from-foreground/90 bg-linear-to-br to-blue-400 bg-clip-text text-transparent">
          Typing Speed Test
        </span>
        <span className="dark:text-muted-foreground text-6">
          Type as fast as you can in 60 seconds
        </span>
      </div>
    </Link>
  );
};
