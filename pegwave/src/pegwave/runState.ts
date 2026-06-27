/**
 * Pegwave run state — track, section, gain meter, LFO tuning, boss fault.
 * All transitions are pure functions; persistence is in saveRun.ts.
 */
import type { ScaleName, Waveform } from '../audio/noteCore.ts';
import type { SectionFault, SectionSlot } from './sections.ts';
import {
  pickRandomFault,
  sectionDefFor,
} from './sections.ts';

export interface LFOControlParams {
  readonly waveform: Waveform;
  readonly rate: number;
  readonly depth: number;
  readonly scale: ScaleName;
  readonly rootMidi: number;
  readonly bpm: number;
}

export interface PegwaveRunState {
  readonly track: number;
  readonly sectionSlot: SectionSlot;
  readonly sectionGain: number;
  readonly resonanceThreshold: number;
  readonly dropsUsed: number;
  readonly dropsRemaining: number;
  readonly lfo: LFOControlParams;
  readonly fault: SectionFault | null;
}

const DEFAULT_LFO: LFOControlParams = {
  waveform: 'sine',
  rate: 2,
  depth: 0.7,
  scale: 'minorPenta',
  rootMidi: 48,
  bpm: 120,
};

export function resonanceThresholdForTrack(track: number, slot: SectionSlot): number {
  const base = 2500 + (track - 1) * 400;
  return Math.floor(base * sectionDefFor(slot).thresholdMultiplier);
}

function applySectionMeta(
  run: Pick<PegwaveRunState, 'track' | 'sectionSlot' | 'lfo' | 'fault'> &
    Partial<Pick<PegwaveRunState, 'sectionGain' | 'dropsUsed' | 'dropsRemaining'>>,
  resetProgress: boolean,
): PegwaveRunState {
  const def = sectionDefFor(run.sectionSlot);
  return {
    track: run.track,
    sectionSlot: run.sectionSlot,
    lfo: run.lfo,
    fault: run.fault,
    sectionGain: resetProgress ? 0 : (run.sectionGain ?? 0),
    resonanceThreshold: resonanceThresholdForTrack(run.track, run.sectionSlot),
    dropsUsed: resetProgress ? 0 : (run.dropsUsed ?? 0),
    dropsRemaining: resetProgress ? def.drops : (run.dropsRemaining ?? def.drops),
  };
}

export function createInitialRun(): PegwaveRunState {
  return applySectionMeta(
    {
      track: 1,
      sectionSlot: 'verse',
      lfo: DEFAULT_LFO,
      fault: null,
    },
    true,
  );
}

/** Enter the field for the current section (fresh meter, keep LFO tuning). */
export function startSection(run: PegwaveRunState): PegwaveRunState {
  return applySectionMeta(run, true);
}

export function completeSection(run: PegwaveRunState): PegwaveRunState {
  switch (run.sectionSlot) {
    case 'verse':
      return applySectionMeta(
        { ...run, sectionSlot: 'chorus', fault: null },
        true,
      );
    case 'chorus':
      return applySectionMeta(
        { ...run, sectionSlot: 'drop', fault: pickRandomFault() },
        true,
      );
    case 'drop':
      return applySectionMeta(
        {
          ...run,
          track: run.track + 1,
          sectionSlot: 'verse',
          fault: null,
        },
        true,
      );
  }
}

export function skipSection(run: PegwaveRunState): PegwaveRunState {
  return run.sectionSlot === 'drop'
    ? run
    : completeSection(run);
}

export function updateLfo(run: PegwaveRunState, lfo: LFOControlParams): PegwaveRunState {
  return { ...run, lfo };
}

export function withSectionGain(run: PegwaveRunState, sectionGain: number): PegwaveRunState {
  return { ...run, sectionGain };
}

export function recordDrop(run: PegwaveRunState): PegwaveRunState {
  const dropsUsed = run.dropsUsed + 1;
  return {
    ...run,
    dropsUsed,
    dropsRemaining: Math.max(0, run.dropsRemaining - 1),
  };
}

export function migrateRunState(raw: Partial<PegwaveRunState>): PegwaveRunState {
  const track = raw.track ?? 1;
  const sectionSlot = raw.sectionSlot ?? 'verse';
  const lfo = raw.lfo ?? DEFAULT_LFO;
  const fault =
    raw.fault ?? (sectionSlot === 'drop' ? pickRandomFault() : null);
  const sectionGain = raw.sectionGain ?? 0;
  const dropsUsed = raw.dropsUsed ?? 0;
  const dropsRemaining = raw.dropsRemaining ?? sectionDefFor(sectionSlot).drops;
  const inProgress = sectionGain > 0 || dropsUsed > 0;
  return applySectionMeta(
    {
      track,
      sectionSlot,
      lfo,
      fault,
      sectionGain,
      dropsUsed,
      dropsRemaining,
    },
    !inProgress,
  );
}
