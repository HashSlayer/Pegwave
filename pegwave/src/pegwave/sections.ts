/**
 * Track/section definitions and boss Fault pool for The Drop.
 * Sections mirror the old blind structure: Verse → Chorus → Drop (boss).
 */
import type { Waveform } from '../audio/noteCore.ts';

export type SectionSlot = 'verse' | 'chorus' | 'drop';

/** Boss-style constraint on what can score resonance (gain). Notes still play. */
export type SectionFault =
  | { readonly type: 'allowedRows'; readonly rows: ReadonlyArray<number>; readonly label: string }
  | { readonly type: 'requiredWaveform'; readonly waveform: Waveform; readonly label: string }
  | { readonly type: 'forbiddenWaveform'; readonly waveform: Waveform; readonly label: string }
  | { readonly type: 'allowedDegrees'; readonly degrees: ReadonlyArray<number>; readonly label: string };

interface SectionDef {
  readonly slot: SectionSlot;
  readonly name: string;
  readonly description: string;
  readonly thresholdMultiplier: number;
  readonly drops: number;
}

export const VERSE: SectionDef = {
  slot: 'verse',
  name: 'Verse',
  description: 'Warm-up section — all rows score.',
  thresholdMultiplier: 1,
  drops: 12,
};

export const CHORUS: SectionDef = {
  slot: 'chorus',
  name: 'Chorus',
  description: 'Higher resonance bar — all rows score.',
  thresholdMultiplier: 1.35,
  drops: 10,
};

export const DROP: SectionDef = {
  slot: 'drop',
  name: 'The Drop',
  description: 'Boss section — a Fault restricts scoring.',
  thresholdMultiplier: 1.8,
  drops: 8,
};

export const SECTION_ORDER: ReadonlyArray<SectionSlot> = ['verse', 'chorus', 'drop'];

export function sectionDefFor(slot: SectionSlot): SectionDef {
  switch (slot) {
    case 'verse':
      return VERSE;
    case 'chorus':
      return CHORUS;
    case 'drop':
      return DROP;
  }
}

const BOSS_FAULTS: ReadonlyArray<SectionFault> = [
  {
    type: 'requiredWaveform',
    waveform: 'sine',
    label: 'The Sine — only sine LFO scores',
  },
  {
    type: 'requiredWaveform',
    waveform: 'saw',
    label: 'The Saw — only saw LFO scores',
  },
  {
    type: 'forbiddenWaveform',
    waveform: 'square',
    label: 'The Purist — square wave scores nothing',
  },
  {
    type: 'allowedRows',
    rows: [0, 1, 2],
    label: 'The Fundamental — only bottom pin rows score',
  },
  {
    type: 'allowedRows',
    rows: [6, 7, 8],
    label: 'The Harmonic — only top pin rows score',
  },
  {
    type: 'allowedRows',
    rows: [3, 4, 5],
    label: 'The Midrange — only middle rows score',
  },
  {
    type: 'allowedDegrees',
    degrees: [0, 4],
    label: 'The Fifth — only root & fifth rows score',
  },
  {
    type: 'allowedDegrees',
    degrees: [0, 2, 4],
    label: 'The Triad — only triad degree rows score',
  },
];

export function pickRandomFault(): SectionFault {
  const index = Math.floor(Math.random() * BOSS_FAULTS.length);
  const fault = BOSS_FAULTS[index];
  return fault ?? {
    type: 'requiredWaveform',
    waveform: 'sine',
    label: 'The Sine — only sine LFO scores',
  };
}

export function faultDescription(fault: SectionFault | null): string {
  return fault === null ? 'No fault — every hit counts.' : fault.label;
}
