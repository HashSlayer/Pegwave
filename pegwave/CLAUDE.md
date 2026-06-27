# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pegwave** — a Plinko synth roguelike. Built with:
- **Bun** as the JavaScript runtime and bundler
- **TypeScript** with maximum strictness settings
- **React 19** for UI components
- **ESLint** configured to prohibit `any` types and type assertions

## Commands

### Development
- `bun run dev` - Start development server with hot reload
- `bun run build` - Build for production
- `bun run lint` - Run ESLint checks
- `bun run typecheck` - Run TypeScript type checking
- `bun run test` - Run unit tests
- `bun run knip` - Check for unused files, dependencies, and exports
- `bun run check` - Run all checks (lint, typecheck, tests, and knip) - also runs as pre-commit hook
- `bun run autofix` - Automatically fix linting issues and remove unused exports

### Package Management
Use `bun add` for adding dependencies (not npm or yarn).

## Code Standards

### UI and Logic Architecture
- Separate UI and logic
- Maximize pure functions
- Always check exhaustiveness using switch statement when branching on sum types
- Use presentation components with no logic and container components

### TypeScript Requirements
- **NO `any` types allowed** - ESLint will error
- **NO type assertions allowed** - Use proper typing and discriminated unions
- **NO type guards** - Use discriminated unions and exhaustive pattern matching instead
- **All strict checks enabled** including:
  - `noUncheckedIndexedAccess`
  - `exactOptionalPropertyTypes`
  - `noImplicitReturns`
  - All function parameters and return types must be explicit

### Array Access Pattern
- **Don't check length before accessing array elements**
- Instead of `if (array.length > 0) { const first = array[0]; ... }`
- Use: `const first = array[0]; if (first !== undefined) { ... }`
- This preserves type information about non-empty arrays and eliminates redundant checks

### Import Rules
- Use `import type` for type-only imports (enforced by `verbatimModuleSyntax`)
- Use `.ts` extensions in import paths
- **Always import from module directories, not specific files** (e.g., `import { Card } from '../cards'` not `from '../cards/card.ts'`)
- Each module should have an `index.ts` that exports its public API

## Architecture

See **`docs/ARCHITECTURE.md`** and per-folder `README.md` files under `src/`.

### Directory structure (active)

```
src/
├── index.tsx          # Bootstrap
├── ui/App.tsx         # Scene router
├── pegwave/           # Live Plinko game (canvas, run state, sections)
├── audio/             # Collision synth (pure noteCore + Web Audio synth)
├── sound/             # UI SFX
├── statistics/        # Menu stats overlay
└── legacy/            # Poker roguelike scaffold (not loaded at startup)
    ├── game/
    ├── round/
    ├── shop/
    ├── blinds/
    ├── coins/         # Playing cards — NOT pegwave voice coins
    ├── scoring/
    ├── consumables/
    ├── content/
    └── engine/
```

### Component patterns (pegwave)
- **Pure functions** for run state, faults, sections, LFO, and audio quantizer
- **GameCanvas.tsx** owns simulation + React HUD; domain logic stays in sibling `.ts` files
- **Exhaustiveness checking** via switch on discriminated unions (Fault types, section slots)

## Testing
- Use Bun's built-in test runner: `bun test`
- **ALWAYS run tests before committing** to ensure code quality
- Write tests for all domain logic (pure functions)
- Test file naming: `<module>.test.ts`

## Git Workflow
- The pre-commit hook will automatically run `bun run check` (lint, typecheck, and tests)
- You can manually run `bun run check` to verify everything passes
- When completing sub-tasks, commit changes after passing tests and linter before proceeding to the next task
