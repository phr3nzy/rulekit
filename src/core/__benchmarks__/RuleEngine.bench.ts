import { bench, describe } from 'vitest';
import { RuleEngine } from '../services/RuleEngine';
import { MemoryCache } from '../cache/MemoryCache';
import type { Product } from '../models/Product';
import type { Rule } from '../models/Rule';

describe('RuleEngine Performance', () => {
	// Test data generation
	const generateProducts = (count: number): Product[] =>
		Array.from({ length: count }, (_, i) => ({
			id: `${i + 1}`,
			name: `Product ${i + 1}`,
			price: Math.floor(Math.random() * 2000) + 1,
			category: i % 2 === 0 ? 'Electronics' : 'Accessories',
			brand: i % 3 === 0 ? 'TechBrand' : `Brand${i % 5}`,
		}));

	const simpleRule: Rule = { category: { eq: 'Electronics' } };
	const complexRule: Rule = {
		or: [
			{
				and: [
					{ category: { eq: 'Electronics' } },
					{ price: { gt: 1000 } },
					{ brand: { eq: 'TechBrand' } },
				],
			},
			{
				and: [
					{ category: { eq: 'Accessories' } },
					{ price: { lt: 100 } },
					{ brand: { in: ['TechBrand', 'Brand1'] } },
				],
			},
		],
	};

	// Benchmark: Simple rule evaluation (1000 products)
	bench('Simple rule evaluation (1000 products)', async () => {
		const engine = new RuleEngine({ enableCaching: false });
		const products = generateProducts(1000);
		await engine.findSourceProducts(products, [simpleRule]);
	});

	// Benchmark: Complex nested rules (1000 products)
	bench('Complex nested rules (1000 products)', async () => {
		const engine = new RuleEngine({ enableCaching: false });
		const products = generateProducts(1000);
		await engine.findSourceProducts(products, [complexRule]);
	});

	// Benchmark: Large product set (10000 products)
	bench('Large product set (10000 products)', async () => {
		const engine = new RuleEngine({ enableCaching: false });
		const products = generateProducts(10000);
		await engine.findSourceProducts(products, [simpleRule]);
	});

	// Benchmark: Bulk recommendations (1000 products)
	bench('Bulk recommendations (1000 products)', async () => {
		const engine = new RuleEngine({ enableCaching: false });
		const products = generateProducts(1000);
		const sourceProducts = products.slice(0, 10);
		await engine.findRecommendedProducts(sourceProducts, [complexRule], products);
	});

	// Benchmark: Cache performance (repeated queries)
	bench('Cache performance (repeated queries)', async () => {
		const cache = new MemoryCache({ enableStats: true });
		const engine = new RuleEngine({ cache, enableCaching: true });
		const products = generateProducts(1000);

		// Warm up cache
		await engine.findSourceProducts(products, [complexRule]);

		// Benchmark cached access
		await engine.findSourceProducts(products, [complexRule]);
	});

	// Benchmark: Mixed operations
	bench('Mixed operations', async () => {
		const engine = new RuleEngine({ enableCaching: true });
		const products = generateProducts(1000);

		await Promise.all([
			engine.findSourceProducts(products, [simpleRule]),
			engine.findSourceProducts(products, [complexRule]),
			engine.findRecommendedProducts(products.slice(0, 5), [simpleRule], products),
			engine.findRecommendedProducts(products.slice(5, 10), [complexRule], products),
		]);
	});
});
