import type { Cache, CacheConfig } from './types';

/**
 * Internal interface representing a cached item with its metadata.
 *
 * @interface CacheEntry
 * @template T - Type of the cached value
 *
 * @property {T} value - The actual cached value
 * @property {number} [expiresAt] - Optional timestamp when entry expires
 *
 * @internal
 */
interface CacheEntry<T> {
	value: T;
	expiresAt?: number;
}

/**
 * Internal interface for tracking cache statistics.
 *
 * @interface CacheStats
 *
 * @property {number} hits - Number of successful cache retrievals
 * @property {number} misses - Number of failed cache retrievals
 * @property {number} keys - Current number of cached items
 * @property {number} ksize - Total size of all keys in bytes
 * @property {number} vsize - Total size of all values in bytes
 *
 * @internal
 */
interface CacheStats {
	hits: number;
	misses: number;
	keys: number;
	ksize: number;
	vsize: number;
}

/**
 * In-memory implementation of the Cache interface.
 * Provides fast, memory-based caching with optional TTL and statistics.
 *
 * @class MemoryCache
 * @implements {Cache}
 *
 * @remarks
 * Features:
 * - In-memory key-value storage
 * - Automatic TTL expiration
 * - Optional statistics tracking
 * - Maximum items limit
 * - Periodic cleanup of expired items
 *
 * @example
 * ```typescript
 * const cache = new MemoryCache({
 *   defaultTTLSeconds: 3600,
 *   maxItems: 1000,
 *   enableStats: true
 * });
 *
 * // Cache some data
 * await cache.set('key', { data: 'value' });
 *
 * // Retrieve cached data
 * const value = await cache.get('key');
 * ```
 */
export class MemoryCache implements Cache {
	private cache: Map<string, CacheEntry<unknown>>;
	private stats: CacheStats;
	private readonly config: Required<CacheConfig>;
	private cleanupInterval?: ReturnType<typeof setInterval>;

	constructor(config?: Partial<CacheConfig>) {
		this.cache = new Map();
		this.stats = {
			hits: 0,
			misses: 0,
			keys: 0,
			ksize: 0,
			vsize: 0,
		};
		this.config = {
			defaultTTLSeconds: 3600,
			enableCompression: false,
			maxItems: 1000,
			enableStats: false,
			persistToDisk: false,
			persistPath: '',
			...config,
		};

		// Start cleanup interval if TTL is enabled
		if (this.config.defaultTTLSeconds > 0) {
			this.cleanupInterval = setInterval(
				() => {
					this.cleanup();
				},
				Math.min(this.config.defaultTTLSeconds * 1000, 60000),
			); // Run at most every minute
		}
	}

	/**
	 * Retrieves a value from the cache by its key.
	 * Handles TTL expiration and statistics tracking.
	 *
	 * @template T - Type of the cached value
	 * @param {string} key - Key to retrieve
	 * @returns {Promise<T | null>} Cached value or null if not found/expired
	 *
	 * @remarks
	 * - Checks for entry existence
	 * - Verifies TTL expiration
	 * - Updates hit/miss statistics
	 * - Removes expired entries
	 *
	 * @example
	 * ```typescript
	 * const value = await cache.get<UserData>('user:123');
	 * if (value) {
	 *   console.log('Cache hit:', value);
	 * } else {
	 *   console.log('Cache miss');
	 * }
	 * ```
	 */
	async get<T>(key: string): Promise<T | null> {
		const entry = this.cache.get(key) as CacheEntry<T> | undefined;

		if (!entry) {
			if (this.config.enableStats) this.stats.misses++;
			return null;
		}

		if (entry.expiresAt && Date.now() >= entry.expiresAt) {
			this.cache.delete(key);
			if (this.config.enableStats) this.stats.misses++;
			return null;
		}

		if (this.config.enableStats) this.stats.hits++;
		return entry.value;
	}

	/**
	 * Stores a value in the cache with optional TTL.
	 * Handles maximum items limit and statistics updates.
	 *
	 * @template T - Type of the value to cache
	 * @param {string} key - Key to store under
	 * @param {T} value - Value to store
	 * @param {number} [ttlSeconds] - Optional TTL override
	 *
	 * @remarks
	 * - Enforces maximum items limit
	 * - Removes oldest entry if limit reached
	 * - Sets expiration based on TTL
	 * - Updates statistics
	 *
	 * @example
	 * ```typescript
	 * // Cache with default TTL
	 * await cache.set('key', data);
	 *
	 * // Cache with custom TTL
	 * await cache.set('key', data, 1800); // 30 minutes
	 * ```
	 */
	async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
		// Check max items limit
		if (this.cache.size >= this.config.maxItems) {
			// Remove oldest entry
			const firstKey = this.cache.keys().next().value;
			if (firstKey) {
				this.cache.delete(firstKey);
			}
		}

		const entry: CacheEntry<T> = {
			value,
			expiresAt:
				ttlSeconds !== undefined || this.config.defaultTTLSeconds > 0
					? Date.now() + (ttlSeconds ?? this.config.defaultTTLSeconds) * 1000
					: undefined,
		};

		this.cache.set(key, entry);

		if (this.config.enableStats) {
			this.updateStats();
		}
	}

	/**
	 * Removes a value from the cache.
	 * Updates statistics if enabled.
	 *
	 * @param {string} key - Key to delete
	 *
	 * @remarks
	 * - Safely handles non-existent keys
	 * - Updates statistics after deletion
	 *
	 * @example
	 * ```typescript
	 * await cache.delete('old-key');
	 * ```
	 */
	async delete(key: string): Promise<void> {
		this.cache.delete(key);
		if (this.config.enableStats) {
			this.updateStats();
		}
	}

	/**
	 * Removes all values from the cache.
	 * Resets statistics if enabled.
	 *
	 * @remarks
	 * - Clears all entries
	 * - Resets statistics counters
	 * - Maintains configuration
	 *
	 * @example
	 * ```typescript
	 * await cache.clear();
	 * ```
	 */
	async clear(): Promise<void> {
		this.cache.clear();
		if (this.config.enableStats) {
			this.resetStats();
		}
	}

	/**
	 * Retrieves current cache statistics if enabled.
	 * Returns null if statistics are disabled.
	 *
	 * @returns {Promise<CacheStats | null>} Current statistics or null
	 *
	 * @remarks
	 * Statistics include:
	 * - Cache hits and misses
	 * - Number of cached items
	 * - Memory usage metrics
	 *
	 * @example
	 * ```typescript
	 * const stats = await cache.getStats();
	 * if (stats) {
	 *   const hitRate = stats.hits / (stats.hits + stats.misses);
	 *   console.log(`Hit rate: ${hitRate * 100}%`);
	 * }
	 * ```
	 */
	async getStats(): Promise<CacheStats | null> {
		return this.config.enableStats ? this.stats : null;
	}

	/**
	 * Internal method to remove expired cache entries.
	 * Called periodically based on TTL settings.
	 *
	 * @private
	 *
	 * @remarks
	 * - Checks all entries for expiration
	 * - Removes expired entries
	 * - Updates statistics
	 * - Runs at most every minute
	 */
	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (entry.expiresAt && now >= entry.expiresAt) {
				this.cache.delete(key);
			}
		}

		if (this.config.enableStats) {
			this.updateStats();
		}
	}

	/**
	 * Internal method to update cache statistics.
	 * Calculates current memory usage and item counts.
	 *
	 * @private
	 *
	 * @remarks
	 * Updates:
	 * - Number of cached items
	 * - Total key size in bytes
	 * - Total value size in bytes
	 */
	private updateStats(): void {
		this.stats.keys = this.cache.size;
		this.stats.ksize = Array.from(this.cache.keys()).reduce((size, key) => size + key.length, 0);
		this.stats.vsize = Array.from(this.cache.values()).reduce(
			(size, entry) => size + JSON.stringify(entry.value).length,
			0,
		);
	}

	/**
	 * Internal method to reset all statistics counters.
	 * Called when clearing cache or resetting stats.
	 *
	 * @private
	 *
	 * @remarks
	 * Resets:
	 * - Hit/miss counters
	 * - Item counts
	 * - Size measurements
	 */
	private resetStats(): void {
		this.stats = {
			hits: 0,
			misses: 0,
			keys: 0,
			ksize: 0,
			vsize: 0,
		};
	}

	/**
	 * Cleans up resources used by the cache.
	 * Should be called when cache is no longer needed.
	 *
	 * @remarks
	 * - Stops the cleanup interval
	 * - Prevents memory leaks
	 * - Should be called before dereferencing cache
	 *
	 * @example
	 * ```typescript
	 * const cache = new MemoryCache();
	 * // ... use cache ...
	 * cache.dispose(); // Clean up when done
	 * ```
	 */
	dispose(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}
	}
}
