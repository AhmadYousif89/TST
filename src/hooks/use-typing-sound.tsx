"use client";

import { useRef, useEffect, useCallback } from "react";
import { useEngineConfig } from "@/app/(home)/engine/engine.context";
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

export const useTypingSound = () => {
  const { soundName, volume, isMuted } = useEngineConfig();
  const soundNameRef = useRef<SoundNames>("none");
  const audioCtxRef = useRef<AudioContext>(null);
  const buffersRef = useRef<AudioBuffer[]>([]);
  const warningBufferRef = useRef<AudioBuffer | null>(null);
  const warningSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize AudioContext on mount
  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;

    // Load warning sound
    fetch("/assets/sounds/timeWarning.wav")
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        warningBufferRef.current = buffer;
      })
      .catch((err) => console.error("Failed to load warning sound:", err));

    return () => {
      if (ctx.state !== "closed") ctx.close();
    };
  }, []);

  // Load sounds on soundName change
  useEffect(() => {
    if (soundName === "none") {
      buffersRef.current = [];
      soundNameRef.current = "none";
      return;
    }

    if (soundName === soundNameRef.current) return;

    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const config = SOUND_CONFIG[soundName];
    if (!config) return;

    const loadSounds = async () => {
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
      buffersRef.current = newBuffers;
      soundNameRef.current = soundName;
    };

    loadSounds();
  }, [soundName]);

  const playSound = useCallback(() => {
    if (isMuted || soundName === "none") return;

    const ctx = audioCtxRef.current;
    const buffers = buffersRef.current;
    if (!ctx || buffers.length === 0) return;

    // Resume context if suspended
    if (ctx.state === "suspended") ctx.resume();

    const source = ctx.createBufferSource();
    // Pick a random buffer (sounds) from the current set
    const randomIndex = Math.floor(Math.random() * buffers.length);
    source.buffer = buffers[randomIndex];

    // Small random pitch variation for more natural feel
    source.playbackRate.value = 0.98 + Math.random() * 0.04;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
  }, [isMuted, soundName, volume]);

  const playWarningSound = useCallback(() => {
    if (isMuted) return;

    const ctx = audioCtxRef.current;
    const buffer = warningBufferRef.current;
    if (!ctx || !buffer) return;

    if (ctx.state === "suspended") ctx.resume();

    // Stop previous warning sound if it's still playing
    if (warningSourceRef.current) {
      try {
        warningSourceRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      warningSourceRef.current = null;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    // Fade out slightly before stopping
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
      } catch (e) {}
      warningSourceRef.current = null;
    }
  }, []);

  return { playSound, playWarningSound, stopWarningSound };
};
