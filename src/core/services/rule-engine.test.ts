import { describe, it, expect, beforeEach } from 'vitest';
import { RuleEngine } from './rule-engine';
import { MemoryCache } from '../cache/memory-cache';
import type { Product, Rule, CrossSellingConfig } from '../models/types';

describe('RuleEngine', () => {
	let engine: RuleEngine;
	let cache: MemoryCache;

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
		{
			id: '3',
			name: 'Wireless Mouse',
			attributes: {
				price: 30,
				category: 'Accessories',
				brand: 'TechBrand',
				color: 'red',
				weight: 10,
				__validated: true,
			},
		},
		{
			id: '4',
			name: 'Desktop PC',
			attributes: {
				price: 2000,
				category: 'Electronics',
				brand: 'TechBrand',
				color: 'blue',
				weight: 50,
				__validated: true,
			},
		},
		{
			id: '5',
			name: 'Keyboard',
			attributes: {
				price: 80,
				category: 'Accessories',
				brand: 'TechBrand',
				color: 'blue',
				weight: 50,
				__validated: true,
			},
		},
	];

	beforeEach(() => {
		cache = new MemoryCache({ enableStats: true });
		engine = new RuleEngine({ cache, enableCaching: true });
	});

	describe('source product finding', () => {
		it('should find products matching source rules', async () => {
			const rules: Rule[] = [
				{
					and: [
						{ attributes: { category: { eq: 'Electronics' } } },
						{ attributes: { price: { gt: 1000 } } },
					],
				},
			];

			const sourceProducts = await engine.findSourceProducts(testProducts, rules);
			expect(sourceProducts).toHaveLength(2);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['1', '4']); // Laptop and Desktop PC
		});

		it('should handle complex source rules with OR conditions', async () => {
			const rules: Rule[] = [
				{
					or: [
						{ attributes: { category: { eq: 'Electronics' } } },
						{
							and: [
								{ attributes: { category: { eq: 'Accessories' } } },
								{ attributes: { brand: { eq: 'TechBrand' } } },
							],
						},
					],
				},
			];

			const sourceProducts = await engine.findSourceProducts(testProducts, rules);
			expect(sourceProducts).toHaveLength(4);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['1', '3', '4', '5']); // All TechBrand products and Electronics
		});
	});

	describe('recommended product finding', () => {
		it('should find recommended products excluding source products', async () => {
			const sourceProducts = testProducts.filter(p => p.attributes.category === 'Electronics');
			const recommendationRules: Rule[] = [
				{
					and: [
						{ attributes: { category: { eq: 'Accessories' } } },
						{ attributes: { brand: { eq: 'TechBrand' } } },
					],
				},
			];

			const recommendedProducts = await engine.findRecommendedProducts(
				sourceProducts,
				recommendationRules,
				testProducts,
			);

			expect(recommendedProducts).toHaveLength(2);
			expect(recommendedProducts.map(p => p.id).sort()).toEqual(['3', '5']); // Wireless Mouse and Keyboard
		});

		it('should handle price range recommendations', async () => {
			const sourceProducts = [testProducts[0]]; // Laptop
			const recommendationRules: Rule[] = [
				{
					and: [
						{ attributes: { category: { eq: 'Accessories' } } },
						{ attributes: { price: { lt: 100 } } },
					],
				},
			];

			const recommendedProducts = await engine.findRecommendedProducts(
				sourceProducts,
				recommendationRules,
				testProducts,
			);

			expect(recommendedProducts).toHaveLength(3);
			expect(recommendedProducts.map(p => p.id).sort()).toEqual(['2', '3', '5']); // All accessories
		});
	});

	describe('cross-selling configuration', () => {
		it('should process active cross-selling config', async () => {
			const config: CrossSellingConfig = {
				id: 'cs1',
				name: 'Electronics with Accessories',
				ruleSet: {
					sourceRules: [{ attributes: { category: { eq: 'Electronics' } } }],
					recommendationRules: [
						{
							and: [
								{ attributes: { category: { eq: 'Accessories' } } },
								{ attributes: { brand: { eq: 'TechBrand' } } },
							],
						},
					],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = await engine.processConfig(config, testProducts);

			expect(result.sourceProducts).toHaveLength(2); // Laptop and Desktop PC
			expect(result.recommendedProducts).toHaveLength(2); // TechBrand accessories
			expect(result.sourceProducts.map(p => p.id).sort()).toEqual(['1', '4']);
			expect(result.recommendedProducts.map(p => p.id).sort()).toEqual(['3', '5']);
		});

		it('should return empty results for inactive config', async () => {
			const config: CrossSellingConfig = {
				id: 'cs1',
				name: 'Electronics with Accessories',
				ruleSet: {
					sourceRules: [{ attributes: { category: { eq: 'Electronics' } } }],
					recommendationRules: [{ attributes: { category: { eq: 'Accessories' } } }],
				},
				isActive: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = await engine.processConfig(config, testProducts);

			expect(result.sourceProducts).toHaveLength(0);
			expect(result.recommendedProducts).toHaveLength(0);
		});
	});

	describe('caching behavior', () => {
		it('should utilize cache for repeated operations', async () => {
			const rules: Rule[] = [{ attributes: { category: { eq: 'Electronics' } } }];

			// First call - should miss cache
			await engine.findSourceProducts(testProducts, rules);
			const stats1 = await cache.getStats();
			expect(stats1?.misses).toBeGreaterThan(0);
			const initialMisses = stats1?.misses ?? 0;

			// Second call - should hit cache
			await engine.findSourceProducts(testProducts, rules);
			const stats2 = await cache.getStats();
			expect(stats2?.hits).toBeGreaterThan(0);
			expect(stats2?.misses).toBe(initialMisses); // No new misses
		});

		it('should use BaseRuleEvaluator when caching is disabled', async () => {
			// Create engine without caching
			const noCacheEngine = new RuleEngine({ enableCaching: false });
			const rules: Rule[] = [{ attributes: { category: { eq: 'Electronics' } } }];

			// Execute operations
			const sourceProducts = await noCacheEngine.findSourceProducts(testProducts, rules);

			// Verify results are correct even without caching
			expect(sourceProducts).toHaveLength(2);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['1', '4']);
		});

		it('should clear cache when requested', async () => {
			const rules: Rule[] = [{ attributes: { category: { eq: 'Electronics' } } }];

			// First call
			await engine.findSourceProducts(testProducts, rules);

			// Clear cache
			await engine.clearCache();

			// Second call - should miss cache again
			await engine.findSourceProducts(testProducts, rules);
			const stats = await cache.getStats();
			expect(stats?.misses).toBeGreaterThan(stats?.hits ?? 0);
		});
	});

	describe('batch processing', () => {
		it('should handle large product sets efficiently', async () => {
			// Create a larger product set
			const largeProductSet: Product[] = Array.from({ length: 1000 }, (_, i) => ({
				...testProducts[i % testProducts.length],
				id: `${i + 1}`,
				attributes: {
					...testProducts[i % testProducts.length].attributes,
					__validated: true,
				},
			}));

			const rules: Rule[] = [{ attributes: { category: { eq: 'Electronics' } } }];
			const sourceProducts = await engine.findSourceProducts(largeProductSet, rules);

			expect(sourceProducts).toHaveLength(400); // 2/5 of products are Electronics
			expect(sourceProducts[0].attributes.category).toBe('Electronics');
			expect(sourceProducts[sourceProducts.length - 1].attributes.category).toBe('Electronics');
		});

		it('should respect maxBatchSize configuration', async () => {
			engine = new RuleEngine({ cache, maxBatchSize: 2 });
			const rules: Rule[] = [{ attributes: { category: { eq: 'Electronics' } } }];

			const sourceProducts = await engine.findSourceProducts(testProducts, rules);
			expect(sourceProducts).toHaveLength(2);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['1', '4']);
		});
	});
});
