import React from 'react';
import type { PegwaveRunState } from './runState.ts';
import { resonanceThresholdForTrack } from './runState.ts';
import {
  faultDescription,
  sectionDefFor,
  SECTION_ORDER,
  VERSE,
  CHORUS,
  DROP,
} from './sections.ts';
import type { SectionSlot } from './sections.ts';

interface SectionSelectProps {
  readonly run: PegwaveRunState;
  readonly onPlay: () => void;
  readonly onSkip: () => void;
  readonly onExit: () => void;
}

type SlotStatus = 'completed' | 'current' | 'upcoming';

function slotStatus(run: PegwaveRunState, slot: SectionSlot): SlotStatus {
  const currentIndex = SECTION_ORDER.indexOf(run.sectionSlot);
  const slotIndex = SECTION_ORDER.indexOf(slot);
  return slotIndex < currentIndex
    ? 'completed'
    : slotIndex === currentIndex
      ? 'current'
      : 'upcoming';
}

function SectionCard({
  def,
  status,
  threshold,
  faultText,
}: {
  readonly def: typeof VERSE;
  readonly status: SlotStatus;
  readonly threshold: number;
  readonly faultText: string | null;
}): React.ReactElement {
  const borderClass =
    status === 'completed'
      ? 'border-emerald-700 opacity-60'
      : status === 'current'
        ? def.slot === 'drop'
          ? 'border-red-500'
          : 'border-amber-500'
        : 'border-gray-600 opacity-50';

  return (
    <div className={`border-2 rounded-lg p-4 text-center flex-1 ${borderClass}`}>
      <h4 className="text-lg font-semibold mb-1">{def.name}</h4>
      <p className="text-xs text-gray-400 mb-2">{def.description}</p>
      <p className="text-sm">Resonance: {threshold}</p>
      <p className="text-sm">Drops: {def.drops}</p>
      {faultText !== null && (
        <p className="text-xs text-amber-400 mt-2">{faultText}</p>
      )}
      {status === 'completed' && (
        <p className="text-sm text-emerald-400 mt-2">Cleared</p>
      )}
      {status === 'current' && (
        <p className="text-sm text-amber-300 mt-2">Current</p>
      )}
    </div>
  );
}

export function SectionSelectView({
  run,
  onPlay,
  onSkip,
  onExit,
}: SectionSelectProps): React.ReactElement {
  const current = sectionDefFor(run.sectionSlot);
  const canSkip = run.sectionSlot !== 'drop';
  const faultText = run.fault !== null ? faultDescription(run.fault) : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-900 text-gray-100 p-6">
      <button onClick={onExit} className="self-start text-sm text-gray-400 hover:text-gray-200">
        ← Menu
      </button>

      <div className="text-center">
        <h1 className="text-4xl font-bold">Track {run.track}</h1>
        <p className="text-gray-400 mt-1">Choose your section</p>
      </div>

      <div className="flex flex-row gap-4 w-full max-w-3xl">
        <SectionCard
          def={VERSE}
          status={slotStatus(run, 'verse')}
          threshold={resonanceThresholdForTrack(run.track, 'verse')}
          faultText={null}
        />
        <SectionCard
          def={CHORUS}
          status={slotStatus(run, 'chorus')}
          threshold={resonanceThresholdForTrack(run.track, 'chorus')}
          faultText={null}
        />
        <SectionCard
          def={DROP}
          status={slotStatus(run, 'drop')}
          threshold={resonanceThresholdForTrack(run.track, 'drop')}
          faultText={run.sectionSlot === 'drop' ? faultText : null}
        />
      </div>

      {run.sectionSlot === 'drop' && run.fault !== null && (
        <div className="max-w-lg text-center px-4 py-3 bg-red-950 border border-red-800 rounded-lg">
          <p className="text-sm font-semibold text-red-300">Fault active</p>
          <p className="text-sm text-red-200 mt-1">{faultDescription(run.fault)}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onPlay}
          className="text-xl px-10 py-5 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded transition-colors"
        >
          Play {current.name}
        </button>
        {canSkip && (
          <button
            onClick={onSkip}
            className="text-xl px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Skip section
          </button>
        )}
      </div>
    </div>
  );
}
