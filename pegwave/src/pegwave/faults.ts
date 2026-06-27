/**
 * Pure scoring filters for boss Faults.
 * Collisions always produce sound; only qualifying hits add section Gain.
 */
import type { Waveform } from '../audio/noteCore.ts';
import type { SectionFault } from './sections.ts';

/** Pin row index 0 = top of rack, maps to a scale-degree lane. */
export function collisionScoresGain(
  fault: SectionFault | null,
  pegRow: number,
  waveform: Waveform,
): boolean {
  return fault === null
    ? true
    : ((): boolean => {
        switch (fault.type) {
          case 'allowedRows':
            return fault.rows.includes(pegRow);
          case 'requiredWaveform':
            return waveform === fault.waveform;
          case 'forbiddenWaveform':
            return waveform !== fault.waveform;
          case 'allowedDegrees':
            return fault.degrees.includes(pegRow % 5);
        }
      })();
}

export function pegRowScoresGain(
  fault: SectionFault | null,
  pegRow: number,
): boolean {
  return fault === null
    ? true
    : fault.type === 'allowedRows'
      ? fault.rows.includes(pegRow)
      : fault.type === 'allowedDegrees'
        ? fault.degrees.includes(pegRow % 5)
        : true;
}

export function waveformScoresGain(
  fault: SectionFault | null,
  waveform: Waveform,
): boolean {
  return fault === null
    ? true
    : fault.type === 'requiredWaveform'
      ? waveform === fault.waveform
      : fault.type === 'forbiddenWaveform'
        ? waveform !== fault.waveform
        : true;
}
