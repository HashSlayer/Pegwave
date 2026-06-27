/**
 * Content registration entry point.
 *
 * Importing this module (done once from `src/index.tsx`) registers all
 * add-on content into the shared registries. This is where future content
 * packs / mods get wired in — a single import, no changes to game logic.
 */
import { jokerRegistry } from '../shop/joker.ts';
import { HOUSE_JOKERS } from './houseJokers.ts';

/** Registers all add-on content and returns the total joker count afterwards. */
export function registerAllContent(): number {
  jokerRegistry.registerAll(HOUSE_JOKERS);
  return jokerRegistry.size;
}
