import { describe, test, expect } from 'bun:test';
import { Registry, DuplicateRegistrationError, UnknownIdError } from './registry.ts';

interface TestItem {
  readonly id: string;
  readonly rarity: 'common' | 'rare';
  readonly weight: number;
}

const make = (id: string, rarity: TestItem['rarity'], weight = 1): TestItem => ({
  id,
  rarity,
  weight,
});

describe('Registry', () => {
  test('registers and retrieves items', () => {
    const registry = new Registry<TestItem>('test');
    registry.register(make('a', 'common'));

    expect(registry.has('a')).toBe(true);
    expect(registry.get('a')?.id).toBe('a');
    expect(registry.size).toBe(1);
  });

  test('registerAll adds multiple items in order', () => {
    const registry = new Registry<TestItem>('test');
    registry.registerAll([make('a', 'common'), make('b', 'rare')]);

    expect(registry.ids()).toEqual(['a', 'b']);
    expect(registry.size).toBe(2);
  });

  test('throws on duplicate registration', () => {
    const registry = new Registry<TestItem>('test');
    registry.register(make('a', 'common'));

    expect(() => registry.register(make('a', 'rare'))).toThrow(DuplicateRegistrationError);
  });

  test('upsert replaces an existing item without throwing', () => {
    const registry = new Registry<TestItem>('test');
    registry.register(make('a', 'common'));
    registry.upsert(make('a', 'rare'));

    expect(registry.get('a')?.rarity).toBe('rare');
    expect(registry.size).toBe(1);
  });

  test('getOrThrow throws on unknown id', () => {
    const registry = new Registry<TestItem>('test');
    expect(() => registry.getOrThrow('missing')).toThrow(UnknownIdError);
  });

  test('unregister removes an item', () => {
    const registry = new Registry<TestItem>('test');
    registry.register(make('a', 'common'));

    expect(registry.unregister('a')).toBe(true);
    expect(registry.unregister('a')).toBe(false);
    expect(registry.has('a')).toBe(false);
  });

  test('filter and find work on registered items', () => {
    const registry = new Registry<TestItem>('test');
    registry.registerAll([make('a', 'common'), make('b', 'rare'), make('c', 'rare')]);

    expect(registry.filter(i => i.rarity === 'rare').map(i => i.id)).toEqual(['b', 'c']);
    expect(registry.find(i => i.rarity === 'rare')?.id).toBe('b');
  });

  test('pickRandom respects predicate and rng', () => {
    const registry = new Registry<TestItem>('test');
    registry.registerAll([make('a', 'common'), make('b', 'rare'), make('c', 'rare')]);

    // rng returns 0 -> first eligible item
    expect(registry.pickRandom(i => i.rarity === 'rare', () => 0)?.id).toBe('b');
    // rng near 1 -> last eligible item
    expect(registry.pickRandom(i => i.rarity === 'rare', () => 0.99)?.id).toBe('c');
  });

  test('pickRandom returns undefined when pool is empty', () => {
    const registry = new Registry<TestItem>('test');
    expect(registry.pickRandom()).toBeUndefined();
  });

  test('pickWeighted selects according to weights', () => {
    const registry = new Registry<TestItem>('test');
    registry.registerAll([make('a', 'common', 1), make('b', 'common', 3)]);

    // total weight = 4; roll of 0.1 -> 0.4 lands in first bucket (weight 1)
    expect(registry.pickWeighted(i => i.weight, () => 0.1)?.id).toBe('a');
    // roll of 0.9 -> 3.6 lands in second bucket
    expect(registry.pickWeighted(i => i.weight, () => 0.9)?.id).toBe('b');
  });

  test('pickWeighted ignores non-positive weights', () => {
    const registry = new Registry<TestItem>('test');
    registry.registerAll([make('a', 'common', 0), make('b', 'rare', 5)]);

    expect(registry.pickWeighted(i => i.weight, () => 0.01)?.id).toBe('b');
  });
});
