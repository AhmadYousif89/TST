"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
} from "react";

import { useEngineConfig } from "./engine.context";
import { SoundFile, SoundNames } from "@/app/(home)/engine/types";

const SOUND_CONFIG: SoundFile = {
  beep: { folder: "beep", prefix: "beep", count: 3 },
  click: { folder: "click", prefix: "click", count: 3 },
  creamy: { folder: "creamys", prefix: "creamy", count: 12 },
  hitmarker: { folder: "hitmarker", prefix: "hitmarker", count: 6 },
  osu: { folder: "osu", prefix: "osu", count: 6 },
  pop: { folder: "pop", prefix: "pop", count: 3 },
  punch: { folder: "punch", prefix: "punch", count: 8 },
  rubber: { folder: "rubber-keys", prefix: "rubber", count: 5 },
  typewriter: { folder: "typewriter", prefix: "typewriter", count: 12 },
};

export type SoundType = "keystroke" | "warning" | "flash";

type SoundContextType = {
  playSound: (type?: SoundType) => void;
  stopSound: (type: SoundType) => void;
};

const SoundContext = createContext<SoundContextType | null>(null);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const { soundName, volume, isMuted } = useEngineConfig();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const buffersCacheRef = useRef<Map<string, AudioBuffer[]>>(new Map());
  const systemBuffersRef = useRef<Map<SoundType, AudioBuffer>>(new Map());
  const activeSourcesRef = useRef<Map<SoundType, AudioBufferSourceNode>>(
    new Map(),
  );

  const initAudioCtx = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;

    fetch("/assets/sounds/timeWarning.wav")
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        systemBuffersRef.current.set("warning", buffer);
      })
      .catch((err) => console.error("Failed to load warning sound:", err));

    fetch("/assets/sounds/flash.mp3")
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        systemBuffersRef.current.set("flash", buffer);
      })
      .catch((err) => console.error("Failed to load flash sound:", err));

    return ctx;
  }, []);

  const loadSoundSet = useCallback(
    async (name: SoundNames) => {
      if (name === "none") return [];
      if (buffersCacheRef.current.has(name))
        return buffersCacheRef.current.get(name)!;

      const ctx = initAudioCtx();
      if (!ctx) return [];

      const config = SOUND_CONFIG[name];
      if (!config) return [];

      const newBuffers: AudioBuffer[] = [];
      const loadPromises = [];

      for (let i = 1; i <= config.count; i++) {
        const url = `/assets/sounds/${config.folder}/${config.prefix}${i}.wav`;
        loadPromises.push(
          fetch(url)
            .then((res) => res.arrayBuffer())
            .then((data) => ctx.decodeAudioData(data))
            .then((buffer) => {
              newBuffers.push(buffer);
            })
            .catch((err) => console.error(`Failed to load sound ${url}:`, err)),
        );
      }

      await Promise.all(loadPromises);
      buffersCacheRef.current.set(name, newBuffers);
      return newBuffers;
    },
    [initAudioCtx],
  );

  // Preload sound set whenever it changes
  useEffect(() => {
    if (soundName !== "none") loadSoundSet(soundName);
  }, [soundName, loadSoundSet]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const stopSound = useCallback((type: SoundType) => {
    const source = activeSourcesRef.current.get(type);
    if (source) {
      try {
        source.stop();
      } catch {
        // Ignore if already stopped
      }
      activeSourcesRef.current.delete(type);
    }
  }, []);

  const playSound = useCallback(
    async (type: SoundType = "keystroke") => {
      if (isMuted) return;

      const ctx = initAudioCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") await ctx.resume();

      if (type === "keystroke") {
        if (soundName === "none") return;
        const buffers = await loadSoundSet(soundName);
        if (buffers.length === 0) return;

        const source = ctx.createBufferSource();
        const randomIndex = Math.floor(Math.random() * buffers.length);
        source.buffer = buffers[randomIndex];
        source.playbackRate.value = 0.96 + Math.random() * 0.04;

        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
      } else {
        const buffer = systemBuffersRef.current.get(type);
        if (!buffer) return;

        stopSound(type);

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);

        if (type === "warning") {
          gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.9);
          source.stop(ctx.currentTime + 0.9);
        }

        activeSourcesRef.current.set(type, source);
      }
    },
    [loadSoundSet, isMuted, soundName, volume, initAudioCtx, stopSound],
  );

  return (
    <SoundContext.Provider value={{ playSound, stopSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) throw new Error("useSound must be used within SoundProvider");
  return context;
};
