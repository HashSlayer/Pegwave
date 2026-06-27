# Legacy scaffold

Balatro-style poker roguelike code preserved for future Pegwave modifiers (jokers, shop, consumables, blinds). **Not imported by the live game.**

## Layout

- `game/` — run and round state machines
- `round/` — round UI (container, hooks, hand display)
- `shop/` — joker registry and shop UI
- `blinds/` — blind progression and boss effects
- `coins/` — playing cards (rank/suit deck; different from `pegwave/coins/voiceCatalog.ts`)
- `scoring/` — poker hand detection and scoring
- `consumables/` — spectral, arcana, and planet card effects
- `content/` — `registerAllContent()` for mod jokers
- `engine/` — generic content registry
- `utils/` — array helpers used by scoring

## Re-enabling

1. Call `registerAllContent()` from `content/index.ts` in `src/index.tsx` if jokers are needed.
2. Add scenes to `ui/App.tsx` (blind select → round → shop).
3. Adapt naming: legacy "blinds" map conceptually to pegwave "sections"; legacy "coins" are playing cards, not voice coins.

Tests live next to modules (`*.test.ts`) and validate this layer independently.
