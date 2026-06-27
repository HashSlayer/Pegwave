import React, { useState, useCallback } from 'react';
import type { PlayingRoundState } from '../game/gameState.ts';
import type { RunState } from '../game/runState.ts';
import type { PlayingCoin, Coin } from '../coins/index.ts';
import { canPlayHand, canDiscardCards } from './roundLogic.ts';
import { RoundView } from './RoundView.tsx';
import { CardSelectionModal } from './CardSelectionModal.tsx';
import { useStatisticsContext } from '../../statistics/StatisticsContext.tsx';
import { getRequiredSelections } from '../consumables/index.ts';
import { useRoundTransitions } from './useRoundTransitions.tsx';
import { useRoundActions } from './useRoundActions.tsx';
import { useConsumableEffects } from './useConsumableEffects.tsx';

interface RoundContainerProps {
  readonly gameState: PlayingRoundState;
  readonly onWin: () => void;
  readonly onLose: () => void;
  readonly onUpdateRunState: (updater: (state: RunState) => RunState) => void;
}

function getPlayingCoins(deck: ReadonlyArray<Coin>): ReadonlyArray<PlayingCoin> {
  const result: PlayingCoin[] = [];
  for (const card of deck) {
    if (card.type === 'playing') {
      result.push(card);
    }
  }
  return result;
}

export function RoundContainer({ 
  gameState, 
  onWin, 
  onLose, 
  onUpdateRunState 
}: RoundContainerProps): React.ReactElement {
  const [roundState, setRoundState] = useState(gameState.roundState);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [pendingConsumable, setPendingConsumable] = useState<string | null>(null);
  const stats = useStatisticsContext();
  
  const bossBlind = gameState.blind.isBoss ? gameState.blind : null;

  // Handle round transitions with custom hook
  useRoundTransitions(
    roundState,
    gameState.runState.cash,
    gameState.runState.jokers,
    gameState.runState.handLevels,
    bossBlind,
    {
      onStateChange: setRoundState,
      onHandPlayed: (handType, score, moneyGenerated) => {
        stats.trackHandPlayed(handType, score);
        
        if (moneyGenerated !== undefined && moneyGenerated > 0) {
          onUpdateRunState(runState => ({
            ...runState,
            cash: runState.cash + moneyGenerated,
          }));
        }
      },
      onRoundFinished: (won) => {
        if (won) {
          onWin();
        } else {
          onLose();
        }
      }
    }
  );

  // Handle round actions with custom hook
  const { handleCardClick, handlePlayHand, handleDiscardCards } = useRoundActions({
    roundState,
    setRoundState,
    setIsDiscarding
  });

  // Handle consumable effects with custom hook
  const { handleUseConsumable, handleCardSelection } = useConsumableEffects({
    runState: gameState.runState,
    roundState,
    onUpdateRunState,
    onUpdateRoundState: setRoundState,
    setPendingConsumable
  });

  // Handle card selection for consumables
  const handleCardSelectionCallback = useCallback((selectedCards: ReadonlyArray<PlayingCoin>): void => {
    if (pendingConsumable !== null) {
      handleCardSelection(selectedCards, pendingConsumable);
    }
  }, [pendingConsumable, handleCardSelection]);

  const pendingConsumableCard = pendingConsumable !== null
    ? gameState.runState.consumables.find(c => c.id === pendingConsumable)
    : null;
    
  const requiredSelections = pendingConsumableCard
    ? getRequiredSelections(pendingConsumableCard)
    : null;

  return (
    <>
      <RoundView
        roundState={roundState}
        runState={gameState.runState}
        blind={gameState.blind}
        bossEffect={gameState.bossEffect}
        onCardClick={handleCardClick}
        onPlayHand={handlePlayHand}
        onDiscardCards={handleDiscardCards}
        onUseConsumable={handleUseConsumable}
        canPlayHand={canPlayHand(roundState, bossBlind)}
        canDiscardCards={canDiscardCards(roundState)}
        isDiscarding={isDiscarding}
      />
      
      {pendingConsumableCard !== null && pendingConsumableCard !== undefined && requiredSelections !== null && requiredSelections.cards !== undefined && (
        <CardSelectionModal
          title={`Use ${pendingConsumableCard.name}`}
          description={pendingConsumableCard.description}
          cards={getPlayingCoins(gameState.runState.deck)}
          maxSelections={requiredSelections.cards}
          onConfirm={handleCardSelectionCallback}
          onCancel={() => setPendingConsumable(null)}
        />
      )}
    </>
  );
}