import type { PlanetId } from '../planetPlinko.ts';

export type PegKind = 'tone' | 'bumper' | 'gate' | 'planetPlinko';

export interface PegDefinition {
  readonly id: string;
  readonly name: string;
  readonly kind: PegKind;
  readonly description: string;
  readonly color: string;
  readonly planetId?: PlanetId;
  readonly restitution?: number;
}

export const PEG_CATALOG: ReadonlyArray<PegDefinition> = [
  {
    id: 'peg-tone-root',
    name: 'Root Pin',
    kind: 'tone',
    description: 'Tonic lane — strong signal on hit.',
    color: '#3b6ea5',
  },
  {
    id: 'peg-tone-fifth',
    name: 'Fifth Pin',
    kind: 'tone',
    description: 'Perfect fifth row — consonant chains.',
    color: '#4a8fd4',
  },
  {
    id: 'peg-bumper',
    name: 'Bumper',
    kind: 'bumper',
    description: 'High bounce — ricochet engine.',
    color: '#9b59b6',
    restitution: 0.92,
  },
  {
    id: 'peg-gate',
    name: 'Gate Pin',
    kind: 'gate',
    description: 'Only fires on the tempo grid.',
    color: '#e67e22',
  },
  {
    id: 'peg-planet-earth',
    name: 'Earth Plinko',
    kind: 'planetPlinko',
    description: 'Roomy terrestrial echo.',
    color: '#2ecc71',
    planetId: 'earth',
  },
  {
    id: 'peg-planet-mars',
    name: 'Mars Plinko',
    kind: 'planetPlinko',
    description: 'Thin Martian canyon tail.',
    color: '#c0392b',
    planetId: 'mars',
  },
  {
    id: 'peg-planet-jupiter',
    name: 'Jupiter Plinko',
    kind: 'planetPlinko',
    description: 'Deep gas-giant swell.',
    color: '#d4a574',
    planetId: 'jupiter',
  },
  {
    id: 'peg-planet-neptune',
    name: 'Neptune Plinko',
    kind: 'planetPlinko',
    description: 'Dark oceanic decay.',
    color: '#2980b9',
    planetId: 'neptune',
  },
];

export function getPegDefinition(id: string): PegDefinition | undefined {
  return PEG_CATALOG.find((p) => p.id === id);
}
