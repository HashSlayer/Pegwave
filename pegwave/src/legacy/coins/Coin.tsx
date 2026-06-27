import React from 'react';
import type { PlayingCoin } from './index.ts';
import type { AnyCoin } from './index.ts';
import { isRedSuit } from './coin.ts';

interface CoinProps {
  readonly card: AnyCoin;
  readonly isSelected: boolean;
  readonly onClick: () => void;
  readonly style?: React.CSSProperties;
  readonly animationClass?: string;
  readonly animationDelay?: number;
  readonly size?: 'small' | 'normal';
}

export function Coin({ card, isSelected, onClick, style, animationClass, animationDelay, size = 'normal' }: CoinProps): React.ReactElement {
  switch (card.type) {
    case 'playing':
      return (
        <PlayingCoinView
          card={card}
          isSelected={isSelected}
          onClick={onClick}
          {...(style !== undefined ? { style } : {})}
          {...(animationClass !== undefined ? { animationClass } : {})}
          {...(animationDelay !== undefined ? { animationDelay } : {})}
        />
      );
    case 'spectral':
      return (
        <SpecialCoinView
          card={card}
          isSelected={isSelected}
          onClick={onClick}
          cardColor="from-purple-600 to-blue-600"
          borderColor={isSelected ? 'border-purple-400' : 'border-gray-600'}
          size={size}
        />
      );
    case 'arcana':
      return (
        <SpecialCoinView
          card={card}
          isSelected={isSelected}
          onClick={onClick}
          cardColor="from-orange-500 to-red-600"
          borderColor={isSelected ? 'border-orange-400' : 'border-gray-600'}
          size={size}
        />
      );
    case 'planetPlinko':
      return (
        <SpecialCoinView
          card={card}
          isSelected={isSelected}
          onClick={onClick}
          cardColor="from-blue-500 to-indigo-600"
          borderColor={isSelected ? 'border-blue-400' : 'border-gray-600'}
          size={size}
        />
      );
  }
}

interface PlayingCoinViewProps {
  readonly card: PlayingCoin;
  readonly isSelected: boolean;
  readonly onClick: () => void;
  readonly style?: React.CSSProperties;
  readonly animationClass?: string;
  readonly animationDelay?: number;
}

function PlayingCoinView({ card, isSelected, onClick, style, animationClass, animationDelay }: PlayingCoinViewProps): React.ReactElement {
  const isRed = isRedSuit(card.suit);
  const suitColor = isRed ? 'text-rose-600' : 'text-slate-900';

  const combinedStyle: React.CSSProperties = {
    ...style,
    ...(animationDelay !== undefined ? { animationDelay: `${animationDelay}s` } : {}),
  };

  // Enhancement-specific surface treatment.
  const enhancementClasses = card.enhancement
    ? {
        foil: 'bg-gradient-to-br from-slate-50 via-sky-100 to-slate-300',
        holographic: 'bg-gradient-to-br from-fuchsia-100 via-pink-100 to-sky-200',
        polychrome: 'bg-gradient-to-br from-rose-100 via-amber-100 to-sky-200',
        glass: 'bg-gradient-to-br from-cyan-50 to-blue-100/80',
      }[card.enhancement]
    : 'bg-gradient-to-br from-white to-slate-100';

  // Foil/holo/polychrome get an animated gloss sweep.
  const shimmer =
    card.enhancement === 'foil' ||
    card.enhancement === 'holographic' ||
    card.enhancement === 'polychrome'
      ? 'card-shimmer'
      : '';

  const stateClasses = isSelected
    ? '-translate-y-3 scale-105 ring-2 ring-amber-300 shadow-[0_16px_30px_rgba(0,0,0,0.55)]'
    : 'shadow-[0_6px_14px_rgba(0,0,0,0.45)] hover:-translate-y-1.5 hover:shadow-[0_12px_22px_rgba(0,0,0,0.5)]';

  return (
    <div
      onClick={onClick}
      className={`group w-[63px] h-[88px] ${enhancementClasses} ${shimmer} rounded-lg ring-1 ring-black/15 border border-white/40 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ease-out select-none relative overflow-hidden ${stateClasses} ${animationClass !== undefined ? animationClass : ''}`}
      style={combinedStyle}
    >
      {/* Top-left index */}
      <div className={`absolute top-1 left-1.5 font-bold leading-none flex flex-col items-center ${suitColor}`}>
        <span className="text-xs">{card.rank}</span>
        <span className="text-[11px]">{card.suit}</span>
      </div>

      {/* Center pip */}
      <div className={`text-4xl drop-shadow-sm ${suitColor}`}>
        {card.suit}
      </div>

      {/* Bottom-right index (rotated) */}
      <div className={`absolute bottom-1 right-1.5 font-bold leading-none flex flex-col items-center rotate-180 ${suitColor}`}>
        <span className="text-xs">{card.rank}</span>
        <span className="text-[11px]">{card.suit}</span>
      </div>

      {/* Enhancement indicator dot */}
      {card.enhancement && (
        <div className="absolute top-0.5 right-0.5">
          <div className={`w-2.5 h-2.5 rounded-full ring-1 ring-white/70 ${
            card.enhancement === 'foil' ? 'bg-slate-400' :
            card.enhancement === 'holographic' ? 'bg-fuchsia-500' :
            card.enhancement === 'glass' ? 'bg-cyan-300' :
            'bg-gradient-to-br from-rose-500 via-amber-400 to-sky-500'
          }`} />
        </div>
      )}
    </div>
  );
}

interface SpecialCoinViewProps {
  readonly card: { name: string; description: string; };
  readonly isSelected: boolean;
  readonly onClick: () => void;
  readonly cardColor: string;
  readonly borderColor: string;
  readonly size?: 'small' | 'normal';
}

function SpecialCoinView({ card, isSelected, onClick, cardColor, borderColor, size = 'normal' }: SpecialCoinViewProps): React.ReactElement {
  const sizeClasses = size === 'small' 
    ? 'w-20 h-28 text-xs p-2'
    : 'w-32 h-44 text-sm p-3';
    
  return (
    <div
      className={`${sizeClasses} rounded-lg border-2 ${borderColor} bg-gradient-to-br ${cardColor} 
        flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105
        ${isSelected ? 'ring-2 ring-white' : ''}`}
      onClick={onClick}
    >
      <div className="text-white text-center">
        <h3 className={`font-bold mb-1 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>{card.name}</h3>
        <p className={`opacity-90 ${size === 'small' ? 'text-[10px] leading-tight' : 'text-xs'}`}>{card.description}</p>
      </div>
    </div>
  );
}