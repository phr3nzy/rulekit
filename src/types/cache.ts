/**
 * Interface for cache implementations
 */
export interface ICache {
	/**
	 * Get a value from the cache
	 * @param key The cache key
	 * @returns The cached value or null if not found
	 */
	get<T>(key: string): Promise<T | null>;

	/**
	 * Set a value in the cache
	 * @param key The cache key
	 * @param value The value to cache
	 * @param ttlSeconds Optional TTL in seconds
	 */
	set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

	/**
	 * Delete a value from the cache
	 * @param key The cache key
	 */
	delete(key: string): Promise<void>;

	/**
	 * Clear all values from the cache
	 */
	clear(): Promise<void>;
}

/**
 * In-memory cache implementation
 */
export class InMemoryCache implements ICache {
	private cache = new Map<string, { value: any; expiresAt?: number }>();

	async get<T>(key: string): Promise<T | null> {
		const entry = this.cache.get(key);
		if (!entry) return null;

		if (entry.expiresAt && Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return null;
		}

		return entry.value as T;
	}

	async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
		this.cache.set(key, {
			value,
			expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
		});
	}

	async delete(key: string): Promise<void> {
		this.cache.delete(key);
	}

	async clear(): Promise<void> {
		this.cache.clear();
	}
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
	/**
	 * Cache implementation to use
	 * @default new InMemoryCache()
	 */
	cache?: ICache;

	/**
	 * Default TTL for cached items in seconds
	 * @default undefined (no expiration)
	 */
	defaultTTL?: number;

	/**
	 * Whether to enable rule conversion caching
	 * @default true
	 */
	enableRuleCache?: boolean;

	/**
	 * Whether to enable product index caching
	 * @default true
	 */
	enableIndexCache?: boolean;

	/**
	 * Whether to enable evaluation result caching
	 * @default false
	 */
	enableEvaluationCache?: boolean;
}
