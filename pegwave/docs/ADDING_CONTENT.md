# Adding & Editing Game Content (legacy)

This guide covers the **legacy poker roguelike content registry** under `src/legacy/`. It is not loaded by the live Pegwave menu unless you wire it back in (see `src/legacy/README.md`).

## The big picture

- `src/legacy/engine/registry.ts` — generic `Registry<T>` for id'd content
- `src/legacy/shop/joker.ts` — `Joker` type, built-in `JOKERS`, `jokerRegistry`, `defineJoker`
- `src/legacy/content/` — add-on jokers; call `registerAllContent()` from `src/index.tsx` to load at boot

```
engine/Registry  ◄── seeded with built-ins ──  shop/joker.ts (JOKERS)
       ▲                                                ▲
       │ register(...) more at load time               │ used by shop + random draws
       └──────────── content/ (house jokers, packs, mods) ──────────────┘
```

## Add a new joker (most common task)

If your joker uses an **existing effect kind**, it is a one-file change.

1. Open `src/legacy/content/houseJokers.ts`.
2. Append a `defineJoker({ ... })` entry:

```ts
defineJoker({
  id: 'house-my-joker',          // must be unique
  name: 'My Joker',
  description: '+50 Chips if hand contains a Flush',
  rarity: 'uncommon',
  type: 'multIfContains',         // an existing effect kind
  handType: 'flush',
  amount: 50,
}),
```

That's it — it now appears in the shop and in random draws. No core edits.

## Add a brand-new effect *behavior*

If no existing effect kind does what you want:

1. Add a variant to the `JokerEffect` union in `src/legacy/shop/joker.ts`.
2. Add the matching `case` to the `evaluateJokerEffect` switch.

The linter enforces exhaustive switches (`switch-exhaustiveness-check`), so it
will point you to exactly where the new case is required.

## Register content from a new module (content packs / mods)

1. Create `src/legacy/content/myPack.ts` exporting an array of `defineJoker(...)`.
2. Register it from `src/legacy/content/index.ts`:

```ts
import { MY_PACK } from './myPack.ts';
// inside registerAllContent():
jokerRegistry.registerAll(MY_PACK);
```

3. Call `registerAllContent()` in `src/index.tsx` before render.

## Reuse the registry for other content types

The same `Registry<T>` powers any id'd content. For consumables or bosses:

```ts
import { Registry } from '../engine';
export const consumableRegistry = new Registry<Consumable>('consumable');
```

## Coding-style notes

Non-test `.ts` files follow the project's functional lint rules: no `let`, no
bare `if` guards (use ternaries or exhaustive switches), and functions must
return a value (no `void`). UI (`.tsx`) files are exempt from these specific rules.

For the **live Pegwave game** (pegs, voices, faults), see `docs/ARCHITECTURE.md`.
