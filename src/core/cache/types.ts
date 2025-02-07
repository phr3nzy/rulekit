/**
 * Configuration interface for cache implementations.
 * Defines options to customize cache behavior and performance.
 *
 * @interface CacheConfig
 *
 * @property {number} [defaultTTLSeconds] - Default Time-To-Live for cached items
 * @property {boolean} [enableCompression] - Whether to compress cached data
 * @property {number} [maxItems] - Maximum number of items in cache
 * @property {boolean} [enableStats] - Whether to track cache statistics
 * @property {boolean} [persistToDisk] - Whether to persist cache to disk
 * @property {string} [persistPath] - Path for disk persistence
 *
 * @remarks
 * All properties are optional with sensible defaults.
 * Disk persistence requires persistPath when enabled.
 *
 * @example
 * ```typescript
 * const config: CacheConfig = {
 *   defaultTTLSeconds: 1800, // 30 minutes
 *   maxItems: 500,
 *   enableStats: true,
 *   enableCompression: true
 * };
 * ```
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
 * Interface defining the contract for cache implementations.
 * Provides methods for basic cache operations and optional statistics.
 *
 * @interface Cache
 *
 * @remarks
 * Features:
 * - Type-safe value storage and retrieval
 * - Optional TTL override per item
 * - Basic CRUD operations
 * - Optional statistics tracking
 *
 * Implementations should:
 * - Handle concurrent access safely
 * - Implement efficient storage/retrieval
 * - Handle serialization/deserialization
 * - Respect TTL settings
 *
 * @example
 * ```typescript
 * class MemoryCache implements Cache {
 *   async get<T>(key: string): Promise<T | null> {
 *     // Implementation
 *   }
 *
 *   async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
 *     // Implementation
 *   }
 *
 *   async delete(key: string): Promise<void> {
 *     // Implementation
 *   }
 *
 *   async clear(): Promise<void> {
 *     // Implementation
 *   }
 *
 *   async getStats(): Promise<{
 *     hits: number;
 *     misses: number;
 *     keys: number;
 *     ksize: number;
 *     vsize: number;
 *   } | null> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export interface Cache {
	/**
	 * Retrieves a value from the cache by its key.
	 * Returns null if the key doesn't exist or has expired.
	 *
	 * @template T - Type of the cached value
	 * @param {string} key - Key to retrieve the value for
	 * @returns {Promise<T | null>} The cached value or null if not found
	 *
	 * @remarks
	 * - Type parameter T ensures type-safe retrieval
	 * - Handles expired items (returns null)
	 * - Updates statistics if enabled
	 *
	 * @example
	 * ```typescript
	 * // Get a cached user
	 * const user = await cache.get<User>('user:123');
	 * if (user) {
	 *   console.log('Cache hit:', user.name);
	 * }
	 * ```
	 */
	get<T>(key: string): Promise<T | null>;

	/**
	 * Stores a value in the cache under the specified key.
	 * Optionally overrides the default TTL for this item.
	 *
	 * @template T - Type of the value to cache
	 * @param {string} key - Key to store the value under
	 * @param {T} value - Value to store
	 * @param {number} [ttlSeconds] - Optional TTL override
	 *
	 * @remarks
	 * - Handles serialization of complex objects
	 * - Applies compression if enabled
	 * - Respects maxItems limit
	 * - Updates statistics if enabled
	 *
	 * @example
	 * ```typescript
	 * // Cache user data for 1 hour
	 * await cache.set('user:123', {
	 *   id: '123',
	 *   name: 'John Doe'
	 * }, 3600);
	 * ```
	 */
	set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

	/**
	 * Removes a value from the cache by its key.
	 * Does nothing if the key doesn't exist.
	 *
	 * @param {string} key - Key to delete
	 *
	 * @remarks
	 * - Safely handles non-existent keys
	 * - Updates statistics if enabled
	 * - Frees up storage space
	 *
	 * @example
	 * ```typescript
	 * // Remove cached user data
	 * await cache.delete('user:123');
	 * ```
	 */
	delete(key: string): Promise<void>;

	/**
	 * Removes all values from the cache.
	 * Resets the cache to its initial empty state.
	 *
	 * @remarks
	 * - Resets statistics if enabled
	 * - Frees all storage space
	 * - Maintains cache configuration
	 *
	 * @example
	 * ```typescript
	 * // Clear entire cache
	 * await cache.clear();
	 * ```
	 */
	clear(): Promise<void>;

	/**
	 * Retrieves current cache statistics if enabled.
	 * Returns null if statistics tracking is disabled.
	 *
	 * @returns {Promise<Object | null>} Cache statistics or null
	 *
	 * @property {number} hits - Number of successful cache retrievals
	 * @property {number} misses - Number of failed cache retrievals
	 * @property {number} keys - Current number of cached items
	 * @property {number} ksize - Total size of all keys in bytes
	 * @property {number} vsize - Total size of all values in bytes
	 *
	 * @remarks
	 * Only available if enableStats is true in config
	 *
	 * @example
	 * ```typescript
	 * const stats = await cache.getStats();
	 * if (stats) {
	 *   console.log('Cache hit rate:', stats.hits / (stats.hits + stats.misses));
	 *   console.log('Total size:', (stats.ksize + stats.vsize) / 1024, 'KB');
	 * }
	 * ```
	 */
	getStats?(): Promise<{
		hits: number;
		misses: number;
		keys: number;
		ksize: number;
		vsize: number;
	} | null>;
}
