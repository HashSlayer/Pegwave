// Pure low-frequency oscillator. A function of time (seconds), nothing else —
// no frame-rate assumptions, no state. The board feeds it the same sim clock
// that timestamps collisions, so visuals and audio stay phase-locked.

import type { Waveform } from '../audio/noteCore.ts';

interface LFOParams {
  readonly rate: number; // Hz (cycles per second)
  readonly depth: number; // 0..1
  readonly waveform: Waveform;
  readonly phase: number; // 0..1 cycle offset
}

// Bipolar value in [-depth, depth].
export function lfoValue(params: LFOParams, timeSeconds: number): number {
  const cyclePosition = (params.rate * timeSeconds + params.phase) % 1;
  const wrapped = cyclePosition < 0 ? cyclePosition + 1 : cyclePosition;
  const raw =
    params.waveform === 'sine'
      ? Math.sin(wrapped * 2 * Math.PI)
      : params.waveform === 'saw'
        ? 2 * wrapped - 1
        : params.waveform === 'square'
          ? wrapped < 0.5
            ? 1
            : -1
          : wrapped < 0.5
            ? 4 * wrapped - 1
            : 3 - 4 * wrapped;
  return raw * params.depth;
}
