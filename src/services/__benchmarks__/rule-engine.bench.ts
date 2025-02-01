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
	bench('simple rule evaluation (1000 products)', () => {
		const products = generateProducts(1000);
		const rules: Rule[] = [{ category: { eq: 'Electronics' } }];
		ruleEngine.findSourceProducts(products, rules);
	});

	// Benchmark: Complex nested rules
	bench('complex nested rules (1000 products, depth 3)', () => {
		const products = generateProducts(1000);
		const rules = generateComplexRules(3);
		ruleEngine.findSourceProducts(products, rules);
	});

	// Benchmark: Large dataset with mixed rules
	bench('large dataset (10000 products) with mixed rules', () => {
		const products = generateProducts(10000);
		const rules: Rule[] = [
			{
				and: [
					{ price: { gte: 100, lte: 500 } },
					{ category: { in: ['Electronics', 'Accessories'] } },
					{
						or: [{ brand: { eq: 'BrandA' } }, { brand: { eq: 'BrandB' } }],
					},
				],
			},
		];
		ruleEngine.findSourceProducts(products, rules);
	});

	// Benchmark: Cross-selling recommendations
	bench('cross-selling recommendations (1000 products)', () => {
		const products = generateProducts(1000);
		const ruleSet: CrossSellingRuleSet = {
			sourceRules: [{ category: { eq: 'Electronics' } }],
			recommendationRules: [
				{
					and: [
						{ category: { eq: 'Accessories' } },
						{ price: { lte: 200 } },
						{ brand: { in: ['BrandA', 'BrandB'] } },
					],
				},
			],
		};
		ruleEngine.getBulkRecommendations(products, products, ruleSet);
	});

	// Benchmark: Multiple concurrent rule evaluations
	bench('multiple concurrent evaluations (100 rules, 1000 products)', () => {
		const products = generateProducts(1000);
		const rules = Array.from({ length: 100 }, (_, i) => ({
			and: [{ price: { gt: i * 10 } }, { category: { in: ['Electronics', 'Accessories'] } }],
		}));
		ruleEngine.findSourceProducts(products, rules);
	});

	// Benchmark: Memory usage with large datasets
	bench('memory usage (100000 products)', () => {
		const products = generateProducts(100000);
		const rules: Rule[] = [
			{
				or: [
					{ price: { gte: 500 } },
					{ category: { eq: 'Electronics' } },
					{ brand: { in: ['BrandA', 'BrandB'] } },
				],
			},
		];
		ruleEngine.findSourceProducts(products, rules);
	});
});
