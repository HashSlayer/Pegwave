import { useCallback } from 'react';
import type { RunState } from '../game/runState.ts';
import type { RoundState } from '../game/roundState.ts';
import type { PlayingCoin, Coin } from '../coins/index.ts';
import type { ConsumableCard } from '../consumables/index.ts';
import { 
  applySpectralEffect, 
  applyArcanaEffect,
  applyPlanetPlinkoEffect,
  canUseConsumable,
  getRequiredSelections 
} from '../consumables/index.ts';
import { removeConsumable } from '../game/runState.ts';

interface UseConsumableEffectsProps {
  readonly runState: RunState;
  readonly roundState: RoundState;
  readonly onUpdateRunState: (updater: (state: RunState) => RunState) => void;
  readonly onUpdateRoundState: (updater: (state: RoundState) => RoundState) => void;
  readonly setPendingConsumable: (id: string | null) => void;
}

interface UseConsumableEffectsReturn {
  readonly handleUseConsumable: (consumableId: string) => void;
  readonly handleCardSelection: (selectedCards: ReadonlyArray<PlayingCoin>, pendingConsumableId: string) => void;
}

function syncHandWithDeck(hand: ReadonlyArray<Coin>, deck: ReadonlyArray<Coin>): ReadonlyArray<Coin> {
  return hand.map(handCard => {
    const updatedCard = deck.find(deckCard => deckCard.id === handCard.id);
    return updatedCard ?? handCard;
  });
}

function applyConsumableEffect(
  consumable: ConsumableCard,
  runState: RunState,
  options: { selectedCards?: ReadonlyArray<PlayingCoin> } = {}
): RunState {
  switch (consumable.type) {
    case 'spectral':
      return applySpectralEffect(runState, consumable, options);
    case 'arcana':
      return applyArcanaEffect(runState, consumable, options);
    case 'planetPlinko':
      return applyPlanetPlinkoEffect(runState, consumable);
  }
}

export function useConsumableEffects({
  runState,
  roundState,
  onUpdateRunState,
  onUpdateRoundState,
  setPendingConsumable
}: UseConsumableEffectsProps): UseConsumableEffectsReturn {
  const handleUseConsumable = useCallback((consumableId: string): void => {
    const consumable = runState.consumables.find(c => c.id === consumableId);
    if (!consumable || roundState.type !== 'selectingHand' || !canUseConsumable(consumable, runState)) return;
    
    const requiredSelections = getRequiredSelections(consumable);
    
    if (requiredSelections !== null && requiredSelections.cards !== undefined) {
      setPendingConsumable(consumableId);
    } else {
      // Apply effect immediately if no selection needed
      const updatedRunState = applyConsumableEffect(consumable, runState);
      
      onUpdateRoundState(currentState => ({
        ...currentState,
        hand: syncHandWithDeck(currentState.hand, updatedRunState.deck)
      }));
        
      onUpdateRunState(() => removeConsumable(updatedRunState, consumableId));
    }
  }, [runState, roundState.type, onUpdateRunState, onUpdateRoundState, setPendingConsumable]);
  
  const handleCardSelection = useCallback((selectedCards: ReadonlyArray<PlayingCoin>, pendingConsumableId: string): void => {
    const consumable = runState.consumables.find(c => c.id === pendingConsumableId);
    if (!consumable) return;
    
    const updatedRunState = applyConsumableEffect(consumable, runState, { selectedCards });
    
    onUpdateRoundState(currentState => ({
      ...currentState,
      hand: syncHandWithDeck(currentState.hand, updatedRunState.deck)
    }));
      
    onUpdateRunState(() => removeConsumable(updatedRunState, pendingConsumableId));
    setPendingConsumable(null);
  }, [runState, onUpdateRunState, onUpdateRoundState, setPendingConsumable]);

  return {
    handleUseConsumable,
    handleCardSelection
  };
}