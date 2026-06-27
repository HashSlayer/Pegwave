import React from 'react';

interface MainMenuProps {
  readonly onStartNewRun: () => void;
  readonly onContinueRun: () => void;
  readonly onShowStatistics: () => void;
  readonly hasSaveGame: boolean;
  readonly saveInfo: { timestamp: number } | null;
}

export function MainMenuView({
  onStartNewRun,
  onContinueRun,
  onShowStatistics,
  hasSaveGame,
  saveInfo,
}: MainMenuProps): React.ReactElement {
  const formatSaveDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8 text-gray-100">
      <div className="text-center">
        <h1 className="text-6xl mb-2 tracking-tight font-bold">Pegwave</h1>
        <p className="text-gray-400 text-lg">Plinko synth roguelike</p>
      </div>

      {hasSaveGame && (
        <div className="text-center">
          <button
            onClick={onContinueRun}
            className="text-2xl px-12 py-5 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors mb-2"
          >
            Continue Run
          </button>
          {saveInfo !== null && (
            <div className="text-sm text-gray-400">
              Last saved: {formatSaveDate(saveInfo.timestamp)}
            </div>
          )}
        </div>
      )}

      <button
        onClick={onStartNewRun}
        className="text-2xl px-12 py-5 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded-lg transition-colors"
      >
        New Run
      </button>

      <button
        onClick={onShowStatistics}
        className="text-xl px-10 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
      >
        Statistics
      </button>
    </div>
  );
}
