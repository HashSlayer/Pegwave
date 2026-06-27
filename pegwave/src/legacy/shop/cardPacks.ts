import type { Coin, CoinEnhancement, SpectralCoin, ArcanaCoin } from '../coins';
import { createCoin, SUITS, RANKS, getRandomSpectralCoins, getRandomArcanaCoins } from '../coins';
import type { PlanetPlinkoCard } from '../consumables';
import { getRandomPlanetPlinkos } from '../consumables';
import type { AnyCoin } from '../coins';

function generateStandardPackCards(count: number): ReadonlyArray<AnyCoin> {
  return Array.from({ length: count }, (): Coin => {
    const suitIndex = Math.floor(Math.random() * SUITS.length);
    const rankIndex = Math.floor(Math.random() * RANKS.length);
    const randomSuit = SUITS[suitIndex];
    const randomRank = RANKS[rankIndex];
    
    const enhancements: ReadonlyArray<CoinEnhancement> = ['foil', 'holographic', 'polychrome'];
    const enhancementIndex = Math.floor(Math.random() * enhancements.length);
    const enhancement: CoinEnhancement | undefined = 
      Math.random() < 0.1 && enhancements[enhancementIndex] !== undefined
        ? enhancements[enhancementIndex]
        : undefined;
    return randomSuit !== undefined && randomRank !== undefined
      ? createCoin(randomSuit, randomRank, enhancement)
      : createCoin('♠', 'A');
  });
}

function generateSpectralPackCards(count: number): ReadonlyArray<SpectralCoin> {
  return getRandomSpectralCoins(count);
}

function generateArcanaPackCards(count: number): ReadonlyArray<ArcanaCoin> {
  return getRandomArcanaCoins(count);
}

function generateCelestialPackCards(count: number): ReadonlyArray<PlanetPlinkoCard> {
  return getRandomPlanetPlinkos(count);
}

export function generatePackCards(packType: 'standard' | 'spectral' | 'arcana' | 'celestial', count: number): ReadonlyArray<AnyCoin> {
  switch (packType) {
    case 'standard':
      return generateStandardPackCards(count);
    case 'spectral':
      return generateSpectralPackCards(count);
    case 'arcana':
      return generateArcanaPackCards(count);
    case 'celestial':
      return generateCelestialPackCards(count);
  }
}


