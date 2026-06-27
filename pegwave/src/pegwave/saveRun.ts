/* eslint-disable functional/no-try-statements */
/* eslint-disable functional/no-return-void */
/* eslint-disable functional/no-conditional-statements */
/* eslint-disable @typescript-eslint/consistent-type-assertions */

/** localStorage persistence for PegwaveRunState (key: pegwave-save). */
import type { PegwaveRunState } from './runState.ts';
import { migrateRunState } from './runState.ts';

const SAVE_KEY = 'pegwave-save';
const SAVE_VERSION = 2;

interface SaveData {
  readonly version: number;
  readonly run: PegwaveRunState;
  readonly timestamp: number;
}

function parseSaveData(data: unknown): SaveData | null {
  try {
    return typeof data !== 'object' || data === null ? null : (data as SaveData);
  } catch {
    return null;
  }
}

export function savePegwaveRun(run: PegwaveRunState): void {
  try {
    const saveData: SaveData = {
      version: SAVE_VERSION,
      run,
      timestamp: Date.now(),
    };

    if (typeof window !== 'undefined' && window.localStorage !== undefined) {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    }
  } catch {
    // localStorage unavailable
  }
}

export function loadPegwaveRun(): PegwaveRunState | null {
  try {
    if (typeof window === 'undefined' || window.localStorage === undefined) {
      return null;
    }

    const savedData = window.localStorage.getItem(SAVE_KEY);
    if (savedData === null) {
      return null;
    }

    const parsedData: unknown = JSON.parse(savedData);
    const saveData = parseSaveData(parsedData);

    if (saveData === null) {
      return null;
    }

    if (saveData.version === 1) {
      return migrateRunState(saveData.run as Partial<PegwaveRunState>);
    }

    if (saveData.version !== SAVE_VERSION) {
      return null;
    }

    return saveData.run;
  } catch {
    return null;
  }
}

export function hasPegwaveSave(): boolean {
  if (typeof window === 'undefined' || window.localStorage === undefined) {
    return false;
  }
  return window.localStorage.getItem(SAVE_KEY) !== null;
}

export function deletePegwaveSave(): void {
  if (typeof window !== 'undefined' && window.localStorage !== undefined) {
    window.localStorage.removeItem(SAVE_KEY);
  }
}

export function getPegwaveSaveInfo(): { timestamp: number } | null {
  try {
    if (typeof window === 'undefined' || window.localStorage === undefined) {
      return null;
    }

    const savedData = window.localStorage.getItem(SAVE_KEY);
    if (savedData === null) {
      return null;
    }

    const parsedData: unknown = JSON.parse(savedData);
    const saveData = parseSaveData(parsedData);

    return saveData === null ? null : { timestamp: saveData.timestamp };
  } catch {
    return null;
  }
}
