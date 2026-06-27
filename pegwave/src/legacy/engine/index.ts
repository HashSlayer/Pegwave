// Engine: reusable, content-agnostic foundations for the game.
export type { Identifiable, RandomNumberGenerator } from './registry.ts';
export {
  Registry,
  DuplicateRegistrationError,
  UnknownIdError,
} from './registry.ts';
