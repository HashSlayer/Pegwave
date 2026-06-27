# Pegwave game module

The live Plinko synth roguelike. Everything reachable from the main menu lives here.

## File map

| File | Purpose |
|------|---------|
| `runState.ts` | Run state + pure section/LFO transitions |
| `sections.ts` | Verse, Chorus, Drop + boss Fault definitions |
| `faults.ts` | Gain scoring rules under an active Fault |
| `lfo.ts` | LFO math for peg sway and pitch |
| `saveRun.ts` | localStorage persistence |
| `GameCanvas.tsx` | Canvas physics + HUD |
| `RackPanel.tsx` | Peg/coin rack sidebar |
| `MainMenuView.tsx` | Title screen |
| `SectionSelectView.tsx` | Section picker (skip Verse/Chorus) |
| `pegs/pegCatalog.ts` | Peg type definitions |
| `coins/voiceCatalog.ts` | Voice coin physics properties |
| `planetPlinko.ts` | Planet reverb presets |
| `index.ts` | Public API for `ui/App.tsx` only |

## Data flow (playing scene)

```
GameCanvas sim tick
  → peg collision
  → audio/noteCore.collisionToNote (quantize pitch + time)
  → audio/synth.playNote (Web Audio)
  → faults.collisionScoresGain → runState.withSectionGain
```

Import sibling modules directly (e.g. `./faults.ts`). Use `index.ts` only for exports consumed outside this folder.
