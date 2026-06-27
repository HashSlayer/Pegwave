# Pegwave Architecture

Pegwave is a Plinko synth roguelike. The **live game** is a small, self-contained stack. A larger **legacy poker scaffold** (Balatro-style) is kept under `src/legacy/` for future modifier/draft wiring — it is not loaded at startup.

## Boot flow

```
index.html
  └─ src/index.tsx          Bootstrap, mount React
       └─ src/ui/App.tsx    Scene router (menu → section select → canvas)
            ├─ pegwave/     Game logic + canvas
            ├─ statistics/  Menu stats overlay (schema still legacy poker)
            └─ sound/       UI button/SFX (separate from collision synth)
```

## Active modules (`src/`)

| Folder | Role |
|--------|------|
| `pegwave/` | Run state, sections, faults, LFO, save/load, canvas, rack UI |
| `audio/` | Pure collision→note quantizer (`noteCore`) + Web Audio adapter (`synth`) |
| `ui/` | `App.tsx` scene router; shared CSS animations |
| `sound/` | UI sound effects (MP3 placeholders), settings modal |
| `statistics/` | localStorage stats; currently tracks poker-era fields |

### Pegwave internals

| File | Responsibility |
|------|----------------|
| `runState.ts` | `PegwaveRunState` + pure transitions (start/complete/skip section, LFO updates) |
| `sections.ts` | Verse / Chorus / Drop definitions + random boss Fault pool |
| `faults.ts` | Which collisions count toward Gain under an active Fault |
| `lfo.ts` | LFO value from params + time (drives peg sway + pitch) |
| `saveRun.ts` | localStorage key `pegwave-save`, v1→v2 migration |
| `GameCanvas.tsx` | Physics sim, peg placement, collision → `noteCore` → `synth` |
| `RackPanel.tsx` | Sidebar: peg/coin/wire catalog |
| `MainMenuView.tsx` | New run / continue / statistics |
| `SectionSelectView.tsx` | Pick section, skip Verse/Chorus |
| `pegs/pegCatalog.ts` | Peg types (tone, bumper, gate, planet) |
| `coins/voiceCatalog.ts` | Voice coin physics (mass, bounce, color) |
| `planetPlinko.ts` | Planet reverb environments shared with synth |

### Audio split (intentional)

- **`audio/`** — collision synth: every peg hit becomes a quantized note. `noteCore.ts` is pure and VST-portable; `synth.ts` is the impure Web Audio layer.
- **`sound/`** — menu/UI clicks and win jingles. Not related to peg collisions.

## Legacy scaffold (`src/legacy/`)

Unreachable from `App.tsx`. Preserved with tests for future roguelike layers (jokers, shop, poker hands, blinds).

| Folder | Role |
|--------|------|
| `game/` | Poker run + round state machines |
| `round/` | Round UI containers and hooks |
| `shop/` | Joker definitions (~90+), shop UI, card packs |
| `blinds/` | Small/big/boss blinds + boss effects |
| `coins/` | Playing-card deck model (rank/suit — not voice coins) |
| `scoring/` | Poker hand evaluation + chip×mult scoring |
| `consumables/` | Spectral/arcana/planet card effects |
| `content/` | Boot-time joker registration (`registerAllContent`) |
| `engine/` | Generic content `Registry<T>` |
| `utils/` | Shared helpers for legacy scoring |

To wire legacy back in: import from `legacy/`, add scenes to `App.tsx`, and call `registerAllContent()` from `legacy/content` at boot if jokers are needed.

## Adding features (checklist)

1. **New peg/coin type** — extend `pegs/pegCatalog.ts` or `coins/voiceCatalog.ts`, handle in `GameCanvas.tsx` collision path.
2. **New section or fault** — extend `sections.ts` + `faults.ts`, update `runState.ts` transitions.
3. **New sound behavior** — quantizer rules in `audio/noteCore.ts`; rendering in `audio/synth.ts`.
4. **New menu scene** — add a scene to `App.tsx` and a view under `pegwave/` or `ui/`.
5. **Roguelike modifier** — prefer pulling from `legacy/shop/joker.ts` rather than duplicating systems.

## Persistence

| Key | Module | Format |
|-----|--------|--------|
| `pegwave-save` | `pegwave/saveRun.ts` | Active Pegwave run |
| `pegwave-statistics` | `statistics/statisticsStorage.ts` | Legacy poker stats schema |

## Tests

`bun test` runs Bun's test runner. Legacy domain logic has extensive coverage under `src/legacy/**/*.test.ts`. Active pegwave modules can add tests alongside their `.ts` files.
