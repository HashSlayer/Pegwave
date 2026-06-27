import { defineJoker, type Joker } from '../shop/joker.ts';

/**
 * Example of adding content "over time" without editing the core systems.
 *
 * Each entry uses {@link defineJoker} for full type-checking and reuses an
 * existing effect kind, so no scoring code needs to change. These are
 * registered into the shared `jokerRegistry` from `content/index.ts`, after
 * which they automatically appear in the shop and in random draws.
 *
 * To add a brand-new joker, append a `defineJoker({ ... })` entry here. To add
 * a new *behavior*, add one case to the effect switch in `shop/joker.ts`
 * (the linter will tell you exactly where).
 */
export const HOUSE_JOKERS: ReadonlyArray<Joker> = [
  defineJoker({
    id: 'house-high-roller',
    name: 'High Roller',
    description: 'Played Aces give +25 Chips and +5 Mult',
    rarity: 'uncommon',
    type: 'chipsAndMultPerRank',
    rank: 'A',
    chips: 25,
    mult: 5,
  }),
  defineJoker({
    id: 'house-clover',
    name: 'Lucky Clover',
    description: 'x1.5 Mult if every played card shares one suit',
    rarity: 'rare',
    type: 'multIfAllSameSuit',
    mult: 1.5,
  }),
  defineJoker({
    id: 'house-night-owl',
    name: 'Night Owl',
    description: 'Played cards with an odd rank give +18 Chips each',
    rarity: 'common',
    type: 'chipsForOddRanks',
    chips: 18,
  }),
];
