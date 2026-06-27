/**
 * Generic content registry.
 *
 * This is the backbone of the game's "dynamic foundation": every kind of
 * game content (jokers, consumables, bosses, card enhancements, ...) is
 * registered into a `Registry` instead of being hard-coded into one central
 * list. Adding new content over time means registering a new definition from
 * anywhere — no existing wiring needs to change.
 *
 * The registry is class-based so it can own its registration state and expose
 * a small, discoverable, chainable API. It is written in the project's
 * single-return / no-`let` style: methods either return a value or return
 * `this` for chaining, so they stay compatible with the functional lint rules.
 * The content *definitions* it holds remain deeply immutable.
 */

export interface Identifiable {
  readonly id: string;
}

export type RandomNumberGenerator = () => number;

interface WeightedScan<T> {
  readonly acc: number;
  readonly found: T | undefined;
}

export class DuplicateRegistrationError extends Error {
  constructor(id: string) {
    super(`Registry already contains an item with id "${id}".`);
    this.name = 'DuplicateRegistrationError';
  }
}

export class UnknownIdError extends Error {
  constructor(id: string) {
    super(`Registry has no item with id "${id}".`);
    this.name = 'UnknownIdError';
  }
}

export class Registry<T extends Identifiable> {
  private readonly items = new Map<string, T>();

  /** A human-readable label used in error messages and tooling. */
  constructor(public readonly label: string = 'content') {}

  /** Register a single definition. Throws if the id is already taken. */
  register(item: T): this {
    return this.items.has(item.id) ? failDuplicate(item.id) : this.store(item);
  }

  /** Register many definitions at once. */
  registerAll(items: Iterable<T>): this {
    for (const item of items) {
      this.register(item);
    }
    return this;
  }

  /**
   * Register or replace an existing definition. Useful for mods / overrides
   * and for hot-reloading content during development.
   */
  upsert(item: T): this {
    this.items.set(item.id, item);
    return this;
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  /** Like {@link get} but throws when the id is unknown. */
  getOrThrow(id: string): T {
    const item = this.items.get(id);
    return item === undefined ? failUnknown(id) : item;
  }

  /** Remove a definition. Returns true if something was removed. */
  unregister(id: string): boolean {
    return this.items.delete(id);
  }

  clear(): this {
    this.items.clear();
    return this;
  }

  get size(): number {
    return this.items.size;
  }

  /** All registered definitions, in insertion order. */
  all(): ReadonlyArray<T> {
    return Array.from(this.items.values());
  }

  ids(): ReadonlyArray<string> {
    return Array.from(this.items.keys());
  }

  /** All definitions matching a predicate. */
  filter(predicate: (item: T) => boolean): ReadonlyArray<T> {
    return this.all().filter(predicate);
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.all().find(predicate);
  }

  /** Pick a uniformly random definition (optionally restricted by predicate). */
  pickRandom(
    predicate?: (item: T) => boolean,
    rng: RandomNumberGenerator = Math.random,
  ): T | undefined {
    const pool = predicate === undefined ? this.all() : this.filter(predicate);
    const index = Math.floor(rng() * pool.length);
    return pool.length === 0 ? undefined : pool[Math.min(index, pool.length - 1)];
  }

  /**
   * Pick a definition using per-item weights. Items with a non-positive
   * weight are ignored. Returns undefined when nothing is eligible.
   */
  pickWeighted(
    weightOf: (item: T) => number,
    rng: RandomNumberGenerator = Math.random,
  ): T | undefined {
    const weighted = this.all()
      .map(item => ({ item, weight: weightOf(item) }))
      .filter(entry => entry.weight > 0);

    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    const target = rng() * total;

    const scan = weighted.reduce<WeightedScan<T>>(
      (state, entry) =>
        state.found !== undefined
          ? state
          : {
              acc: state.acc + entry.weight,
              found: state.acc + entry.weight >= target ? entry.item : undefined,
            },
      { acc: 0, found: undefined },
    );

    return total <= 0 ? undefined : scan.found;
  }

  private store(item: T): this {
    this.items.set(item.id, item);
    return this;
  }
}

function failDuplicate(id: string): never {
  throw new DuplicateRegistrationError(id);
}

function failUnknown(id: string): never {
  throw new UnknownIdError(id);
}
