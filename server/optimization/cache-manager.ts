/**
 * NEXUS-PT Pro: Cache Manager & Performance Optimization
 * Implements multi-level caching for improved performance
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Multi-level cache manager with TTL support
 */
export class CacheManager {
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private stats: Map<string, { hits: number; misses: number }> = new Map();
  private maxSize: number = 1000;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 1000, cleanupIntervalMs: number = 60000) {
    this.maxSize = maxSize;
    this.startCleanupInterval(cleanupIntervalMs);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      this.recordMiss(key);
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      this.recordMiss(key);
      return null;
    }

    this.recordHit(key);
    return entry.data as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttl: number = 3600000): void {
    // Implement simple eviction policy if cache is full
    if (this.memoryCache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.memoryCache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    this.stats.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(key?: string): CacheStats {
    if (key) {
      const stat = this.stats.get(key) || { hits: 0, misses: 0 };
      const total = stat.hits + stat.misses;
      return {
        hits: stat.hits,
        misses: stat.misses,
        size: this.memoryCache.size,
        hitRate: total > 0 ? stat.hits / total : 0,
      };
    }

    // Global stats
    let totalHits = 0;
    let totalMisses = 0;

    for (const stat of this.stats.values()) {
      totalHits += stat.hits;
      totalMisses += stat.misses;
    }

    const total = totalHits + totalMisses;
    return {
      hits: totalHits,
      misses: totalMisses,
      size: this.memoryCache.size,
      hitRate: total > 0 ? totalHits / total : 0,
    };
  }

  /**
   * Record cache hit
   */
  private recordHit(key: string): void {
    const stat = this.stats.get(key) || { hits: 0, misses: 0 };
    stat.hits++;
    this.stats.set(key, stat);
  }

  /**
   * Record cache miss
   */
  private recordMiss(key: string): void {
    const stat = this.stats.get(key) || { hits: 0, misses: 0 };
    stat.misses++;
    this.stats.set(key, stat);
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(intervalMs: number): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.memoryCache.delete(key);
    }
  }

  /**
   * Destroy cache manager
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

/**
 * Query result cache with smart invalidation
 */
export class QueryCache {
  private cache: CacheManager;
  private dependencies: Map<string, Set<string>> = new Map();

  constructor(maxSize: number = 1000) {
    this.cache = new CacheManager(maxSize);
  }

  /**
   * Get cached query result
   */
  getQuery<T>(queryKey: string): T | null {
    return this.cache.get<T>(queryKey);
  }

  /**
   * Set query result with dependencies
   */
  setQuery<T>(
    queryKey: string,
    data: T,
    dependencies: string[] = [],
    ttl: number = 3600000
  ): void {
    this.cache.set(queryKey, data, ttl);

    // Track dependencies for invalidation
    for (const dep of dependencies) {
      if (!this.dependencies.has(dep)) {
        this.dependencies.set(dep, new Set());
      }
      this.dependencies.get(dep)!.add(queryKey);
    }
  }

  /**
   * Invalidate query and dependent queries
   */
  invalidate(key: string): void {
    this.cache.delete(key);

    // Invalidate dependent queries
    const dependents = this.dependencies.get(key);
    if (dependents) {
      for (const dependent of dependents) {
        this.cache.delete(dependent);
      }
      this.dependencies.delete(key);
    }
  }

  /**
   * Invalidate all queries matching pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToInvalidate: string[] = [];

    for (const key of this.dependencies.keys()) {
      if (pattern.test(key)) {
        keysToInvalidate.push(key);
      }
    }

    for (const key of keysToInvalidate) {
      this.invalidate(key);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.cache.getStats();
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.dependencies.clear();
  }

  /**
   * Destroy cache
   */
  destroy(): void {
    this.cache.destroy();
    this.dependencies.clear();
  }
}

/**
 * Global cache instances
 */
export const globalCache = new CacheManager(1000);
export const queryCache = new QueryCache(1000);

/**
 * Cache decorator for functions
 */
export function Cacheable(ttl: number = 3600000) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      const cached = globalCache.get(cacheKey);

      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      globalCache.set(cacheKey, result, ttl);
      return result;
    };

    return descriptor;
  };
}
