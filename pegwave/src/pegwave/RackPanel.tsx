import React from 'react';
import type { VoiceCoin } from './coins/voiceCatalog.ts';
import { VOICE_CATALOG } from './coins/voiceCatalog.ts';
import type { PegDefinition } from './pegs/pegCatalog.ts';
import { PEG_CATALOG } from './pegs/pegCatalog.ts';

export type RackTab = 'pegs' | 'coins' | 'wire';

interface RackPanelProps {
  readonly tab: RackTab;
  readonly onTabChange: (tab: RackTab) => void;
  readonly selectedPegId: string | null;
  readonly onSelectPeg: (id: string) => void;
  readonly selectedCoinId: string;
  readonly onSelectCoin: (id: string) => void;
  readonly placedPegCount: number;
}

const TABS: ReadonlyArray<{ id: RackTab; label: string }> = [
  { id: 'pegs', label: 'Pegs' },
  { id: 'coins', label: 'Coins' },
  { id: 'wire', label: 'Wire' },
];

function PegItem({
  peg,
  active,
  onClick,
}: {
  readonly peg: PegDefinition;
  readonly active: boolean;
  readonly onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded border transition-colors ${
        active
          ? 'border-emerald-500 bg-emerald-950/40'
          : 'border-gray-700 bg-gray-800/60 hover:border-gray-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: peg.color }}
        />
        <span className="text-sm font-medium">{peg.name}</span>
      </div>
      <p className="text-xs text-gray-400 mt-1 ml-4">{peg.description}</p>
    </button>
  );
}

function CoinItem({
  coin,
  active,
  onClick,
}: {
  readonly coin: VoiceCoin;
  readonly active: boolean;
  readonly onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded border transition-colors ${
        active
          ? 'border-amber-400 bg-amber-950/30'
          : 'border-gray-700 bg-gray-800/60 hover:border-gray-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-3 h-3 rounded-full shrink-0 border border-gray-600"
          style={{ backgroundColor: coin.color }}
        />
        <span className="text-sm font-medium">{coin.name}</span>
      </div>
      <p className="text-xs text-gray-400 mt-1 ml-5">{coin.description}</p>
    </button>
  );
}

export function RackPanel({
  tab,
  onTabChange,
  selectedPegId,
  onSelectPeg,
  selectedCoinId,
  onSelectCoin,
  placedPegCount,
}: RackPanelProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-3 w-64">
      <div className="flex gap-1 p-1 bg-gray-800 rounded-lg">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={`flex-1 py-2.5 text-xs font-semibold rounded transition-colors ${
              tab === t.id
                ? 'bg-gray-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="border border-gray-700 rounded-lg p-2 max-h-52 overflow-y-auto bg-gray-900/50">
        {tab === 'pegs' && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-500 px-1">
              Select a peg, then click the board to place. ({placedPegCount} placed)
            </p>
            {PEG_CATALOG.map((peg) => (
              <PegItem
                key={peg.id}
                peg={peg}
                active={selectedPegId === peg.id}
                onClick={() => onSelectPeg(peg.id)}
              />
            ))}
          </div>
        )}

        {tab === 'coins' && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-500 px-1">
              Select a coin, then Drop Voice.
            </p>
            {VOICE_CATALOG.map((coin) => (
              <CoinItem
                key={coin.id}
                coin={coin}
                active={selectedCoinId === coin.id}
                onClick={() => onSelectCoin(coin.id)}
              />
            ))}
          </div>
        )}

        {tab === 'wire' && (
          <div className="px-2 py-4 text-center">
            <p className="text-sm text-gray-300 font-medium">Wire — in progress</p>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Modular patch cables will link pegs so one hit triggers another — like an LFO on a VCV rack.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
