import { describe, it, expect } from 'vitest';
import { BaseRuleEvaluator } from '../../evaluators/BaseRuleEvaluator';
import type { Product } from '../../models/Product';
import type { Rule } from '../../models/Rule';

describe('BaseRuleEvaluator', () => {
	const evaluator = new BaseRuleEvaluator();

	const testProducts: Product[] = [
		{
			id: '1',
			name: 'Laptop',
			price: 1200,
			category: 'Electronics',
			brand: 'TechBrand',
		},
		{
			id: '2',
			name: 'Laptop Bag',
			price: 50,
			category: 'Accessories',
			brand: 'BagBrand',
		},
		{
			id: '3',
			name: 'Wireless Mouse',
			price: 30,
			category: 'Accessories',
			brand: 'TechBrand',
		},
	];

	describe('single rule evaluation', () => {
		it('should evaluate equality condition', async () => {
			const rule: Rule = { category: { eq: 'Electronics' } };
			expect(await evaluator.evaluateRule(testProducts[0], rule)).toBe(true);
			expect(await evaluator.evaluateRule(testProducts[1], rule)).toBe(false);
		});

		it('should evaluate inequality condition', async () => {
			const rule: Rule = { category: { ne: 'Electronics' } };
			expect(await evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
			expect(await evaluator.evaluateRule(testProducts[1], rule)).toBe(true);
		});

		it('should evaluate numeric comparisons', async () => {
			const gtRule: Rule = { price: { gt: 1000 } };
			const lteRule: Rule = { price: { lte: 50 } };

			expect(await evaluator.evaluateRule(testProducts[0], gtRule)).toBe(true);
			expect(await evaluator.evaluateRule(testProducts[1], gtRule)).toBe(false);
			expect(await evaluator.evaluateRule(testProducts[1], lteRule)).toBe(true);
			expect(await evaluator.evaluateRule(testProducts[0], lteRule)).toBe(false);
		});

		it('should evaluate greater than or equal comparisons', async () => {
			const gteRule: Rule = { price: { gte: 1200 } };
			expect(await evaluator.evaluateRule(testProducts[0], gteRule)).toBe(true); // Equal to

			const gteRule2: Rule = { price: { gte: 1000 } };
			expect(await evaluator.evaluateRule(testProducts[0], gteRule2)).toBe(true); // Greater than

			const gteRule3: Rule = { price: { gte: 1500 } };
			expect(await evaluator.evaluateRule(testProducts[0], gteRule3)).toBe(false); // Less than
		});

		it('should evaluate in/notIn conditions', async () => {
			const inRule: Rule = { brand: { in: ['TechBrand', 'OtherBrand'] } };
			const notInRule: Rule = { brand: { notIn: ['TechBrand', 'OtherBrand'] } };

			expect(await evaluator.evaluateRule(testProducts[0], inRule)).toBe(true);
			expect(await evaluator.evaluateRule(testProducts[1], inRule)).toBe(false);
			expect(await evaluator.evaluateRule(testProducts[1], notInRule)).toBe(true);
			expect(await evaluator.evaluateRule(testProducts[0], notInRule)).toBe(false);
		});

		it('should handle type mismatches in numeric comparisons', async () => {
			const product = {
				...testProducts[0],
				price: 'not a number' as any,
			};

			const rules: Rule[] = [
				{ price: { gt: 1000 } },
				{ price: { gte: 1000 } },
				{ price: { lt: 2000 } },
				{ price: { lte: 2000 } },
			];

			for (const rule of rules) {
				expect(await evaluator.evaluateRule(product, rule)).toBe(false);
			}
		});

		it('should handle non-numeric rule values in numeric comparisons', async () => {
			const rules: Rule[] = [
				{ price: { gt: 'not a number' as any } },
				{ price: { gte: 'not a number' as any } },
				{ price: { lt: 'not a number' as any } },
				{ price: { lte: 'not a number' as any } },
			];

			for (const rule of rules) {
				expect(await evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
			}
		});
	});

	describe('complex rule evaluation', () => {
		it('should evaluate AND conditions', async () => {
			const rule: Rule = {
				and: [{ category: { eq: 'Accessories' } }, { price: { lt: 40 } }],
			};

			expect(await evaluator.evaluateRule(testProducts[2], rule)).toBe(true); // Wireless Mouse
			expect(await evaluator.evaluateRule(testProducts[1], rule)).toBe(false); // Laptop Bag
		});

		it('should handle rules with both leaf and AND/OR conditions', async () => {
			// Test leaf condition evaluation
			const leafRule: Rule = {
				category: { eq: 'NonExistent' },
			};
			expect(await evaluator.evaluateRule(testProducts[0], leafRule)).toBe(false);

			// Test leaf condition with AND
			const leafAndRule: Rule = {
				category: { eq: 'Electronics' },
				and: [{ price: { gt: 1000 } }],
			};
			expect(await evaluator.evaluateRule(testProducts[0], leafAndRule)).toBe(true);
			expect(await evaluator.evaluateRule(testProducts[1], leafAndRule)).toBe(false);
		});

		it('should evaluate OR conditions', async () => {
			const rule: Rule = {
				or: [{ category: { eq: 'Electronics' } }, { price: { lt: 40 } }],
			};

			expect(await evaluator.evaluateRule(testProducts[0], rule)).toBe(true); // Laptop
			expect(await evaluator.evaluateRule(testProducts[2], rule)).toBe(true); // Wireless Mouse
			expect(await evaluator.evaluateRule(testProducts[1], rule)).toBe(false); // Laptop Bag
		});

		it('should evaluate nested AND/OR conditions', async () => {
			const rule: Rule = {
				or: [
					{
						and: [{ category: { eq: 'Accessories' } }, { brand: { eq: 'TechBrand' } }],
					},
					{
						and: [{ category: { eq: 'Electronics' } }, { price: { gt: 1000 } }],
					},
				],
			};

			expect(await evaluator.evaluateRule(testProducts[0], rule)).toBe(true); // Laptop
			expect(await evaluator.evaluateRule(testProducts[2], rule)).toBe(true); // Wireless Mouse
			expect(await evaluator.evaluateRule(testProducts[1], rule)).toBe(false); // Laptop Bag
		});
	});

	describe('batch evaluation', () => {
		it('should evaluate multiple products against a single rule', async () => {
			const rule: Rule = { category: { eq: 'Accessories' } };
			const results = await evaluator.evaluateRuleBatch(testProducts, rule);

			expect(results).toEqual([false, true, true]);
		});

		it('should evaluate a product against multiple rules', async () => {
			const rules: Rule[] = [{ category: { eq: 'Electronics' } }, { price: { lt: 40 } }];

			expect(await evaluator.evaluateRules(testProducts[0], rules)).toBe(true);
			expect(await evaluator.evaluateRules(testProducts[2], rules)).toBe(true);
			expect(await evaluator.evaluateRules(testProducts[1], rules)).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('should handle undefined attributes', async () => {
			const rule: Rule = { nonexistent: { eq: 'value' } as any } as any;
			expect(await evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
		});

		it('should handle attributes explicitly set to undefined', async () => {
			const product: Product = {
				...testProducts[0],
				category: undefined,
			};
			const rule: Rule = { category: { eq: 'Electronics' } };
			expect(await evaluator.evaluateRule(product, rule)).toBe(false);

			// Test with a product that has the attribute defined but set to undefined
			const productWithUndefinedAttr = Object.create(testProducts[0]);
			Object.defineProperty(productWithUndefinedAttr, 'category', {
				value: undefined,
				enumerable: true,
			});
			expect(await evaluator.evaluateRule(productWithUndefinedAttr, rule)).toBe(false);

			// Test with a rule that has multiple conditions, where one attribute is undefined
			const multiConditionRule = {
				category: { eq: 'Electronics' },
				nonexistent: { eq: 'value' },
			} as Rule;
			expect(await evaluator.evaluateRule(testProducts[0], multiConditionRule)).toBe(false);
		});

		it('should handle empty AND/OR conditions', async () => {
			const emptyAndRule: Rule = { and: [] };
			const emptyOrRule: Rule = { or: [] };

			expect(await evaluator.evaluateRule(testProducts[0], emptyAndRule)).toBe(true);
			expect(await evaluator.evaluateRule(testProducts[0], emptyOrRule)).toBe(false);
		});

		it('should handle invalid operator', async () => {
			const rule: Rule = { price: { invalid: 100 } as any };
			expect(await evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
		});

		it('should successfully clear internal state', async () => {
			await expect(evaluator.clear()).resolves.toBeUndefined();
		});
	});
});
