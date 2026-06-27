// LFO note-generation core.
//
// PURE and engine-agnostic: no rendering, no audio I/O, no game state. Input is
// a collision event, output is a note event. The quantize/key/scale rules are
// plain data + pure functions so the EXACT same logic ships in the game today
// and (ported to C++) in the JUCE VST3 later.
//
// Time is always supplied by the caller in seconds. In the game that is a sim
// clock; in the plugin it will be host sample-time / PPQ. This module bakes in
// no frame-rate or game-loop assumptions.

export type Waveform = 'sine' | 'saw' | 'square' | 'tri';

export type ScaleName =
  | 'major'
  | 'minor'
  | 'majorPenta'
  | 'minorPenta'
  | 'chromatic';

interface CollisionEvent {
  readonly pegId: number;
  readonly x: number; // normalized 0..1 across board width
  readonly y: number; // normalized 0..1 top..bottom
  readonly velocity: number; // normalized impact speed ~0..1
  readonly time: number; // seconds
}

export interface NoteEvent {
  readonly pitch: number; // MIDI note number 0..127
  readonly velocity: number; // MIDI velocity 1..127
  readonly time: number; // grid-quantized time in seconds
  readonly pegId: number; // provenance for visuals / debugging
}

export interface QuantizeConfig {
  readonly rootMidi: number; // tonic, e.g. 48 = C3
  readonly scale: ScaleName;
  readonly octaves: number; // ladder span upward from root
  readonly bpm: number;
  readonly subdivision: number; // grid steps per beat (4 = sixteenth notes)
}

const SCALE_INTERVALS: Record<ScaleName, ReadonlyArray<number>> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  majorPenta: [0, 2, 4, 7, 9],
  minorPenta: [0, 3, 5, 7, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

const clamp = (value: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, value));

// Map a normalized horizontal position to a MIDI pitch on the scale ladder.
// Left edge = low, right edge = high. Same mapping the plugin will use for a
// step field / placed trigger points.
function quantizePitch(position: number, config: QuantizeConfig): number {
  const intervals = SCALE_INTERVALS[config.scale];
  const ladderLength = intervals.length * config.octaves;
  const index = clamp(Math.floor(position * ladderLength), 0, ladderLength - 1);
  const octave = Math.floor(index / intervals.length);
  const degree = index % intervals.length;
  const interval = intervals[degree] ?? 0;
  return clamp(config.rootMidi + octave * 12 + interval, 0, 127);
}

// Snap a time (seconds) onto the tempo grid.
function quantizeTime(time: number, config: QuantizeConfig): number {
  const stepSeconds = 60 / config.bpm / config.subdivision;
  return Math.round(time / stepSeconds) * stepSeconds;
}

function velocityToMidi(velocity: number): number {
  return clamp(Math.round(velocity * 126) + 1, 1, 127);
}

// The single rule shared by game and plugin.
export function collisionToNote(
  event: CollisionEvent,
  config: QuantizeConfig,
): NoteEvent {
  return {
    pitch: quantizePitch(event.x, config),
    velocity: velocityToMidi(event.velocity),
    time: quantizeTime(event.time, config),
    pegId: event.pegId,
  };
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
