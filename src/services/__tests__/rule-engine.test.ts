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
			it('should handle empty rules array', () => {
				const emptyRuleSet: CrossSellingRuleSet = {
					sourceRules: [],
					recommendationRules: [],
				};
				const result = ruleEngine.getRecommendations(products[0], products, emptyRuleSet);
				expect(result).toHaveLength(0);
			});

			it('should handle empty products array', () => {
				const rules: Rule[] = [{ category: { eq: 'Electronics' } }];
				const result = ruleEngine.findSourceProducts([], rules);
				expect(result).toHaveLength(0);
			});

			it('should handle null/undefined values in product attributes', () => {
				const rules: Rule[] = [{ category: { eq: null } }];
				const result = ruleEngine.findSourceProducts(edgeCaseProducts, rules);
				expect(result).toHaveLength(2); // Should find products with null and undefined category
				expect(result).toContainEqual(expect.objectContaining({ category: null }));
				expect(result).toContainEqual(expect.objectContaining({ category: undefined }));
			});

			it('should handle products with missing attributes', () => {
				const incompleteProduct = { id: '11', name: 'Incomplete' } as Product;
				const rules: Rule[] = [{ price: { gt: 0 } }];
				const result = ruleEngine.findSourceProducts([incompleteProduct], rules);
				expect(result).toHaveLength(0);
			});
		});

		describe('Rule Combinations', () => {
			it('should handle deeply nested AND/OR combinations', () => {
				const complexRules: Rule[] = [
					{
						and: [
							{
								or: [
									{ price: { gte: 1000 } },
									{
										and: [
											{ price: { lt: 1000 } },
											{ price: { gt: 500 } },
											{
												or: [{ brand: { eq: 'BrandA' } }, { brand: { eq: 'BrandB' } }],
											},
										],
									},
								],
							},
							{ category: { eq: 'Electronics' } },
						],
					},
				];
				const result = ruleEngine.findSourceProducts(products, complexRules);
				expect(result.length).toBeGreaterThan(0);
			});

			it('should handle mixed operators within the same rule', () => {
				const mixedRules: Rule[] = [
					{
						price: {
							gt: 100,
							lt: 1000,
							ne: 500,
						},
						category: {
							in: ['Electronics', 'Accessories'],
							notIn: ['Clearance'],
						},
					},
				];
				const result = ruleEngine.findSourceProducts(products, mixedRules);
				expect(result.length).toBeGreaterThan(0);
			});

			it('should handle single condition rules', () => {
				const engine = new RuleEngine();
				const products = [
					{ id: '1', name: 'Test Product', price: 100, category: 'electronics', brand: 'test' },
				];
				const rules = [
					{
						[ProductAttributes.price]: { [ComparisonOperators.eq]: 100 },
					},
				];

				const result = engine.findSourceProducts(products, rules);
				expect(result).toHaveLength(1);
				expect(result[0].id).toBe('1');
			});

			it('should handle empty conditions', () => {
				const engine = new RuleEngine();
				const products = [
					{ id: '1', name: 'Test Product', price: 100, category: 'electronics', brand: 'test' },
				];
				const rules: Rule[] = [];

				const result = engine.findSourceProducts(products, rules);
				expect(result).toHaveLength(0);
			});

			it('should handle empty rule object', () => {
				const engine = new RuleEngine();
				const products = [
					{ id: '1', name: 'Test Product', price: 100, category: 'electronics', brand: 'test' },
				];
				// Create a rule object with no conditions (different from empty array)
				const rules = [{}] as Rule[];

				const result = engine.findSourceProducts(products, rules);
				// Since the rule converts to true, it should match all products
				expect(result).toHaveLength(1);
				expect(result[0].id).toBe('1');
			});
		});

		describe('Product Data Edge Cases', () => {
			it('should handle products with extreme numeric values', () => {
				const extremeRules: Rule[] = [
					{ price: { gt: -Infinity } },
					{ price: { lt: Infinity } },
					{ price: { ne: NaN } },
				];
				const result = ruleEngine.findSourceProducts(edgeCaseProducts, extremeRules);
				expect(result).toBeDefined();
			});

			it('should handle products with special characters', () => {
				const specialCharRules: Rule[] = [
					{
						category: { eq: 'Category & Special < > " \' Chars' },
						brand: { eq: 'Brand & Special < > " \' Chars' },
					},
				];
				const result = ruleEngine.findSourceProducts(edgeCaseProducts, specialCharRules);
				expect(result).toHaveLength(1);
			});
		});

		describe('Performance Edge Cases', () => {
			it('should handle large number of products', () => {
				const largeProductList = Array.from({ length: 1000 }, (_, i) => ({
					...products[i % products.length],
					id: `large-${i}`,
				}));
				const rules: Rule[] = [{ category: { eq: 'Electronics' } }];
				const result = ruleEngine.findSourceProducts(largeProductList, rules);
				expect(result.length).toBeGreaterThan(0);
			});

			it('should handle large number of rules', () => {
				const largeRuleSet: Rule[] = Array.from({ length: 100 }, () => ({
					or: [
						{ price: { gt: 0 } },
						{ price: { lt: 1000000 } },
						{ category: { in: ['Electronics', 'Accessories'] } },
					],
				}));
				const result = ruleEngine.findSourceProducts(products, largeRuleSet);
				expect(result.length).toBeGreaterThan(0);
			});
		});

		describe('Cross-Selling Edge Cases', () => {
			it('should not recommend the same product', () => {
				const ruleSet: CrossSellingRuleSet = {
					sourceRules: [{ category: { eq: 'Electronics' } }],
					recommendationRules: [{ category: { eq: 'Electronics' } }],
				};
				const recommendations = ruleEngine.getRecommendations(products[0], products, ruleSet);
				expect(recommendations).not.toContain(products[0]);
			});

			it('should handle circular recommendations', () => {
				const ruleSet: CrossSellingRuleSet = {
					sourceRules: [{ price: { gt: 0 } }], // Matches all products
					recommendationRules: [{ price: { gt: 0 } }], // Matches all products
				};
				const bulkRecommendations = ruleEngine.getBulkRecommendations(products, products, ruleSet);
				// Each product should have recommendations excluding itself
				for (const [productId, recommendations] of bulkRecommendations) {
					expect(recommendations).not.toContainEqual(expect.objectContaining({ id: productId }));
				}
			});
		});
	});

	describe('findSourceProducts', () => {
		it('should find products matching simple equality rule', () => {
			const rules = [{ category: { eq: 'Electronics' } }];
			const sourceProducts = ruleEngine.findSourceProducts(products, rules);
			expect(sourceProducts).toHaveLength(3);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['1', '4', '6']);
		});

		it('should find products matching price range rule', () => {
			const rules = [{ price: { gte: 500, lte: 1000 } }];
			const sourceProducts = ruleEngine.findSourceProducts(products, rules);
			expect(sourceProducts).toHaveLength(2);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['4', '6']);
		});

		it('should find products matching multiple OR conditions', () => {
			const rules = [
				{
					or: [{ brand: { eq: 'BrandA' } }, { brand: { eq: 'BrandB' } }],
				},
			];
			const sourceProducts = ruleEngine.findSourceProducts(products, rules);
			expect(sourceProducts).toHaveLength(5);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['1', '2', '3', '5', '6']);
		});

		it('should find products matching complex nested AND/OR conditions', () => {
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
			const sourceProducts = ruleEngine.findSourceProducts(products, rules);
			expect(sourceProducts).toHaveLength(2);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['1', '6']);
		});

		it('should handle IN operator correctly', () => {
			const rules = [{ brand: { in: ['BrandA', 'BrandB'] } }];
			const sourceProducts = ruleEngine.findSourceProducts(products, rules);
			expect(sourceProducts).toHaveLength(5);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['1', '2', '3', '5', '6']);
		});

		it('should handle NOT IN operator correctly', () => {
			const rules = [{ brand: { notIn: ['BrandA', 'BrandB'] } }];
			const sourceProducts = ruleEngine.findSourceProducts(products, rules);
			expect(sourceProducts).toHaveLength(1);
			expect(sourceProducts.map(p => p.id).sort()).toEqual(['4']);
		});
	});

	describe('findRecommendedProducts', () => {
		it('should find recommended products based on price range and category', () => {
			const sourceProduct = products[0]; // High-end Laptop
			const rules = [
				{
					and: [{ category: { eq: 'Accessories' } }, { price: { gte: 50, lte: 100 } }],
				},
			];

			const recommendations = ruleEngine.findRecommendedProducts(sourceProduct, products, rules);

			expect(recommendations).toHaveLength(1);
			expect(recommendations[0].id).toBe('2'); // Laptop Bag
		});

		it('should find recommended products matching any OR condition', () => {
			const sourceProduct = products[0]; // High-end Laptop
			const rules = [
				{
					or: [{ price: { lte: 50 } }, { price: { gte: 200 } }],
				},
			];

			const recommendations = ruleEngine.findRecommendedProducts(sourceProduct, products, rules);

			expect(recommendations).toHaveLength(4);
			expect(recommendations.map(p => p.id).sort()).toEqual(['3', '4', '5', '6']);
		});

		it('should handle multiple rules with OR relationship', () => {
			const sourceProduct = products[0]; // High-end Laptop
			const rules = [{ category: { eq: 'Accessories' } }, { brand: { eq: 'BrandB' } }];

			const recommendations = ruleEngine.findRecommendedProducts(sourceProduct, products, rules);

			expect(recommendations).toHaveLength(4);
			expect(recommendations.map(p => p.id).sort()).toEqual(['2', '3', '5', '6']);
		});
	});

	describe('getRecommendations', () => {
		const complexRuleSet: CrossSellingRuleSet = {
			sourceRules: [
				{
					and: [{ category: { eq: 'Electronics' } }, { price: { gte: 1000 } }],
				},
			],
			recommendationRules: [
				{
					or: [
						{
							and: [
								{ category: { eq: 'Accessories' } },
								{ price: { lte: 100 } },
								{ brand: { in: ['BrandA', 'BrandB'] } },
							],
						},
						{
							and: [
								{ category: { eq: 'Accessories' } },
								{ price: { gte: 200 } },
								{ brand: { eq: 'BrandA' } },
							],
						},
					],
				},
			],
		};

		it('should handle complex rule sets correctly', () => {
			const recommendations = ruleEngine.getRecommendations(
				products[0], // High-end Laptop
				products,
				complexRuleSet,
			);

			expect(recommendations).toHaveLength(3);
			expect(recommendations.map(p => p.id).sort()).toEqual(['2', '3', '5']);
		});

		it('should return empty array for non-matching source product', () => {
			const recommendations = ruleEngine.getRecommendations(
				products[1], // Laptop Bag (not an electronic)
				products,
				complexRuleSet,
			);

			expect(recommendations).toHaveLength(0);
		});

		it('should handle empty rules gracefully', () => {
			const emptyRuleSet: CrossSellingRuleSet = {
				sourceRules: [],
				recommendationRules: [],
			};

			const recommendations = ruleEngine.getRecommendations(products[0], products, emptyRuleSet);

			expect(recommendations).toHaveLength(0);
		});
	});

	describe('getBulkRecommendations', () => {
		it('should return recommendations for multiple source products', () => {
			const ruleSet: CrossSellingRuleSet = {
				sourceRules: [{ category: { eq: 'Electronics' } }],
				recommendationRules: [{ category: { eq: 'Accessories' } }],
			};

			const recommendations = ruleEngine.getBulkRecommendations(products, products, ruleSet);

			expect(recommendations.size).toBe(3); // Three electronics products
			for (const [, recs] of recommendations) {
				expect(recs.every(p => p.category === 'Accessories')).toBe(true);
			}
		});

		it('should handle empty product list gracefully', () => {
			const ruleSet: CrossSellingRuleSet = {
				sourceRules: [{ category: { eq: 'Electronics' } }],
				recommendationRules: [{ category: { eq: 'Accessories' } }],
			};

			const recommendations = ruleEngine.getBulkRecommendations([], products, ruleSet);

			expect(recommendations.size).toBe(0);
		});

		it('should handle empty available products gracefully', () => {
			const ruleSet: CrossSellingRuleSet = {
				sourceRules: [{ category: { eq: 'Electronics' } }],
				recommendationRules: [{ category: { eq: 'Accessories' } }],
			};

			const recommendations = ruleEngine.getBulkRecommendations(products, [], ruleSet);

			expect(recommendations.size).toBe(3); // Three electronics products
			for (const [, recs] of recommendations) {
				expect(recs).toHaveLength(0); // No recommendations available
			}
		});
	});
});
