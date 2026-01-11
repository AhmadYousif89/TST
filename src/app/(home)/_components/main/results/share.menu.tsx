"use client";

import { useState, useEffect } from "react";
import { domToPng } from "modern-screenshot";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CopyLinkIcon } from "@/components/copy.icon";
import { CameraIcon } from "@/components/camera.icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareIcon } from "@/components/share.icon";
import { useResult } from "./result.context";

export const ShareMenu = () => {
  const { setIsScreenshotting, setLoadingProgress } = useResult();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getResultElement = () => {
    return document.getElementById("result-screen");
  };

  const handleDownloadScreenshot = async () => {
    const element = getResultElement();
    if (!element) return;

    setIsScreenshotting(true);
    setLoadingProgress(1);

    const audio = new Audio("/assets/sounds/flash.mp3");
    audio
      .play()
      .catch((err) => console.error("Failed to play shutter sound", err));

    try {
      // Small delay to allow the instant layout shift or transitions to finish
      await new Promise((resolve) => setTimeout(resolve, 400));

      const rect = element.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));

      const dataUrl = await domToPng(element, {
        scale: 2,
        width,
        height,
        backgroundColor: "var(--background)",
        progress: (current, total) => {
          setLoadingProgress(Math.round((current / total) * 100));
        },
      });

      const link = document.createElement("a");
      link.download = `tst-result-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setLoadingProgress(100);
    } catch (err) {
      console.error("Failed to download screenshot", err);
    } finally {
      setTimeout(() => {
        setIsScreenshotting(false);
        setLoadingProgress(0);
      }, 500);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="text-foreground relative"
          >
            <ShareIcon />
            <span
              className={cn(
                "text-muted-foreground absolute left-1/2 -translate-x-1/2 font-mono text-[12px] whitespace-nowrap transition duration-200 ease-in-out",
                copied
                  ? "translate-y-10 opacity-100"
                  : "translate-y-full opacity-0",
              )}
            >
              Copied!
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="text-6">
          <DropdownMenuItem onClick={handleShare} className="py-2">
            <CopyLinkIcon />
            <span>Copy Link</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDownloadScreenshot} className="py-2">
            <CameraIcon />
            <span>Take a Screenshot</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
