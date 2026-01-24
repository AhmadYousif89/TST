"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  useEngineActions,
  useEngineConfig,
} from "@/app/(home)/engine/engine.context";
import { useUrlState } from "@/hooks/use-url-state";

const LANGS = [
  { label: "arabic", value: "ar" },
  { label: "english", value: "en" },
  { label: "english lyrics", value: "en-lyrics" },
  { label: "english quotes", value: "en-quotes" },
  { label: "code", value: "code" },
];

export const LanguageSwitcher = () => {
  const { getParam } = useUrlState();
  const { updateURL } = useEngineActions();
  const { isPending, pendingAction } = useEngineConfig();
  const currentLang = getParam("lang") || "en";

  const isLangPending = isPending && pendingAction === "lang";

  return (
    <>
      <div className="flex items-center justify-center gap-4 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground justify-start hover:bg-transparent! hover:text-blue-600 dark:hover:text-blue-400"
              disabled={isLangPending}
            >
              <svg
                className="size-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                height="24px"
                width="24px"
                fill="currentColor"
              >
                <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-7-.5-14.5T799-507q-5 29-27 48t-52 19h-80q-33 0-56.5-23.5T560-520v-40H400v-80q0-33 23.5-56.5T480-720h40q0-23 12.5-40.5T563-789q-20-5-40.5-8t-42.5-3q-134 0-227 93t-93 227h200q66 0 113 47t47 113v40H400v110q20 5 39.5 7.5T480-160Z" />
              </svg>
              <span>
                {LANGS.find((lang) => lang.value === currentLang)?.label ||
                  "Select Language"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="text-6 min-w-40">
            {LANGS.map((lang) => (
              <DropdownMenuItem
                key={lang.value}
                onSelect={() => updateURL({ lang: lang.value }, "lang")}
                className="text-muted-foreground py-2 font-mono"
              >
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};
