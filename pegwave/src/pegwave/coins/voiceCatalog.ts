export interface VoiceCoin {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly color: string;
  readonly mass: number;
  readonly restitutionScale: number;
}

const STANDARD_VOICE: VoiceCoin = {
  id: 'voice-standard',
  name: 'Standard Voice',
  description: 'Balanced drop — default coin.',
  color: '#ffd166',
  mass: 1,
  restitutionScale: 1,
};

export const VOICE_CATALOG: ReadonlyArray<VoiceCoin> = [
  STANDARD_VOICE,
  {
    id: 'voice-heavy',
    name: 'Heavy Slug',
    description: 'More mass, deeper impacts.',
    color: '#b8860b',
    mass: 1.6,
    restitutionScale: 0.85,
  },
  {
    id: 'voice-light',
    name: 'Feather',
    description: 'Floaty, long air time.',
    color: '#f5f5dc',
    mass: 0.65,
    restitutionScale: 1.1,
  },
  {
    id: 'voice-glass',
    name: 'Glass Orb',
    description: 'Bright, pingy collisions.',
    color: '#a8e6ff',
    mass: 0.9,
    restitutionScale: 1.25,
  },
];

export function getVoiceCoin(id: string): VoiceCoin {
  return VOICE_CATALOG.find((v) => v.id === id) ?? STANDARD_VOICE;
}
