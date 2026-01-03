import {
  useEngineActions,
  useEngineConfig,
} from "@/app/(home)/engine/engine.context";
import { CursorStyle } from "@/app/(home)/engine/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const CaretSelector = () => {
  const { caretStyle } = useEngineConfig();
  const { setCaretStyle } = useEngineActions();

  return (
    <div className="flex items-center gap-4">
      <span className="text-muted-foreground text-6 md:text-5 min-w-14 md:min-w-18">
        Caret
      </span>
      <ToggleGroup
        size="sm"
        spacing={2}
        type="single"
        variant="outline"
        className="text-6 md:text-5"
        value={caretStyle}
        onValueChange={(val: CursorStyle) => {
          if (val) setCaretStyle(val);
        }}
      >
        <ToggleGroupItem value="pip" aria-label="Pip">
          Pip
        </ToggleGroupItem>
        <ToggleGroupItem value="box" aria-label="Box">
          Box
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Underline">
          Underline
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
