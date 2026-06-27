# Statistics

Menu statistics overlay. Schema and updaters currently live in `../legacy/game/statistics.ts` (poker-era: hands played, antes, jokers).

Only `trackGameStart()` is called from the live game today. To track Pegwave-specific stats (tracks cleared, faults beaten, best gain), extend or replace the schema here rather than in legacy.
