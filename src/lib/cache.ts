/**
 * Simple in-memory cache with TTL support
 * Used for caching API responses to improve performance
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

class SimpleCache {
    private cache: Map<string, CacheEntry<any>> = new Map();

    /**
     * Get cached data if it exists and is not expired
     * @param key Cache key
     * @param ttlMs Time to live in milliseconds
     * @returns Cached data or null if expired/missing
     */
    get<T>(key: string, ttlMs: number): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        const age = Date.now() - entry.timestamp;

        if (age > ttlMs) {
            // Expired, remove from cache
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set data in cache with current timestamp
     * @param key Cache key
     * @param data Data to cache
     */
    set<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Invalidate a specific cache entry
     * @param key Cache key to invalidate
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache entries
     */
    clearAll(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export singleton instance
export const apiCache = new SimpleCache();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
    ANALYTICS: 5 * 60 * 1000,      // 5 minutes
    FRANCHISE_STATS: 5 * 60 * 1000, // 5 minutes
    ZONES: 10 * 60 * 1000,          // 10 minutes (zones rarely change)
    REQUESTS: 2 * 60 * 1000,        // 2 minutes (more dynamic)
} as const;
