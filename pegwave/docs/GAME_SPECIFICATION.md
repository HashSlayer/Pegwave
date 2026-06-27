# Pegwave Game Specification

## Overview

A Plinko / coin-pusher synth roguelike. Drop **Voices** through a rack of pegs
that sway on a **Mother LFO**. Collisions emit quantized notes; resonance (gain)
must reach a threshold to clear each section.

## Run structure

- **Track** — difficulty tier (was ante)
- **Sections per track** — Verse → Chorus → The Drop (boss)
- **Faults** — boss modifiers that restrict which hits score (waveform, pin row, scale degree)

See [README.md](../README.md) for the current playable loop and fault list.

## Core systems

| System | Location |
|--------|----------|
| Plinko field + LFO tuning | `src/pegwave/GameCanvas.tsx` |
| Section / fault defs | `src/pegwave/sections.ts`, `faults.ts` |
| Note quantizer (VST3-portable) | `src/audio/noteCore.ts` |
| Run save | `src/pegwave/saveRun.ts` |

## Legacy scaffold

Poker-hand scoring, jokers, shop, and card UI remain in `src/` for future
modifier/draft wiring but are not routed from the main menu.
