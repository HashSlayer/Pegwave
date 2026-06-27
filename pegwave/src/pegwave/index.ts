/**
 * Pegwave public API — only exports consumed by ui/App.tsx.
 * Import submodules directly (e.g. ./faults.ts) when adding features inside pegwave/.
 */
export type { PegwaveRunState } from './runState.ts';
export {
  createInitialRun,
  startSection,
  completeSection,
  skipSection,
} from './runState.ts';

export {
  savePegwaveRun,
  loadPegwaveRun,
  hasPegwaveSave,
  deletePegwaveSave,
  getPegwaveSaveInfo,
} from './saveRun.ts';

export { GameCanvas } from './GameCanvas.tsx';
export { MainMenuView } from './MainMenuView.tsx';
export { SectionSelectView } from './SectionSelectView.tsx';
