import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CachedRuleEvaluator } from './cached-rule-evaluator';
import { MemoryCache } from '../cache/memory-cache';
import type { Product, Rule } from '../models/types';

describe('CachedRuleEvaluator', () => {
	let cache: MemoryCache;
	let evaluator: CachedRuleEvaluator;

	const testProducts: Product[] = [
		{
			id: '1',
			name: 'Laptop',
			attributes: {
				price: 1200,
				category: 'Electronics',
				brand: 'TechBrand',
				color: 'blue',
				weight: 50,
				__validated: true,
			},
		},
		{
			id: '2',
			name: 'Laptop Bag',
			attributes: {
				price: 50,
				category: 'Accessories',
				brand: 'BagBrand',
				color: 'red',
				weight: 10,
				__validated: true,
			},
		},
	];

	beforeEach(() => {
		cache = new MemoryCache({ enableStats: true });
		evaluator = new CachedRuleEvaluator(cache);
	});

	describe('cache behavior', () => {
		it('should cache evaluation results', async () => {
			const rule: Rule = { category: { eq: 'Electronics' } };

			// First evaluation should miss cache
			const result1 = await evaluator.evaluateRule(testProducts[0], rule);
			expect(result1).toBe(true);

			const stats1 = await cache.getStats();
			expect(stats1?.hits).toBe(0);
			expect(stats1?.misses).toBe(1);

			// Second evaluation should hit cache
			const result2 = await evaluator.evaluateRule(testProducts[0], rule);
			expect(result2).toBe(true);

			const stats2 = await cache.getStats();
			expect(stats2?.hits).toBe(1);
			expect(stats2?.misses).toBe(1);
		});

		it('should use custom TTL', async () => {
			vi.useFakeTimers();

			const evaluator = new CachedRuleEvaluator(cache, { ttlSeconds: 1 });
			const rule: Rule = { category: { eq: 'Electronics' } };

			await evaluator.evaluateRule(testProducts[0], rule);
			const cacheKey = `rule_eval:${testProducts[0].id}:${JSON.stringify(rule)}`;
			expect(await cache.get(cacheKey)).toBe(true);

			vi.advanceTimersByTime(1100); // 1.1 seconds
			expect(await cache.get(cacheKey)).toBeNull();

			vi.useRealTimers();
		});

		it('should use custom key prefix', async () => {
			const customPrefix = 'custom:';
			const evaluator = new CachedRuleEvaluator(cache, { keyPrefix: customPrefix });
			const rule: Rule = { category: { eq: 'Electronics' } };

			await evaluator.evaluateRule(testProducts[0], rule);
			const cacheKey = `${customPrefix}${testProducts[0].id}:${JSON.stringify(rule)}`;
			expect(await cache.get(cacheKey)).toBe(true);
		});
	});

	describe('batch evaluation caching', () => {
		it('should cache batch evaluation results', async () => {
			const rule: Rule = { category: { eq: 'Electronics' } };

			// First batch evaluation
			const results1 = await evaluator.evaluateRuleBatch(testProducts, rule);
			expect(results1).toEqual([true, false]);

			const stats1 = await cache.getStats();
			expect(stats1?.misses).toBe(4); // Two cache misses for two products (2 for rule evaluation, 2 for cache checks)

			// Second batch evaluation should hit cache for both products
			const results2 = await evaluator.evaluateRuleBatch(testProducts, rule);
			expect(results2).toEqual([true, false]);

			const stats2 = await cache.getStats();
			expect(stats2?.hits).toBe(2); // Two cache hits
			expect(stats2?.misses).toBe(4); // Still four misses from before
		});

		it('should handle mixed cache hits and misses', async () => {
			const rule: Rule = { category: { eq: 'Electronics' } };

			// Cache result for first product only
			await evaluator.evaluateRule(testProducts[0], rule);

			// Batch evaluation should hit cache for first product and miss for second
			const results = await evaluator.evaluateRuleBatch(testProducts, rule);
			expect(results).toEqual([true, false]);

			const stats = await cache.getStats();
			expect(stats?.hits).toBe(1); // One hit for first product
			expect(stats?.misses).toBe(3); // One miss from initial set, two from second product
		});
	});

	describe('multiple rules evaluation caching', () => {
		it('should cache results for multiple rules', async () => {
			const rules: Rule[] = [{ category: { eq: 'Electronics' } }, { price: { lt: 100 } }];

			// First evaluation
			const result1 = await evaluator.evaluateRules(testProducts[0], rules);
			expect(result1).toBe(true);

			const stats1 = await cache.getStats();
			expect(stats1?.misses).toBe(2); // Two cache misses for two rules

			// Second evaluation should hit cache for both rules
			const result2 = await evaluator.evaluateRules(testProducts[0], rules);
			expect(result2).toBe(true);

			const stats2 = await cache.getStats();
			expect(stats2?.hits).toBe(2); // Two cache hits
			expect(stats2?.misses).toBe(2); // Still two misses from before
		});
	});

	describe('cache clearing', () => {
		it('should clear cached results', async () => {
			const rule: Rule = { category: { eq: 'Electronics' } };

			await evaluator.evaluateRule(testProducts[0], rule);
			const cacheKey = `rule_eval:${testProducts[0].id}:${JSON.stringify(rule)}`;
			expect(await cache.get(cacheKey)).toBe(true);

			await evaluator.clear();
			expect(await cache.get(cacheKey)).toBeNull();
		});
	});

	it('should handle complex rules with caching', async () => {
		const rule: Rule = {
			and: [{ category: { eq: 'Electronics' } }, { price: { gte: 50 } }],
		};

		// First evaluation
		const result1 = await evaluator.evaluateRule(testProducts[0], rule);
		expect(result1).toBe(true);

		// Second evaluation should use cache
		const getCacheSpy = vi.spyOn(cache, 'get');
		const result2 = await evaluator.evaluateRule(testProducts[0], rule);
		expect(result2).toBe(true);
		expect(getCacheSpy).toHaveBeenCalled();
	});

	it('should generate consistent cache keys for equivalent rules', async () => {
		const rule1: Rule = {
			and: [{ category: { eq: 'Electronics' } }, { price: { gte: 50 } }],
		};

		const rule2: Rule = {
			and: [{ price: { gte: 50 } }, { category: { eq: 'Electronics' } }],
		};

		// Both rules should evaluate to the same result
		const result1 = await evaluator.evaluateRule(testProducts[0], rule1);
		const result2 = await evaluator.evaluateRule(testProducts[0], rule2);
		expect(result1).toEqual(result2);

		// The second evaluation should use the cache
		const getCacheSpy = vi.spyOn(cache, 'get');
		await evaluator.evaluateRule(testProducts[0], rule2);
		expect(getCacheSpy).toHaveBeenCalled();
	});

	it('should handle cache misses gracefully', async () => {
		const rule: Rule = {
			category: { eq: 'Electronics' },
		};

		// Clear cache to ensure a miss
		await cache.clear();

		const result = await evaluator.evaluateRule(testProducts[0], rule);
		expect(result).toBe(true);
	});

	it('should handle invalid rules', async () => {
		const invalidRule = {
			invalidField: { invalidOperator: 'value' },
		} as Rule;

		const result = await evaluator.evaluateRule(testProducts[0], invalidRule);
		expect(result).toBe(false);
	});
});
