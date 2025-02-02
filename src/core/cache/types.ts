/**
 * Configuration options for cache implementations
 */
export interface CacheConfig {
	/**
	 * Default Time-To-Live (TTL) in seconds for cached items
	 * @default 3600 (1 hour)
	 */
	defaultTTLSeconds?: number;

	/**
	 * Whether to enable cache compression
	 * @default false
	 */
	enableCompression?: boolean;

	/**
	 * Maximum number of items to store in cache
	 * @default 1000
	 */
	maxItems?: number;

	/**
	 * Whether to enable cache statistics tracking
	 * @default false
	 */
	enableStats?: boolean;

	/**
	 * Whether to persist cache to disk
	 * @default false
	 */
	persistToDisk?: boolean;

	/**
	 * Path to persist cache to disk (required if persistToDisk is true)
	 */
	persistPath?: string;
}

/**
 * Interface for cache implementations
 */
export interface Cache {
	/**
	 * Retrieves a value from cache by key
	 * @param key The key to retrieve
	 * @returns Promise resolving to the cached value if found, null otherwise
	 */
	get<T>(key: string): Promise<T | null>;

	/**
	 * Sets a value in cache with optional TTL
	 * @param key The key to store the value under
	 * @param value The value to store
	 * @param ttlSeconds Optional TTL in seconds (overrides default TTL)
	 */
	set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

	/**
	 * Deletes a value from cache by key
	 * @param key The key to delete
	 */
	delete(key: string): Promise<void>;

	/**
	 * Clears all values from cache
	 */
	clear(): Promise<void>;

	/**
	 * Gets cache statistics if enabled
	 * @returns Promise resolving to cache statistics object if enabled, null otherwise
	 */
	getStats?(): Promise<{
		hits: number;
		misses: number;
		keys: number;
		ksize: number;
		vsize: number;
	} | null>;
}
