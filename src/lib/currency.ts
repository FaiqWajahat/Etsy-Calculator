import { CurrencyCode } from '@/types/calculator';
import { SUPPORTED_CURRENCIES } from './constants';

interface CachedRates {
  timestamp: number;
  rates: Record<string, number>; // Base USD
}

let memoryRatesCache: CachedRates | null = null;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour cache

export async function fetchLiveExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (memoryRatesCache && now - memoryRatesCache.timestamp < CACHE_TTL_MS) {
    return memoryRatesCache.rates;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 },
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch exchange rates: ${res.statusText}`);
    }

    const data = await res.json();
    if (data && data.rates) {
      memoryRatesCache = {
        timestamp: now,
        rates: data.rates,
      };
      return data.rates;
    }
  } catch (error) {
    console.warn('Using fallback currency rates due to fetch error:', error);
  }

  // Fallback to static constants
  const fallbackRates: Record<string, number> = {};
  for (const [code, info] of Object.entries(SUPPORTED_CURRENCIES)) {
    fallbackRates[code] = info.defaultRateToUSD;
  }
  return fallbackRates;
}

/**
 * Convert any amount from one currency to another using base USD rates.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rates: Record<string, number> = {}
): number {
  if (amount === 0) return 0;
  if (fromCurrency === toCurrency) return amount;

  // Rate of 1 USD in target currency
  const fromRateToUSD = rates[fromCurrency] ?? SUPPORTED_CURRENCIES[fromCurrency]?.defaultRateToUSD ?? 1;
  const toRateToUSD = rates[toCurrency] ?? SUPPORTED_CURRENCIES[toCurrency]?.defaultRateToUSD ?? 1;

  // Convert to USD first, then to target
  // e.g. from PKR (278/USD) to USD: amount / 278
  // from USD to EUR (0.92/USD): amount * 0.92
  const amountInUSD = fromCurrency === 'USD' ? amount : amount / fromRateToUSD;
  const converted = toCurrency === 'USD' ? amountInUSD : amountInUSD * toRateToUSD;

  return converted;
}

/**
 * Get effective rate: 1 Unit of Listing Currency = how many Units of Cost Currency
 */
export function getExchangeMultiplier(
  listingCurrency: CurrencyCode,
  costCurrency: CurrencyCode,
  rates: Record<string, number> = {},
  overrideRate?: number
): number {
  if (overrideRate && overrideRate > 0) {
    return overrideRate;
  }
  if (listingCurrency === costCurrency) {
    return 1;
  }
  return convertCurrency(1, listingCurrency, costCurrency, rates);
}
