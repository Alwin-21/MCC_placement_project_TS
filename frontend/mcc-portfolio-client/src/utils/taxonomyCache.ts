const globalCache = global as any;

if (!globalCache.taxonomyCache) {
  globalCache.taxonomyCache = {
    data: null,
    expiry: 0
  };
}

export function getCachedTaxonomy(): any[] | null {
  const cache = globalCache.taxonomyCache;
  if (cache.data && Date.now() < cache.expiry) {
    return cache.data;
  }
  return null;
}

export function setCachedTaxonomy(data: any[]): void {
  globalCache.taxonomyCache = {
    data,
    expiry: Date.now() + 5 * 60 * 1000 // 5 minutes cache validity
  };
}

export function invalidateTaxonomyCache(): void {
  globalCache.taxonomyCache = {
    data: null,
    expiry: 0
  };
}
