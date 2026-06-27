/** Portable planet ambience — reverb/env data shared by game and future VST3. */

export type PlanetId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

export interface PlanetReverbEnv {
  readonly wet: number;
  readonly decaySeconds: number;
  readonly preDelaySeconds: number;
  readonly lowCutHz: number;
  readonly highCutHz: number;
  readonly ambience: string;
}

export interface PlanetPlinko {
  readonly id: PlanetId;
  readonly name: string;
  readonly description: string;
  readonly reverb: PlanetReverbEnv;
}

const EARTH_PLINKO: PlanetPlinko = {
  id: 'earth',
  name: 'Earth',
  description: 'Balanced air — familiar room bloom.',
  reverb: { wet: 0.28, decaySeconds: 0.9, preDelaySeconds: 0.018, lowCutHz: 80, highCutHz: 12000, ambience: 'open sky warmth' },
};

export const PLANET_PLINKOS: ReadonlyArray<PlanetPlinko> = [
  {
    id: 'mercury',
    name: 'Mercury',
    description: 'Bare rock — dry, brittle reflections.',
    reverb: { wet: 0.12, decaySeconds: 0.35, preDelaySeconds: 0.008, lowCutHz: 200, highCutHz: 6000, ambience: 'sun-scorched silence' },
  },
  {
    id: 'venus',
    name: 'Venus',
    description: 'Thick CO₂ shell — muffled, oppressive tail.',
    reverb: { wet: 0.55, decaySeconds: 1.8, preDelaySeconds: 0.04, lowCutHz: 120, highCutHz: 2800, ambience: 'pressure-dome haze' },
  },
  EARTH_PLINKO,
  {
    id: 'mars',
    name: 'Mars',
    description: 'Thin dust — distant, hollow echoes.',
    reverb: { wet: 0.22, decaySeconds: 1.4, preDelaySeconds: 0.03, lowCutHz: 150, highCutHz: 5000, ambience: 'red canyon wind' },
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    description: 'Gas giant depth — massive slow swell.',
    reverb: { wet: 0.48, decaySeconds: 2.6, preDelaySeconds: 0.06, lowCutHz: 60, highCutHz: 4000, ambience: 'storm-layer rumble' },
  },
  {
    id: 'saturn',
    name: 'Saturn',
    description: 'Ring scatter — shimmer and long pre-delay.',
    reverb: { wet: 0.42, decaySeconds: 2.2, preDelaySeconds: 0.09, lowCutHz: 100, highCutHz: 9000, ambience: 'ice-ring flutter' },
  },
  {
    id: 'uranus',
    name: 'Uranus',
    description: 'Cold tilt — icy, narrow bandwidth.',
    reverb: { wet: 0.35, decaySeconds: 1.6, preDelaySeconds: 0.05, lowCutHz: 180, highCutHz: 4500, ambience: 'methane frost' },
  },
  {
    id: 'neptune',
    name: 'Neptune',
    description: 'Deep oceanic void — dark wet tail.',
    reverb: { wet: 0.52, decaySeconds: 3.0, preDelaySeconds: 0.07, lowCutHz: 70, highCutHz: 3500, ambience: 'supersonic abyss' },
  },
];

export function getPlanetPlinko(id: PlanetId): PlanetPlinko {
  return PLANET_PLINKOS.find((p) => p.id === id) ?? EARTH_PLINKO;
}
