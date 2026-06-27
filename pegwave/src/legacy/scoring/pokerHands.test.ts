import { describe, test, expect } from 'bun:test';
import { evaluatePokerHand, getPokerHandByName } from './pokerHands.ts';
import { createCoin, getCoinChipValue } from '../coins/index.ts';
import type { Coin } from '../coins/index.ts';

describe('pokerHands', () => {
  describe('getCoinChipValue', () => {
    test('should return face value for number cards', () => {
      expect(getCoinChipValue(createCoin('♠', '2'))).toBe(2);
      expect(getCoinChipValue(createCoin('♠', '5'))).toBe(5);
      expect(getCoinChipValue(createCoin('♠', '9'))).toBe(9);
      expect(getCoinChipValue(createCoin('♠', '10'))).toBe(10);
    });

    test('should return 10 for face cards', () => {
      expect(getCoinChipValue(createCoin('♠', 'J'))).toBe(10);
      expect(getCoinChipValue(createCoin('♠', 'Q'))).toBe(10);
      expect(getCoinChipValue(createCoin('♠', 'K'))).toBe(10);
    });

    test('should return 11 for aces', () => {
      expect(getCoinChipValue(createCoin('♠', 'A'))).toBe(11);
    });
  });

  describe('evaluatePokerHand', () => {
    test('should detect royal flush', () => {
      const cards: ReadonlyArray<Coin> = [
        createCoin('♠', 'A'),
        createCoin('♠', 'K'),
        createCoin('♠', 'Q'),
        createCoin('♠', 'J'),
        createCoin('♠', '10'),
      ];
      
      const result = evaluatePokerHand(cards);
      expect(result.handType.name).toBe('Royal Flush');
      expect(result.scoringCards.length).toBe(5);
    });

    test('should detect straight flush', () => {
      const cards = [
        createCoin('♥', '9'),
        createCoin('♥', '8'),
        createCoin('♥', '7'),
        createCoin('♥', '6'),
        createCoin('♥', '5'),
      ];
      
      const result = evaluatePokerHand(cards);
      expect(result.handType.name).toBe('Straight Flush');
    });

    test('should detect four of a kind', () => {
      const cards = [
        createCoin('♠', 'K'),
        createCoin('♥', 'K'),
        createCoin('♦', 'K'),
        createCoin('♣', 'K'),
        createCoin('♠', '2'),
      ];
      
      const result = evaluatePokerHand(cards);
      expect(result.handType.name).toBe('Four of a Kind');
      expect(result.scoringCards.length).toBe(4);
    });

    test('should detect full house', () => {
      const cards = [
        createCoin('♠', 'K'),
        createCoin('♥', 'K'),
        createCoin('♦', 'K'),
        createCoin('♣', '2'),
        createCoin('♠', '2'),
      ];
      
      const result = evaluatePokerHand(cards);
      expect(result.handType.name).toBe('Full House');
      expect(result.scoringCards.length).toBe(5);
    });

    test('should detect flush', () => {
      const cards = [
        createCoin('♦', 'K'),
        createCoin('♦', '10'),
        createCoin('♦', '7'),
        createCoin('♦', '4'),
        createCoin('♦', '2'),
      ];
      
      const result = evaluatePokerHand(cards);
      expect(result.handType.name).toBe('Flush');
      expect(result.scoringCards.length).toBe(5);
    });

    test('should detect straight', () => {
      const cards = [
        createCoin('♠', '6'),
        createCoin('♥', '5'),
        createCoin('♦', '4'),
        createCoin('♣', '3'),
        createCoin('♠', '2'),
      ];
      
      const result = evaluatePokerHand(cards);
      expect(result.handType.name).toBe('Straight');
      expect(result.scoringCards.length).toBe(5);
    });

    test('should detect three of a kind', () => {
      const cards = [
        createCoin('♠', 'K'),
        createCoin('♥', 'K'),
        createCoin('♦', 'K'),
        createCoin('♣', '5'),
        createCoin('♠', '2'),
      ];
      
      const result = evaluatePokerHand(cards);
      expect(result.handType.name).toBe('Three of a Kind');
      expect(result.scoringCards.length).toBe(3);
    });

    test('should detect two pair', () => {
      const cards = [
        createCoin('♠', 'K'),
        createCoin('♥', 'K'),
        createCoin('♦', '5'),
        createCoin('♣', '5'),
        createCoin('♠', '2'),
      ];
      
      const result = evaluatePokerHand(cards);
      expect(result.handType.name).toBe('Two Pair');
      expect(result.scoringCards.length).toBe(4);
    });

    test('should detect pair', () => {
      const cards = [
        createCoin('♠', 'K'),
        createCoin('♥', 'K'),
        createCoin('♦', '7'),
        createCoin('♣', '5'),
        createCoin('♠', '2'),
      ];
      
      const result = evaluatePokerHand(cards);
      expect(result.handType.name).toBe('Pair');
      expect(result.scoringCards.length).toBe(2);
    });

    test('should detect high card', () => {
      const cards = [
        createCoin('♠', 'K'),
        createCoin('♥', '10'),
        createCoin('♦', '7'),
        createCoin('♣', '5'),
        createCoin('♠', '2'),
      ];
      
      const result = evaluatePokerHand(cards);
      expect(result.handType.name).toBe('High Coin');
      expect(result.scoringCards.length).toBe(1);
      const firstCard = result.scoringCards[0];
      expect(firstCard?.rank).toBe('K');
    });

    test('should handle less than 5 cards', () => {
      const cards = [
        createCoin('♠', 'K'),
        createCoin('♥', 'K'),
        createCoin('♦', '7'),
      ];
      
      const result = evaluatePokerHand(cards);
      expect(result.handType.name).toBe('Pair');
    });

    test('should handle ace-low straight', () => {
      const cards = [
        createCoin('♠', 'A'),
        createCoin('♥', '2'),
        createCoin('♦', '3'),
        createCoin('♣', '4'),
        createCoin('♠', '5'),
      ];
      
      const result = evaluatePokerHand(cards);
      expect(result.handType.name).toBe('Straight');
      expect(result.scoringCards.length).toBe(5);
    });
  });

  describe('getPokerHandByName', () => {
    test('returns correct hand type', () => {
      const flush = getPokerHandByName('Flush');
      expect(flush?.name).toBe('Flush');
      expect(flush?.baseChips).toBe(35);
      expect(flush?.baseMult).toBe(4);
    });

    test('returns undefined for invalid name', () => {
      const result = getPokerHandByName('Invalid Hand');
      expect(result).toBeUndefined();
    });
  });
});