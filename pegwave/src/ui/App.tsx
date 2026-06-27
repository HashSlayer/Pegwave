/**
 * Top-level scene router for the live Pegwave game.
 *
 * Scenes: mainMenu → selectingSection → playing (GameCanvas)
 * Run state is persisted to localStorage on every change via savePegwaveRun.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  MainMenuView,
  GameCanvas,
  SectionSelectView,
  createInitialRun,
  startSection,
  completeSection,
  skipSection,
  savePegwaveRun,
  loadPegwaveRun,
  hasPegwaveSave,
  deletePegwaveSave,
  getPegwaveSaveInfo,
  type PegwaveRunState,
} from '../pegwave';
import { StatisticsView, StatisticsProvider, useStatisticsContext } from '../statistics';
import { SoundProvider, SoundSettings, useSound } from '../sound';

type AppScene = 'mainMenu' | 'selectingSection' | 'playing';

function isMidSection(run: PegwaveRunState): boolean {
  return run.sectionGain > 0 || run.dropsUsed > 0;
}

function AppContent(): React.ReactElement {
  const [scene, setScene] = useState<AppScene>('mainMenu');
  const [run, setRun] = useState<PegwaveRunState | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const sound = useSound();
  const stats = useStatisticsContext();

  useEffect(() => {
    if (run !== null && scene !== 'mainMenu') {
      savePegwaveRun(run);
    }
  }, [scene, run]);

  const handleStartNewRun = (): void => {
    deletePegwaveSave();
    stats.trackGameStart();
    sound.play('buttonClick');
    setRun(createInitialRun());
    setScene('selectingSection');
  };

  const handleContinueRun = (): void => {
    const saved = loadPegwaveRun();
    if (saved !== null) {
      sound.play('buttonClick');
      setRun(saved);
      setScene(isMidSection(saved) ? 'playing' : 'selectingSection');
    }
  };

  const handleExitToMenu = (): void => {
    setScene('mainMenu');
  };

  const handleRunChange = useCallback((next: PegwaveRunState): void => {
    setRun(next);
  }, []);

  const handlePlaySection = useCallback((): void => {
    if (run === null) {
      return;
    }
    sound.play('blindSelect');
    setRun(startSection(run));
    setScene('playing');
  }, [run, sound]);

  const handleSkipSection = useCallback((): void => {
    if (run === null) {
      return;
    }
    setRun(skipSection(run));
  }, [run]);

  const handleSectionComplete = useCallback((): void => {
    if (run === null) {
      return;
    }
    sound.play('roundWin');
    setRun(completeSection(run));
    setScene('selectingSection');
  }, [run, sound]);

  if (scene === 'playing' && run !== null) {
    return (
      <GameCanvas
        run={run}
        onRunChange={handleRunChange}
        onSectionComplete={handleSectionComplete}
        onExit={handleExitToMenu}
      />
    );
  }

  if (scene === 'selectingSection' && run !== null) {
    return (
      <SectionSelectView
        run={run}
        onPlay={handlePlaySection}
        onSkip={handleSkipSection}
        onExit={handleExitToMenu}
      />
    );
  }

  return (
    <>
      <MainMenuView
        onStartNewRun={handleStartNewRun}
        onContinueRun={handleContinueRun}
        onShowStatistics={() => setShowStatistics(true)}
        hasSaveGame={hasPegwaveSave()}
        saveInfo={getPegwaveSaveInfo()}
      />
      <StatisticsView
        statistics={stats.statistics}
        isOpen={showStatistics}
        onClose={() => setShowStatistics(false)}
      />
      <SoundSettings
        config={sound.config}
        onVolumeChange={sound.setVolume}
        onToggleMute={sound.toggleMute}
        onToggleEnabled={sound.toggleEnabled}
        isOpen={showSoundSettings}
        onClose={() => setShowSoundSettings(false)}
      />
      <button
        onClick={() => setShowSoundSettings(true)}
        className="fixed bottom-4 right-4 p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
        title="Sound Settings"
      >
        🔊
      </button>
    </>
  );
}

export function App(): React.ReactElement {
  return (
    <StatisticsProvider>
      <SoundProvider>
        <AppContent />
      </SoundProvider>
    </StatisticsProvider>
  );
}
