import { nanoid } from 'nanoid';
import type { PlanetPlinko, PlanetId } from '../../pegwave/planetPlinko.ts';
import { PLANET_PLINKOS, getPlanetPlinko } from '../../pegwave/planetPlinko.ts';

export type { PlanetPlinko, PlanetId, PlanetReverbEnv } from '../../pegwave/planetPlinko.ts';
export { PLANET_PLINKOS, getPlanetPlinko } from '../../pegwave/planetPlinko.ts';

/** Legacy consumable slot — now a Planet Plinko ambience card. */
export interface PlanetPlinkoCard {
  readonly id: string;
  readonly type: 'planetPlinko';
  readonly name: string;
  readonly planetId: PlanetId;
  readonly description: string;
}

function createPlanetPlinkoCard(planet: PlanetPlinko): PlanetPlinkoCard {
  return {
    id: nanoid(),
    type: 'planetPlinko',
    name: `${planet.name} Plinko`,
    planetId: planet.id,
    description: `${planet.description} Reverb: ${planet.reverb.ambience}.`,
  };
}

export function getRandomPlanetPlinkos(count: number): ReadonlyArray<PlanetPlinkoCard> {
  return Array.from({ length: count }, () => {
    const index = Math.floor(Math.random() * PLANET_PLINKOS.length);
    const id: PlanetId = PLANET_PLINKOS[index]?.id ?? 'earth';
    return createPlanetPlinkoCard(getPlanetPlinko(id));
  });
}
