/* eslint-disable functional/no-conditional-statements */
/* eslint-disable functional/no-return-void */
/* eslint-disable no-console */

// Impure Web Audio adapter. This is NOT the audio core — it just renders the
// NoteEvents that noteCore produces. The portable logic stays in noteCore.ts;
// the VST3 will swap this file for a JUCE synth voice / MIDI out.

import type { NoteEvent, Waveform } from './noteCore.ts';
import { midiToFrequency } from './noteCore.ts';
import type { PlanetReverbEnv } from '../pegwave/planetPlinko.ts';

const audioContext: AudioContext | null =
  typeof AudioContext !== 'undefined' ? new AudioContext() : null;

function oscillatorType(waveform: Waveform): OscillatorType {
  return waveform === 'tri'
    ? 'triangle'
    : waveform === 'saw'
      ? 'sawtooth'
      : waveform;
}

function connectPlanetReverb(
  ctx: AudioContext,
  source: AudioNode,
  env: PlanetReverbEnv,
  now: number,
  tailSeconds: number,
): void {
  const dry = ctx.createGain();
  dry.gain.value = 1 - env.wet;

  const wet = ctx.createGain();
  wet.gain.value = env.wet;

  const preDelay = ctx.createDelay(1);
  preDelay.delayTime.value = env.preDelaySeconds;

  const feedback = ctx.createGain();
  feedback.gain.value = Math.min(0.88, 0.25 + env.decaySeconds * 0.22);

  const lowCut = ctx.createBiquadFilter();
  lowCut.type = 'highpass';
  lowCut.frequency.value = env.lowCutHz;

  const highCut = ctx.createBiquadFilter();
  highCut.type = 'lowpass';
  highCut.frequency.value = env.highCutHz;

  source.connect(dry);
  dry.connect(ctx.destination);

  source.connect(preDelay);
  preDelay.connect(lowCut);
  lowCut.connect(highCut);
  highCut.connect(wet);
  wet.connect(ctx.destination);

  preDelay.connect(feedback);
  feedback.connect(preDelay);

  const stopAt = now + tailSeconds + env.decaySeconds;
  dry.gain.setValueAtTime(dry.gain.value, stopAt);
  dry.gain.linearRampToValueAtTime(0.0001, stopAt + 0.05);
  wet.gain.setValueAtTime(wet.gain.value, stopAt);
  wet.gain.linearRampToValueAtTime(0.0001, stopAt + 0.05);
  feedback.gain.setValueAtTime(feedback.gain.value, stopAt);
  feedback.gain.linearRampToValueAtTime(0.0001, stopAt + 0.05);
}

// Browsers suspend the context until a user gesture. Call from a click/drop.
export function resumeAudio(): void {
  if (audioContext !== null && audioContext.state === 'suspended') {
    void audioContext.resume().catch(console.warn);
  }
}

// Fire-and-forget pluck. Allocation here is fine in the browser; the JUCE port
// must instead pull from a pre-allocated voice pool inside processBlock.
export function playNote(
  note: NoteEvent,
  waveform: Waveform,
  masterGain = 0.16,
  reverb?: PlanetReverbEnv,
): void {
  if (audioContext === null) {
    return;
  }

  const ctx = audioContext;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = oscillatorType(waveform);
  osc.frequency.value = midiToFrequency(note.pitch);

  const peak = masterGain * (note.velocity / 127);
  const tail = 0.34 + (reverb?.decaySeconds ?? 0) * 0.15;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + tail);

  osc.connect(gain);

  if (reverb !== undefined) {
    connectPlanetReverb(ctx, gain, reverb, now, tail);
  } else {
    gain.connect(ctx.destination);
  }

  osc.start(now);
  osc.stop(now + tail + 0.02);
}
