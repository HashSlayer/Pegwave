import type { Coin } from './coin.ts';
import { createStandardDeck, shuffleDeck } from './coin.ts';

export interface DrawPile {
  readonly cards: ReadonlyArray<Coin>;
  readonly discardPile: ReadonlyArray<Coin>;
}

export function createDrawPile(cards?: ReadonlyArray<Coin>): DrawPile {
  return {
    cards: shuffleDeck(cards ?? createStandardDeck()),
    discardPile: [],
  };
}

export function drawCards(
  pile: DrawPile,
  count: number
): [ReadonlyArray<Coin>, DrawPile] {
  return count <= 0
    ? [[], pile]
    : drawCardsRecursive(pile, count, []);
}

function drawFromMainPile(
  pile: DrawPile,
  remaining: number,
  drawnSoFar: ReadonlyArray<Coin>,
  firstCard: Coin
): [ReadonlyArray<Coin>, DrawPile] {
  return drawCardsRecursive(
    { cards: pile.cards.slice(1), discardPile: pile.discardPile },
    remaining - 1,
    [...drawnSoFar, firstCard]
  );
}

function reshuffleDiscardAndDraw(
  pile: DrawPile,
  remaining: number,
  drawnSoFar: ReadonlyArray<Coin>
): [ReadonlyArray<Coin>, DrawPile] {
  return drawCardsRecursive(
    { cards: shuffleDeck(pile.discardPile), discardPile: [] },
    remaining,
    drawnSoFar
  );
}

function drawCardsRecursive(
  pile: DrawPile,
  remaining: number,
  drawnSoFar: ReadonlyArray<Coin>
): [ReadonlyArray<Coin>, DrawPile] {
  const firstCard = pile.cards[0];
  const firstDiscardCard = pile.discardPile[0];
  
  return remaining === 0
    ? [drawnSoFar, pile]
    : firstCard !== undefined
    ? drawFromMainPile(pile, remaining, drawnSoFar, firstCard)
    : firstDiscardCard !== undefined
    ? reshuffleDiscardAndDraw(pile, remaining, drawnSoFar)
    : [drawnSoFar, pile];
}

export function discardCards(
  pile: DrawPile,
  cards: ReadonlyArray<Coin>
): DrawPile {
  return {
    cards: pile.cards,
    discardPile: [...pile.discardPile, ...cards],
  };
}

export function addToDiscardPile(pile: DrawPile, cards: ReadonlyArray<Coin>): DrawPile {
  return discardCards(pile, cards);
}

function reshuffleDiscardIntoDraw(pile: DrawPile): DrawPile {
  return {
    cards: [...pile.cards, ...shuffleDeck(pile.discardPile)],
    discardPile: [],
  };
}

export function reshuffleIfNeeded(pile: DrawPile, neededCards: number): DrawPile {
  return pile.cards.length >= neededCards
    ? pile
    : pile.discardPile.length > 0
    ? reshuffleDiscardIntoDraw(pile)
    : pile;
}