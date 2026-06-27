import { describe, it, expect } from 'bun:test';
import { 
  calculateBaseChipMult,
  calculateFinalScore,
  getCoinEnhancementEffects,
  determineGlassBrokenCoins,
  GLASS_MULT_BONUS
} from './scoring.ts';
import type { Coin } from '../coins/index.ts';
import { createCoin } from '../coins/index.ts';
import type { RandomNumberGenerator } from './scoring.ts';
import type { EvaluatedHand } from './pokerHands.ts';

describe('glass enhancement', () => {
  describe('getCoinEnhancementEffects', () => {
    it('should apply glass multiplier bonus', () => {
      const cards: ReadonlyArray<Coin> = [
        createCoin('♠', 'A', 'glass'),
        createCoin('♥', 'K'),
      ];
      
      const effects = getCoinEnhancementEffects(cards);
      
      expect(effects).toHaveLength(1);
      expect(effects[0]).toEqual({
        type: 'multiplyMult',
        value: GLASS_MULT_BONUS,
        source: 'Glass A♠',
      });
    });
    
    it('should apply multiple glass bonuses', () => {
      const cards: ReadonlyArray<Coin> = [
        createCoin('♠', 'A', 'glass'),
        createCoin('♥', 'K', 'glass'),
        createCoin('♦', 'Q'),
      ];
      
      const effects = getCoinEnhancementEffects(cards);
      
      expect(effects).toHaveLength(2);
      expect(effects[0]?.source).toContain('Glass A♠');
      expect(effects[1]?.source).toContain('Glass K♥');
    });
  });
  
  describe('determineGlassBrokenCoins', () => {
    it('should not break non-glass cards', () => {
      const cards: ReadonlyArray<Coin> = [
        createCoin('♠', 'A'),
        createCoin('♥', 'K', 'holographic'),
        createCoin('♦', 'Q', 'polychrome'),
      ];
      
      const alwaysBreakRandom: RandomNumberGenerator = () => 0; // Always less than break chance
      const brokenCards = determineGlassBrokenCoins(cards, alwaysBreakRandom);
      
      expect(brokenCards).toHaveLength(0);
    });
    
    it('should break glass cards when random is below threshold', () => {
      const cards: ReadonlyArray<Coin> = [
        createCoin('♠', 'A', 'glass'),
        createCoin('♥', 'K', 'glass'),
        createCoin('♦', 'Q'),
      ];
      
      const alwaysBreakRandom: RandomNumberGenerator = () => 0; // Always less than 0.25
      const brokenCards = determineGlassBrokenCoins(cards, alwaysBreakRandom);
      
      expect(brokenCards).toHaveLength(2);
      expect(brokenCards[0]?.enhancement).toBe('glass');
      expect(brokenCards[1]?.enhancement).toBe('glass');
    });
    
    it('should not break glass cards when random is above threshold', () => {
      const cards: ReadonlyArray<Coin> = [
        createCoin('♠', 'A', 'glass'),
        createCoin('♥', 'K', 'glass'),
      ];
      
      const neverBreakRandom: RandomNumberGenerator = () => 0.5; // Always greater than 0.25
      const brokenCards = determineGlassBrokenCoins(cards, neverBreakRandom);
      
      expect(brokenCards).toHaveLength(0);
    });
    
    it('should break some glass cards based on random values', () => {
      const cards: ReadonlyArray<Coin> = [
        createCoin('♠', 'A', 'glass'),
        createCoin('♥', 'K', 'glass'),
        createCoin('♦', 'Q', 'glass'),
      ];
      
      // Create a deterministic sequence: break, don't break, break
      const values = [0.1, 0.3, 0.2];
      const sequenceRandom: RandomNumberGenerator = (() => {
        const iter = values[Symbol.iterator]();
        return () => iter.next().value ?? 0;
      })();
      
      const brokenCards = determineGlassBrokenCoins(cards, sequenceRandom);
      
      expect(brokenCards).toHaveLength(2);
      expect(brokenCards[0]?.rank).toBe('A');
      expect(brokenCards[1]?.rank).toBe('Q');
    });
    
    it('should handle empty card array', () => {
      const cards: ReadonlyArray<Coin> = [];
      
      const brokenCards = determineGlassBrokenCoins(cards);
      
      expect(brokenCards).toHaveLength(0);
    });
    
    it('should use default Math.random when no random function provided', () => {
      const cards: ReadonlyArray<Coin> = [
        createCoin('♠', 'A', 'glass'),
      ];
      
      // This test just ensures the function works with default random
      const brokenCards = determineGlassBrokenCoins(cards);
      
      // Result could be 0 or 1 depending on random
      expect(brokenCards.length).toBeGreaterThanOrEqual(0);
      expect(brokenCards.length).toBeLessThanOrEqual(1);
    });
  });
  
  describe('glass enhancement scoring integration', () => {
    it('should apply glass bonus before breaking', () => {
      const glassCard = createCoin('♠', 'A', 'glass');
      const normalCard = createCoin('♥', 'K');
      const cards = [glassCard, normalCard];
      
      const evaluatedHand: EvaluatedHand = {
        handType: { name: 'Pair', rank: 2, baseChips: 10, baseMult: 2 },
        scoringCards: cards,
        kickers: [],
      };
      
      const baseChipMult = calculateBaseChipMult(evaluatedHand, null);
      const effects = getCoinEnhancementEffects(cards);
      const finalScore = calculateFinalScore(baseChipMult, effects);
      
      // Base: (10 + 11 + 10) * 2 = 31 * 2 = 62
      // With glass x2 multiplier: 31 * (2 * 2) = 31 * 4 = 124
      expect(finalScore).toBe(124);
    });
  });
});