import { describe, it, expect } from 'vitest';
import { RuleEngine, Product } from '../rule-engine';
import { CrossSellingRuleSet, Rule } from '../../types/rules';
import { ProductAttributes, ComparisonOperators } from '../../index';

describe('RuleEngine', () => {
	const ruleEngine = new RuleEngine();

	// Sample products for testing
	const products: Product[] = [
		{
			id: '1',
			name: 'High-end Laptop',
			price: 1200,
			category: 'Electronics',
			brand: 'BrandA',
		},
		{
			id: '2',
			name: 'Laptop Bag',
			price: 80,
			category: 'Accessories',
			brand: 'BrandB',
		},
		{
			id: '3',
			name: 'Wireless Mouse',
			price: 40,
			category: 'Accessories',
			brand: 'BrandA',
		},
		{
			id: '4',
			name: 'Budget Laptop',
			price: 500,
			category: 'Electronics',
			brand: 'BrandC',
		},
		{
			id: '5',
			name: 'Premium Headphones',
			price: 300,
			category: 'Accessories',
			brand: 'BrandA',
		},
		{
			id: '6',
			name: 'Smartphone',
			price: 800,
			category: 'Electronics',
			brand: 'BrandB',
		},
	];

	// Edge cases products
	const edgeCaseProducts: Product[] = [
		{
			id: '7',
			name: '', // Empty string
			price: 0, // Zero price
			category: 'Electronics',
			brand: 'BrandA',
		},
		{
			id: '8',
			name: 'Product with null',
			price: -100, // Negative price
			category: null as any, // Null category
			brand: 'BrandB',
		},
		{
			id: '9',
			name: 'Product with undefined',
			price: Infinity, // Infinite price
			category: undefined as any, // Undefined category
			brand: '',
		},
		{
			id: '10',
			name: 'Product with special chars',
			price: NaN, // NaN price
			category: 'Category & Special < > " \' Chars',
			brand: 'Brand & Special < > " \' Chars',
			extraAttribute: 'something', // Extra attribute
		},
	];

	describe('Edge Cases', () => {
		describe('Input Validation', () => {
			it('should handle empty rules array', async () => {
				const emptyRuleSet: CrossSellingRuleSet = {
					sourceRules: [],
					recommendationRules: [],
				};
				const result = await ruleEngine.getRecommendations(products[0], products, emptyRuleSet);
				expect(result).toHaveLength(0);
			});

			it('should handle empty products array', async () => {
				const rules: Rule[] = [{ category: { eq: 'Electronics' } }];
				const result = await ruleEngine.findSourceProducts([], rules);
				expect(result).toHaveLength(0);
			});

			it('should handle null/undefined values in product attributes', async () => {
				const rules: Rule[] = [{ category: { eq: null } }];
				const result = await ruleEngine.findSourceProducts(edgeCaseProducts, rules);
				expect(result).toHaveLength(2);
				expect(result).toContainEqual(expect.objectContaining({ category: null }));
				expect(result).toContainEqual(expect.objectContaining({ category: undefined }));
			});

			it('should handle products with missing attributes', async () => {
				const incompleteProduct = {
					id: 'incomplete',
					name: 'Incomplete Product',
					price: 0,
					category: '',
					brand: '',
				};
				const rules: Rule[] = [{ price: { gt: 0 } }];
				const result = await ruleEngine.findSourceProducts([incompleteProduct], rules);
				expect(result).toHaveLength(0);
			});
		});

		describe('Rule Combinations', () => {
			it('should handle deeply nested AND/OR combinations', async () => {
				const complexRules: Rule[] = [
					{
						and: [
							{ category: { eq: 'Electronics' } },
							{
								or: [
									{ price: { gt: 1000 } },
									{
										and: [{ brand: { eq: 'BrandA' } }, { price: { lt: 500 } }],
									},
								],
							},
						],
					},
				];
				const result = await ruleEngine.findSourceProducts(products, complexRules);
				expect(result.length).toBeGreaterThan(0);
			});

			it('should handle mixed operators within the same rule', async () => {
				const mixedRules: Rule[] = [
					{
						and: [
							{ price: { gte: 100, lte: 1000 } },
							{
								or: [{ category: { eq: 'Electronics' } }, { brand: { in: ['BrandA', 'BrandB'] } }],
							},
						],
					},
				];
				const result = await ruleEngine.findSourceProducts(products, mixedRules);
				expect(result.length).toBeGreaterThan(0);
			});

			it('should handle single condition rules', async () => {
				const engine = new RuleEngine();
				const products = [
					{ id: '1', name: 'Test', price: 100, category: 'Electronics', brand: 'TestBrand' },
				];
				const rules = [{ category: { eq: 'Electronics' } }];

				const result = await engine.findSourceProducts(products, rules);
				expect(result).toHaveLength(1);
				expect(result[0].id).toBe('1');
			});

			it('should handle empty conditions', async () => {
				const engine = new RuleEngine();
				const products = [
					{ id: '1', name: 'Test', price: 100, category: 'Electronics', brand: 'TestBrand' },
				];
				const rules: Rule[] = [{}];

				const result = await engine.findSourceProducts(products, rules);
				expect(result).toHaveLength(0);
			});

			it('should handle empty rule object', async () => {
				const engine = new RuleEngine();
				const products = [
					{ id: '1', name: 'Test', price: 100, category: 'Electronics', brand: 'TestBrand' },
				];
				const rules: Rule[] = [];

				const result = await engine.findSourceProducts(products, rules);
				expect(result).toHaveLength(1);
				expect(result[0].id).toBe('1');
			});
		});

		describe('Product Data Edge Cases', () => {
			it('should handle products with extreme numeric values', async () => {
				const extremeProducts = [
					{
						id: 'extreme1',
						name: 'Extreme Product 1',
						price: Number.MAX_SAFE_INTEGER,
						category: 'Test',
						brand: 'TestBrand',
					},
					{
						id: 'extreme2',
						name: 'Extreme Product 2',
						price: Number.MIN_SAFE_INTEGER,
						category: 'Test',
						brand: 'TestBrand',
					},
				];

				const rules: Rule[] = [{ price: { gt: 0 } }];
				const result = await ruleEngine.findSourceProducts(extremeProducts, rules);
				expect(result).toHaveLength(1);
				expect(result[0].id).toBe('extreme1');
			});

			it('should handle products with special characters', async () => {
				const specialCharProducts = [
					{
						id: 'special1',
						name: 'Product with !@#$%^&*()',
						category: 'Test!@#',
						price: 100,
						brand: 'Brand!@#',
					},
				];
				const specialCharRules: Rule[] = [{ category: { eq: 'Test!@#' } }];
				const result = await ruleEngine.findSourceProducts(specialCharProducts, specialCharRules);
				expect(result).toHaveLength(1);
			});
		});

		describe('Performance Edge Cases', () => {
			it('should handle large number of products', async () => {
				const largeProductList = Array.from({ length: 10000 }, (_, i) => ({
					id: `product-${i}`,
					name: `Product ${i}`,
					price: 100,
					category: i % 2 === 0 ? 'Electronics' : 'Other',
					brand: `Brand${i % 3}`,
				}));
				const rules: Rule[] = [{ category: { eq: 'Electronics' } }];
				const result = await ruleEngine.findSourceProducts(largeProductList, rules);
				expect(result.length).toBeGreaterThan(0);
			});

			it('should handle large number of rules', async () => {
				const largeRuleSet = Array.from({ length: 100 }, (_, i) => ({
					price: { gt: i * 100 },
				}));
				const result = await ruleEngine.findSourceProducts(products, largeRuleSet);
				expect(result.length).toBeGreaterThan(0);
			});
		});

		describe('Cross-Selling Edge Cases', () => {
			it('should not recommend the same product', async () => {
				const sourceProduct = products[0];
				const rules: Rule[] = [{ category: { eq: 'Electronics' } }];
				const recommendations = await ruleEngine.findRecommendedProducts(
					sourceProduct,
					products,
					rules,
				);
				expect(recommendations).not.toContainEqual(
					expect.objectContaining({ id: sourceProduct.id }),
				);
			});

			it('should handle circular recommendations', async () => {
				const ruleSet: CrossSellingRuleSet = {
					sourceRules: [{ category: { eq: 'Electronics' } }],
					recommendationRules: [{ category: { eq: 'Electronics' } }],
				};
				const bulkRecommendations = await ruleEngine.getBulkRecommendations(
					products,
					products,
					ruleSet,
				);
				for (const [productId, recommendations] of bulkRecommendations) {
					expect(recommendations).not.toContainEqual(expect.objectContaining({ id: productId }));
				}
			});
		});
	});

	describe('findSourceProducts', () => {
		it('should find products matching simple equality rule', async () => {
			const rules = [{ category: { eq: 'Electronics' } }];
			const sourceProducts = await ruleEngine.findSourceProducts(products, rules);
			expect(sourceProducts).toHaveLength(3);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['1', '4', '6']);
		});

		it('should find products matching price range rule', async () => {
			const rules = [{ price: { gte: 500, lte: 1000 } }];
			const sourceProducts = await ruleEngine.findSourceProducts(products, rules);
			expect(sourceProducts).toHaveLength(2);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['4', '6']);
		});

		it('should find products matching multiple OR conditions', async () => {
			const rules = [
				{
					or: [{ brand: { eq: 'BrandA' } }, { brand: { eq: 'BrandB' } }],
				},
			];
			const sourceProducts = await ruleEngine.findSourceProducts(products, rules);
			expect(sourceProducts).toHaveLength(5);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['1', '2', '3', '5', '6']);
		});

		it('should find products matching complex nested AND/OR conditions', async () => {
			const rules = [
				{
					and: [
						{ category: { eq: 'Electronics' } },
						{
							or: [{ price: { gte: 1000 } }, { brand: { eq: 'BrandB' } }],
						},
					],
				},
			];
			const sourceProducts = await ruleEngine.findSourceProducts(products, rules);
			expect(sourceProducts).toHaveLength(2);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['1', '6']);
		});

		it('should handle IN operator correctly', async () => {
			const rules = [{ brand: { in: ['BrandA', 'BrandB'] } }];
			const sourceProducts = await ruleEngine.findSourceProducts(products, rules);
			expect(sourceProducts).toHaveLength(5);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['1', '2', '3', '5', '6']);
		});

		it('should handle NOT IN operator correctly', async () => {
			const rules = [{ brand: { notIn: ['BrandA', 'BrandB'] } }];
			const sourceProducts = await ruleEngine.findSourceProducts(products, rules);
			expect(sourceProducts).toHaveLength(1);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['4']);
		});
	});

	describe('findRecommendedProducts', () => {
		it('should find recommended products based on price range and category', async () => {
			const sourceProduct = products[0]; // High-end Laptop
			const rules: Rule[] = [
				{
					and: [{ category: { eq: 'Accessories' } }, { price: { lt: 100 } }],
				},
			];
			const recommendations = await ruleEngine.findRecommendedProducts(
				sourceProduct,
				products,
				rules,
			);

			expect(recommendations).toHaveLength(2);
			expect(recommendations.map(p => p.id).sort()).toEqual(['2', '3']); // Laptop Bag and Wireless Mouse
		});

		it('should find recommended products matching any OR condition', async () => {
			const sourceProduct = products[0]; // High-end Laptop
			const rules: Rule[] = [
				{
					or: [{ price: { gt: 100 } }, { brand: { eq: 'BrandA' } }],
				},
			];
			const recommendations = await ruleEngine.findRecommendedProducts(
				sourceProduct,
				products,
				rules,
			);

			expect(recommendations).toHaveLength(4);
			expect(recommendations.map(p => p.id).sort()).toEqual(['3', '4', '5', '6']);
		});

		it('should handle multiple rules with OR relationship', async () => {
			const sourceProduct = products[0]; // High-end Laptop
			const rules: Rule[] = [{ category: { eq: 'Accessories' } }, { price: { gt: 500 } }];
			const recommendations = await ruleEngine.findRecommendedProducts(
				sourceProduct,
				products,
				rules,
			);

			expect(recommendations).toHaveLength(4);
			expect(recommendations.map(p => p.id).sort()).toEqual(['2', '3', '5', '6']);
		});
	});

	describe('getRecommendations', () => {
		it('should handle complex rule sets correctly', async () => {
			const ruleSet: CrossSellingRuleSet = {
				sourceRules: [{ category: { eq: 'Electronics' } }],
				recommendationRules: [
					{
						and: [{ category: { eq: 'Accessories' } }, { brand: { in: ['BrandA', 'BrandB'] } }],
					},
				],
			};

			const recommendations = await ruleEngine.getRecommendations(products[0], products, ruleSet);

			expect(recommendations).toHaveLength(3);
			expect(recommendations.map(p => p.id).sort()).toEqual(['2', '3', '5']);
		});

		it('should return empty array for non-matching source product', async () => {
			const ruleSet: CrossSellingRuleSet = {
				sourceRules: [{ category: { eq: 'NonExistent' } }],
				recommendationRules: [{ category: { eq: 'Accessories' } }],
			};

			const recommendations = await ruleEngine.getRecommendations(products[0], products, ruleSet);

			expect(recommendations).toHaveLength(0);
		});

		it('should handle empty rules gracefully', async () => {
			const emptyRuleSet: CrossSellingRuleSet = {
				sourceRules: [],
				recommendationRules: [],
			};
			const recommendations = await ruleEngine.getRecommendations(
				products[0],
				products,
				emptyRuleSet,
			);

			expect(recommendations).toHaveLength(0);
		});
	});

	describe('getBulkRecommendations', () => {
		it('should return recommendations for multiple source products', async () => {
			const ruleSet: CrossSellingRuleSet = {
				sourceRules: [{ category: { eq: 'Electronics' } }],
				recommendationRules: [{ category: { eq: 'Accessories' } }],
			};
			const recommendations = await ruleEngine.getBulkRecommendations(products, products, ruleSet);

			expect(recommendations.size).toBe(3); // Three electronics products
			for (const [, recs] of recommendations) {
				expect(recs.every(p => p.category === 'Accessories')).toBe(true);
			}
		});

		it('should handle empty product list gracefully', async () => {
			const ruleSet: CrossSellingRuleSet = {
				sourceRules: [{ category: { eq: 'Electronics' } }],
				recommendationRules: [{ category: { eq: 'Accessories' } }],
			};
			const recommendations = await ruleEngine.getBulkRecommendations([], products, ruleSet);

			expect(recommendations.size).toBe(0);
		});

		it('should handle empty available products gracefully', async () => {
			const ruleSet: CrossSellingRuleSet = {
				sourceRules: [{ category: { eq: 'Electronics' } }],
				recommendationRules: [{ category: { eq: 'Accessories' } }],
			};
			const recommendations = await ruleEngine.getBulkRecommendations(products, [], ruleSet);

			expect(recommendations.size).toBe(3); // Three electronics products
			for (const [, recs] of recommendations) {
				expect(recs).toHaveLength(0); // No recommendations available
			}
		});
	});
});
