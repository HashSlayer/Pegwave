import type { SpectralCoin, ArcanaCoin } from '../coins/index.ts';
import type { PlanetPlinkoCard } from './planetPlinko.ts';

export type ConsumableCard = SpectralCoin | ArcanaCoin | PlanetPlinkoCard;

export {
  applySpectralEffect,
  applyArcanaEffect,
  applyPlanetPlinkoEffect,
  canUseConsumable,
  getRequiredSelections,
} from './consumableEffects.ts';

export type { PlanetPlinkoCard } from './planetPlinko.ts';
export { getRandomPlanetPlinkos } from './planetPlinko.ts';
