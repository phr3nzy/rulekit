import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryCache } from './memory-cache';

describe('MemoryCache', () => {
	let cache: MemoryCache;

	beforeEach(() => {
		cache = new MemoryCache();
	});

	afterEach(() => {
		cache.dispose();
	});

	describe('basic operations', () => {
		it('should store and retrieve values', async () => {
			await cache.set('key1', 'value1');
			const value = await cache.get<string>('key1');
			expect(value).toBe('value1');
		});

		it('should return null for non-existent keys', async () => {
			const value = await cache.get<string>('nonexistent');
			expect(value).toBeNull();
		});

		it('should delete values', async () => {
			await cache.set('key1', 'value1');
			await cache.delete('key1');
			const value = await cache.get<string>('key1');
			expect(value).toBeNull();
		});

		it('should clear all values', async () => {
			await cache.set('key1', 'value1');
			await cache.set('key2', 'value2');
			await cache.clear();
			expect(await cache.get('key1')).toBeNull();
			expect(await cache.get('key2')).toBeNull();
		});
	});

	describe('TTL behavior', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should expire values after TTL', async () => {
			cache = new MemoryCache({ defaultTTLSeconds: 1 });
			await cache.set('key1', 'value1');

			expect(await cache.get('key1')).toBe('value1');

			vi.advanceTimersByTime(1100); // 1.1 seconds
			expect(await cache.get('key1')).toBeNull();
		});

		it('should override default TTL with per-item TTL', async () => {
			cache = new MemoryCache({ defaultTTLSeconds: 10 });
			await cache.set('key1', 'value1', 1); // 1 second TTL

			expect(await cache.get('key1')).toBe('value1');

			vi.advanceTimersByTime(1100); // 1.1 seconds
			expect(await cache.get('key1')).toBeNull();
		});

		it('should store values indefinitely when TTL is disabled', async () => {
			cache = new MemoryCache({ defaultTTLSeconds: 0 });
			await cache.set('key1', 'value1');

			vi.advanceTimersByTime(3600000); // 1 hour
			expect(await cache.get('key1')).toBe('value1');

			// Also test with undefined TTL
			await cache.set('key2', 'value2', undefined);
			vi.advanceTimersByTime(3600000); // Another hour
			expect(await cache.get('key2')).toBe('value2');
		});

		it('should run cleanup at intervals', async () => {
			cache = new MemoryCache({ defaultTTLSeconds: 1 });
			await cache.set('key1', 'value1');
			await cache.set('key2', 'value2');

			vi.advanceTimersByTime(1100); // 1.1 seconds

			// Both values should be cleaned up
			expect(await cache.get('key1')).toBeNull();
			expect(await cache.get('key2')).toBeNull();
		});
	});

	describe('max items behavior', () => {
		it('should respect maxItems limit', async () => {
			cache = new MemoryCache({ maxItems: 2 });

			await cache.set('key1', 'value1');
			await cache.set('key2', 'value2');
			await cache.set('key3', 'value3'); // Should evict key1

			expect(await cache.get('key1')).toBeNull();
			expect(await cache.get('key2')).toBe('value2');
			expect(await cache.get('key3')).toBe('value3');
		});
	});

	describe('statistics tracking', () => {
		it('should track hits and misses when enabled', async () => {
			cache = new MemoryCache({ enableStats: true });

			await cache.set('key1', 'value1');
			await cache.get('key1'); // hit
			await cache.get('nonexistent'); // miss

			const stats = await cache.getStats();
			expect(stats).toEqual(
				expect.objectContaining({
					hits: 1,
					misses: 1,
					keys: 1,
				}),
			);
		});

		it('should return null stats when disabled', async () => {
			cache = new MemoryCache({ enableStats: false });

			await cache.set('key1', 'value1');
			await cache.get('key1');

			const stats = await cache.getStats();
			expect(stats).toBeNull();
		});

		it('should track memory usage', async () => {
			cache = new MemoryCache({ enableStats: true });

			await cache.set('key1', 'value1');

			const stats = await cache.getStats();
			expect(stats?.ksize).toBeGreaterThan(0); // key size
			expect(stats?.vsize).toBeGreaterThan(0); // value size
		});

		it('should update stats after deletion', async () => {
			cache = new MemoryCache({ enableStats: true });

			await cache.set('key1', 'value1');
			await cache.set('key2', 'value2');

			const statsBeforeDelete = await cache.getStats();
			expect(statsBeforeDelete?.keys).toBe(2);

			await cache.delete('key1');
			const statsAfterDelete = await cache.getStats();
			expect(statsAfterDelete?.keys).toBe(1);
		});

		it('should update stats after cleanup', async () => {
			vi.useFakeTimers();
			cache = new MemoryCache({ defaultTTLSeconds: 1, enableStats: true });

			await cache.set('key1', 'value1');
			await cache.set('key2', 'value2');

			const statsBeforeExpiry = await cache.getStats();
			expect(statsBeforeExpiry?.keys).toBe(2);

			vi.advanceTimersByTime(1100); // 1.1 seconds to trigger cleanup
			const statsAfterExpiry = await cache.getStats();
			expect(statsAfterExpiry?.keys).toBe(0);

			vi.useRealTimers();
		});
	});
});
