import type { Cache, CacheConfig } from './types';

interface CacheEntry<T> {
	value: T;
	expiresAt?: number;
}

interface CacheStats {
	hits: number;
	misses: number;
	keys: number;
	ksize: number;
	vsize: number;
}

/**
 * Memory-based implementation of Cache interface
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
	 * Gets a value from cache
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
	 * Sets a value in cache
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
	 * Deletes a value from cache
	 */
	async delete(key: string): Promise<void> {
		this.cache.delete(key);
		if (this.config.enableStats) {
			this.updateStats();
		}
	}

	/**
	 * Clears all values from cache
	 */
	async clear(): Promise<void> {
		this.cache.clear();
		if (this.config.enableStats) {
			this.resetStats();
		}
	}

	/**
	 * Gets cache statistics
	 */
	async getStats(): Promise<CacheStats | null> {
		return this.config.enableStats ? this.stats : null;
	}

	/**
	 * Cleans up expired entries
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
	 * Updates cache statistics
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
	 * Resets cache statistics
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
	 * Stops the cleanup interval
	 */
	dispose(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}
	}
}
