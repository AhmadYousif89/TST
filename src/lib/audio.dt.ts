declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

// This line is needed to ensure it is treated as a module augmentation.
export {};
