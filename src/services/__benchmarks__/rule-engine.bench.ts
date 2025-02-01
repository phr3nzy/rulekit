import { bench, describe } from 'vitest';
import { RuleEngine, Product } from '../rule-engine';
import { Rule, CrossSellingRuleSet } from '../../types/rules';

describe('RuleEngine Benchmarks', () => {
	const ruleEngine = new RuleEngine();

	// Generate a large product dataset
	const generateProducts = (count: number): Product[] =>
		Array.from({ length: count }, (_, i) => ({
			id: `product-${i}`,
			name: `Product ${i}`,
			price: Math.floor(Math.random() * 1000),
			category: ['Electronics', 'Accessories', 'Clothing'][i % 3],
			brand: ['BrandA', 'BrandB', 'BrandC', 'BrandD'][i % 4],
		}));

	// Generate complex nested rules
	const generateComplexRules = (depth: number): Rule[] => {
		const generateNestedRule = (currentDepth: number): Rule => {
			if (currentDepth === 0) {
				return {
					price: { gte: 100, lte: 500 },
					category: { in: ['Electronics', 'Accessories'] },
					brand: { in: ['BrandA', 'BrandB'] },
				};
			}

			return {
				and: [
					generateNestedRule(currentDepth - 1),
					{
						or: [
							{ price: { gt: currentDepth * 100 } },
							{ category: { eq: 'Electronics' } },
							{ brand: { in: ['BrandA', 'BrandC'] } },
						],
					},
				],
			};
		};

		return Array.from({ length: 5 }, () => generateNestedRule(depth));
	};

	// Benchmark: Simple rule evaluation
	bench('simple rule evaluation (1000 products)', async () => {
		const products = generateProducts(1000);
		const rules: Rule[] = [{ category: { eq: 'Electronics' } }];
		await ruleEngine.findSourceProducts(products, rules);
	});

	// Benchmark: Complex nested rules
	bench('complex nested rules (1000 products)', async () => {
		const products = generateProducts(1000);
		const rules = generateComplexRules(3);
		await ruleEngine.findSourceProducts(products, rules);
	});

	// Benchmark: Large product set
	bench('large product set (10000 products)', async () => {
		const products = generateProducts(10000);
		const rules: Rule[] = [
			{
				and: [
					{ category: { eq: 'Electronics' } },
					{ price: { gt: 500 } },
					{ brand: { in: ['BrandA', 'BrandB'] } },
				],
			},
		];
		await ruleEngine.findSourceProducts(products, rules);
	});

	// Benchmark: Bulk recommendations
	bench('bulk recommendations (1000 products)', async () => {
		const products = generateProducts(1000);
		const ruleSet: CrossSellingRuleSet = {
			sourceRules: [{ category: { eq: 'Electronics' } }],
			recommendationRules: [
				{
					and: [
						{ category: { eq: 'Accessories' } },
						{ price: { lt: 100 } },
						{ brand: { in: ['BrandA', 'BrandB'] } },
					],
				},
			],
		};
		await ruleEngine.getBulkRecommendations(products, products, ruleSet);
	});

	// Benchmark: Cache performance
	bench('cache performance (repeated queries)', async () => {
		const products = generateProducts(1000);
		const rules: Rule[] = [{ category: { eq: 'Electronics' } }];
		// First call to populate cache
		await ruleEngine.findSourceProducts(products, rules);
		// Second call should use cache
		await ruleEngine.findSourceProducts(products, rules);
	});

	// Benchmark: Mixed operations
	bench('mixed operations', async () => {
		const products = generateProducts(1000);
		const rules: Rule[] = [
			{ category: { eq: 'Electronics' } },
			{ price: { gt: 500 } },
			{ brand: { in: ['BrandA', 'BrandB'] } },
		];
		await ruleEngine.findSourceProducts(products, rules);
		await ruleEngine.findSourceProducts(products, [rules[0]]);
		await ruleEngine.findSourceProducts(products, [rules[1]]);
	});
});
