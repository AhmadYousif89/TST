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

type SoundContextType = {
  playSound: () => void;
  playWarningSound: () => void;
  stopWarningSound: () => void;
};

const SoundContext = createContext<SoundContextType | null>(null);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const { soundName, volume, isMuted } = useEngineConfig();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const buffersCacheRef = useRef<Map<string, AudioBuffer[]>>(new Map());
  const warningBufferRef = useRef<AudioBuffer | null>(null);
  const warningSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const loadSoundSet = useCallback(async (name: SoundNames) => {
    if (name === "none") return [];
    if (buffersCacheRef.current.has(name))
      return buffersCacheRef.current.get(name)!;

    const ctx = audioCtxRef.current;
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
  }, []);

  // Preload sound set whenever it changes
  useEffect(() => {
    if (soundName !== "none" && audioCtxRef.current) {
      loadSoundSet(soundName);
    }
  }, [soundName, loadSoundSet]);

  // Initialize AudioContext and load warning sound
  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;

    fetch("/assets/sounds/timeWarning.wav")
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        warningBufferRef.current = buffer;
      })
      .catch((err) => console.error("Failed to load warning sound:", err));

    // Preload initial sound set
    if (soundName !== "none") {
      loadSoundSet(soundName);
    }

    return () => {
      if (ctx.state !== "closed") ctx.close();
    };
  }, []);

  const playSound = useCallback(async () => {
    if (isMuted || soundName === "none") return;

    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const buffers = await loadSoundSet(soundName);
    if (buffers.length === 0) return;

    if (ctx.state === "suspended") ctx.resume();

    const source = ctx.createBufferSource();
    const randomIndex = Math.floor(Math.random() * buffers.length);
    source.buffer = buffers[randomIndex];
    source.playbackRate.value = 0.96 + Math.random() * 0.04;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
  }, [loadSoundSet, isMuted, soundName, volume]);

  const playWarningSound = useCallback(() => {
    if (isMuted) return;

    const ctx = audioCtxRef.current;
    const buffer = warningBufferRef.current;
    if (!ctx || !buffer) return;

    if (ctx.state === "suspended") ctx.resume();

    if (warningSourceRef.current) {
      try {
        warningSourceRef.current.stop();
      } catch {
        // Ignore if already stopped
      }
      warningSourceRef.current = null;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.9);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
    source.stop(ctx.currentTime + 0.9);

    warningSourceRef.current = source;
  }, [isMuted, volume]);

  const stopWarningSound = useCallback(() => {
    if (warningSourceRef.current) {
      try {
        warningSourceRef.current.stop();
      } catch {
        // Ignore if already stopped
      }
      warningSourceRef.current = null;
    }
  }, []);

  return (
    <SoundContext.Provider
      value={{ playSound, playWarningSound, stopWarningSound }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) throw new Error("useSound must be used within SoundProvider");
  return context;
};
