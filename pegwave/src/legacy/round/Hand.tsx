import React from 'react';
import type { Coin as CoinType } from '../coins/index.ts';
import { Coin } from '../coins/Coin.tsx';
import { FaceDownCoin } from '../coins/FaceDownCoin.tsx';
import { CardScoreOverlay } from './CardScoreOverlay.tsx';

export type HandState = 
  | { readonly type: 'idle' }
  | { readonly type: 'drawing' }
  | { readonly type: 'discarding' }
  | { readonly type: 'playing' }
  | { readonly type: 'scoring' };

interface HandProps {
  readonly cards: ReadonlyArray<CoinType>;
  readonly selectedCardIds: ReadonlySet<string>;
  readonly playedCards: ReadonlyArray<CoinType>;
  readonly faceDownCardIds: ReadonlySet<string>;
  readonly onCardClick: (cardId: string) => void;
  readonly state: HandState;
}

export function Hand({ 
  cards, 
  selectedCardIds, 
  playedCards,
  faceDownCardIds,
  onCardClick,
  state
}: HandProps): React.ReactElement {
  const playedCardIds = new Set(playedCards.map(c => c.id));
  
  return (
    <div className="flex gap-2 p-4 min-h-[120px]">
      {cards.map((card, index) => {
        const isPlayed = playedCardIds.has(card.id);
        const isSelected = selectedCardIds.has(card.id);
        
        const animationClass = {
          idle: '',
          drawing: 'animate-card-deal',
          discarding: isSelected ? 'animate-card-discard' : '',
          playing: isPlayed ? 'animate-card-play' : '',
          scoring: '',
        }[state.type];
        
        const isFaceDown = faceDownCardIds.has(card.id);
        
        return (
          <div key={card.id} className="relative">
            {isFaceDown ? (
              <FaceDownCoin
                onClick={() => (state.type === 'idle' || state.type === 'drawing') && onCardClick(card.id)}
                animationClass={animationClass}
                animationDelay={index * 0.1}
                style={{
                  opacity: (isPlayed && state.type !== 'playing' && state.type !== 'scoring') ? 0 : 1,
                  transition: 'opacity 0.5s ease-out',
                }}
              />
            ) : (
              <Coin
                card={card}
                isSelected={isSelected}
                onClick={() => (state.type === 'idle' || state.type === 'drawing') && onCardClick(card.id)}
                animationClass={animationClass}
                animationDelay={index * 0.1}
                style={{
                  opacity: (isPlayed && state.type !== 'playing' && state.type !== 'scoring') ? 0 : 1,
                  transition: 'opacity 0.5s ease-out',
                }}
              />
            )}
            <CardScoreOverlay card={card} isVisible={state.type === 'scoring' && isPlayed && !isFaceDown} />
          </div>
        );
      })}
    </div>
  );
}