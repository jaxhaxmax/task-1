"use client";

import { useRef, useCallback, useEffect } from "react";

export function useMechanicalSounds() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  const playSound = useCallback(
    (type: "click" | "clack" | "stamp" | "print") => {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === "suspended") {
        ctx?.resume();
      }
      if (!ctx) return;

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "click") {
        osc.type = "square";
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.05);
      } else if (type === "clack") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
      } else if (type === "stamp") {
        osc.type = "square";
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
        
        // Add a secondary noise burst for the "stamp" impact
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = "lowpass";
        noiseFilter.frequency.value = 1000;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        
        osc.start(t);
        osc.stop(t + 0.15);
        noise.start(t);
        noise.stop(t + 0.15);
      } else if (type === "print") {
        // Fast sequence of clicks
        for (let i = 0; i < 6; i++) {
          const time = t + i * 0.08;
          const poOsc = ctx.createOscillator();
          const poGain = ctx.createGain();
          poOsc.connect(poGain);
          poGain.connect(ctx.destination);
          
          poOsc.type = "square";
          poOsc.frequency.setValueAtTime(300 + Math.random() * 200, time);
          poOsc.frequency.exponentialRampToValueAtTime(100, time + 0.05);
          
          poGain.gain.setValueAtTime(0.1, time);
          poGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
          
          poOsc.start(time);
          poOsc.stop(time + 0.05);
        }
      }
    },
    []
  );

  return { playSound };
}
