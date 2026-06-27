# Pegwave

A Plinko / coin-pusher synth roguelike. Drop Voices through a rack of oscillating pegs; every collision composes a quantized track while you tune the Mother LFO live.

## Play locally

```bash
bun install
bun run dev
```

Open the URL shown in the terminal (default `http://localhost:3000/`).

- **New Run** — start Track 1 at the Verse section select screen.
- **Continue Run** — resume mid-section (field) or between sections (select screen).

## Run structure

Each **track** has three sections (like blinds):

| Section | Role | Scoring |
|---------|------|---------|
| **Verse** | Warm-up | All pin rows score |
| **Chorus** | Higher resonance bar | All rows score |
| **The Drop** | Boss | A random **Fault** restricts what scores |

**Faults** (boss modifiers) — notes always play, but only qualifying hits add Gain:

- **Waveform locks** — e.g. only sine/saw scores; square forbidden
- **Row lanes** — only top/middle/bottom pin rows score (rows = tone lanes)
- **Degree rows** — only root & fifth (or triad) rows score

Skip Verse/Chorus like blinds; The Drop cannot be skipped.

## Project layout

See **`docs/ARCHITECTURE.md`** for the full map. Quick reference:

| Path | Role |
|------|------|
| `src/pegwave/` | Live game — canvas, run state, sections, faults, rack |
| `src/audio/` | Collision synth (`noteCore` pure + `synth` Web Audio) |
| `src/ui/App.tsx` | Scene router (menu → section select → playing) |
| `src/sound/` | UI sound effects (not peg collisions) |
| `src/statistics/` | Stats overlay |
| `src/legacy/` | Poker roguelike scaffold — not wired to menu; kept for future modifiers |

Each active folder has a `README.md` with module-level notes.

## Scripts

- `bun run dev` — development server
- `bun run check` — lint, typecheck, tests
