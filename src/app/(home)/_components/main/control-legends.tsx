import { Kbd, KbdGroup } from "@/components/ui/kbd";

export const ControlLegends = () => {
  return (
    <div className="hidden grid-flow-col place-content-center gap-4 opacity-60 md:grid">
      <div className="text-6 text-muted-foreground flex items-center justify-center gap-2 font-mono">
        <KbdGroup>
          <Kbd>Tab</Kbd>
          <PlusIcon />
          <Kbd>R</Kbd>
        </KbdGroup>
        <span>-</span>
        <p>Restart Test</p>
      </div>
      <div className="text-6 text-muted-foreground flex items-center justify-center gap-2 font-mono">
        <KbdGroup>
          <Kbd>Alt</Kbd>
          <PlusIcon />
          <Kbd>S</Kbd>
        </KbdGroup>
        <span>-</span>
        <p>Open Settings</p>
      </div>
      <div className="text-6 text-muted-foreground flex items-center justify-center gap-2 font-mono">
        <KbdGroup>
          <Kbd>Alt</Kbd>
          <PlusIcon />
          <Kbd>H</Kbd>
        </KbdGroup>
        <span>-</span>
        <p>Open History</p>
      </div>
    </div>
  );
};

const PlusIcon = () => (
  <svg
    className="size-3"
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="currentColor"
  >
    <path d="M440-440H240q-17 0-28.5-11.5T200-480q0-17 11.5-28.5T240-520h200v-200q0-17 11.5-28.5T480-760q17 0 28.5 11.5T520-720v200h200q17 0 28.5 11.5T760-480q0 17-11.5 28.5T720-440H520v200q0 17-11.5 28.5T480-200q-17 0-28.5-11.5T440-240v-200Z" />
  </svg>
);
