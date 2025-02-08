import { describe, it, expect } from 'vitest';
import { BaseRuleEvaluator } from './base-rule-evaluator';
import type { Entity, Rule } from '../models/types';

describe('BaseRuleEvaluator', () => {
	const evaluator = new BaseRuleEvaluator();

	const testProducts: Entity[] = [
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
				color: 'blue',
				weight: 10,
				__validated: true,
			},
		},
	];

	describe('evaluateRule', () => {
		it('should evaluate simple rules', () => {
			const rule: Rule = {
				category: { eq: 'Electronics' },
			};
			const result = evaluator.evaluateRule(testProducts[0], rule);
			expect(result).toBe(true);
		});

		it('should evaluate numeric comparisons', () => {
			const rule: Rule = {
				price: { gt: 1000 },
			};
			const result = evaluator.evaluateRule(testProducts[0], rule);
			expect(result).toBe(true);
		});

		it('should evaluate AND conditions', () => {
			const rule: Rule = {
				and: [{ category: { eq: 'Electronics' } }, { price: { gt: 1000 } }],
			};
			const result = evaluator.evaluateRule(testProducts[0], rule);
			expect(result).toBe(true);
		});

		it('should evaluate OR conditions', () => {
			const rule: Rule = {
				or: [{ category: { eq: 'Electronics' } }, { price: { lt: 100 } }],
			};
			const result = evaluator.evaluateRule(testProducts[0], rule);
			expect(result).toBe(true);
		});

		it('should evaluate nested AND/OR conditions', () => {
			const rule: Rule = {
				or: [
					{
						and: [{ category: { eq: 'Electronics' } }, { price: { gt: 1000 } }],
					},
					{
						and: [{ category: { eq: 'Accessories' } }, { price: { lt: 100 } }],
					},
				],
			};
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(true); // Laptop
			expect(evaluator.evaluateRule(testProducts[1], rule)).toBe(true); // Laptop Bag
			expect(evaluator.evaluateRule(testProducts[2], rule)).toBe(true); // Mouse
		});

		it('should evaluate array operators', () => {
			const rule: Rule = {
				category: { in: ['Electronics', 'Accessories'] },
			};
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(true);
			expect(evaluator.evaluateRule(testProducts[1], rule)).toBe(true);
		});

		it('should evaluate multiple conditions', () => {
			const rule: Rule = {
				category: { eq: 'Electronics' },
				brand: { eq: 'TechBrand' },
			};
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(true);
			expect(evaluator.evaluateRule(testProducts[1], rule)).toBe(false);
		});
	});

	describe('single rule evaluation', () => {
		it('should evaluate equality condition', () => {
			const rule: Rule = { category: { eq: 'Electronics' } };
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(true);
			expect(evaluator.evaluateRule(testProducts[1], rule)).toBe(false);
		});

		it('should evaluate inequality condition', () => {
			const rule: Rule = { category: { ne: 'Electronics' } };
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
			expect(evaluator.evaluateRule(testProducts[1], rule)).toBe(true);
		});

		it('should evaluate greater than or equal comparisons', () => {
			const gteRule: Rule = { price: { gte: 1200 } };
			expect(evaluator.evaluateRule(testProducts[0], gteRule)).toBe(true); // Equal to

			const gteRule2: Rule = { price: { gte: 1000 } };
			expect(evaluator.evaluateRule(testProducts[0], gteRule2)).toBe(true); // Greater than

			const gteRule3: Rule = { price: { gte: 1500 } };
			expect(evaluator.evaluateRule(testProducts[0], gteRule3)).toBe(false); // Less than
		});

		it('should handle type mismatches in numeric comparisons', () => {
			const product: Entity = {
				id: '1',
				name: 'Test Product',
				attributes: {
					price: 'not a number',
					__validated: true,
				},
			};

			const rules: Rule[] = [
				{ price: { gt: 1000 } },
				{ price: { gte: 1000 } },
				{ price: { lt: 2000 } },
				{ price: { lte: 2000 } },
			];

			for (const rule of rules) {
				expect(evaluator.evaluateRule(product, rule)).toBe(false);
			}
		});

		it('should handle non-numeric rule values in numeric comparisons', () => {
			const product: Entity = {
				id: '1',
				name: 'Test Product',
				attributes: {
					price: 1200,
					__validated: true,
				},
			};

			const rules: Rule[] = [
				{ price: { gt: 'not a number' as any } },
				{ price: { gte: 'not a number' as any } },
				{ price: { lt: 'not a number' as any } },
				{ price: { lte: 'not a number' as any } },
			];

			for (const rule of rules) {
				expect(evaluator.evaluateRule(product, rule)).toBe(false);
			}
		});

		it('should handle less than comparisons', () => {
			const ltRule: Rule = { price: { lt: 1500 } };
			expect(evaluator.evaluateRule(testProducts[0], ltRule)).toBe(true); // 1200 < 1500
			expect(evaluator.evaluateRule(testProducts[1], ltRule)).toBe(true); // 50 < 1500

			const ltRule2: Rule = { price: { lt: 1000 } };
			expect(evaluator.evaluateRule(testProducts[0], ltRule2)).toBe(false); // 1200 !< 1000
		});

		it('should handle less than or equal comparisons', () => {
			const lteRule: Rule = { price: { lte: 1200 } };
			expect(evaluator.evaluateRule(testProducts[0], lteRule)).toBe(true); // Equal to
			expect(evaluator.evaluateRule(testProducts[1], lteRule)).toBe(true); // Less than

			const lteRule2: Rule = { price: { lte: 1000 } };
			expect(evaluator.evaluateRule(testProducts[0], lteRule2)).toBe(false); // Greater than
		});

		it('should handle non-string operator keys with invalid operators', () => {
			const rule = {
				price: {
					[123 as any]: 100,
					'invalid-op': 200,
				} as any,
			} as Rule;
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
		});
	});

	describe('complex rule evaluation', () => {
		it('should evaluate non-existent category in leaf rules', () => {
			const leafRule: Rule = {
				category: { eq: 'NonExistent' },
			};
			expect(evaluator.evaluateRule(testProducts[0], leafRule)).toBe(false);
		});

		it('should evaluate combined leaf and AND conditions', () => {
			const leafAndRule: Rule = {
				category: { eq: 'Electronics' },
				and: [{ price: { gt: 1000 } }],
			};
			expect(evaluator.evaluateRule(testProducts[0], leafAndRule)).toBe(true);
			expect(evaluator.evaluateRule(testProducts[1], leafAndRule)).toBe(false);
		});

		it('should evaluate in/notIn conditions', () => {
			const inRule: Rule = { brand: { in: ['TechBrand', 'OtherBrand'] } };
			const notInRule: Rule = { brand: { notIn: ['TechBrand', 'OtherBrand'] } };

			expect(evaluator.evaluateRule(testProducts[0], inRule)).toBe(true);
			expect(evaluator.evaluateRule(testProducts[1], inRule)).toBe(false);
			expect(evaluator.evaluateRule(testProducts[1], notInRule)).toBe(true);
			expect(evaluator.evaluateRule(testProducts[0], notInRule)).toBe(false);
		});
	});

	describe('batch evaluation', () => {
		it('should evaluate multiple products against a single rule', () => {
			const rule: Rule = { category: { eq: 'Accessories' } };
			const results = evaluator.evaluateRuleBatch(testProducts, rule);

			expect(results).toEqual([false, true, true]);
		});

		it('should evaluate a product against multiple rules', () => {
			const rules: Rule[] = [{ category: { eq: 'Electronics' } }, { price: { lt: 40 } }];

			expect(evaluator.evaluateRules(testProducts[0], rules)).toBe(true);
			expect(evaluator.evaluateRules(testProducts[2], rules)).toBe(true);
			expect(evaluator.evaluateRules(testProducts[1], rules)).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('should handle non-existent attributes', () => {
			const product: Entity = {
				id: '1',
				name: 'Test Product',
				attributes: {
					__validated: true,
				},
			};
			const rule: Rule = { nonexistent: { eq: 'value' } };
			expect(evaluator.evaluateRule(product, rule)).toBe(false);
		});

		it('should handle explicitly undefined attributes', () => {
			const product: Entity = {
				id: '1',
				name: 'Test Product',
				attributes: {
					category: undefined,
					__validated: true,
				},
			};
			const rule: Rule = { category: { eq: 'Electronics' } };
			expect(evaluator.evaluateRule(product, rule)).toBe(false);
		});

		it('should handle attributes set to undefined via Object.defineProperty', () => {
			const product: Entity = {
				id: '1',
				name: 'Test Product',
				attributes: {
					__validated: true,
				},
			};
			const productWithUndefinedAttr = { ...product };
			Object.defineProperty(productWithUndefinedAttr.attributes, 'category', {
				value: undefined,
				enumerable: true,
			});
			const rule: Rule = { category: { eq: 'Electronics' } };
			expect(evaluator.evaluateRule(productWithUndefinedAttr, rule)).toBe(false);
		});

		it('should handle invalid operators', () => {
			const invalidRule = {
				price: { invalidOp: 100 } as any,
			};
			expect(evaluator.evaluateRule(testProducts[0], invalidRule)).toBe(false);
		});

		it('should handle empty rules', () => {
			const emptyRule = {};
			expect(evaluator.evaluateRule(testProducts[0], emptyRule)).toBe(false);
		});

		it('should handle empty AND/OR conditions', () => {
			const emptyAndRule = { and: [] };
			const emptyOrRule = { or: [] };
			expect(evaluator.evaluateRule(testProducts[0], emptyAndRule)).toBe(true);
			expect(evaluator.evaluateRule(testProducts[0], emptyOrRule)).toBe(false);
		});

		it('should handle mixed valid and invalid operators', () => {
			const mixedRule = {
				price: {
					gt: 1000,
					invalidOp: 100,
				} as any,
			};
			expect(evaluator.evaluateRule(testProducts[0], mixedRule)).toBe(false);
		});

		it('should handle non-numeric values in numeric comparisons', () => {
			const invalidNumericRule = {
				price: { gt: '1000' as any },
			};
			expect(evaluator.evaluateRule(testProducts[0], invalidNumericRule)).toBe(false);
		});

		it('should handle invalid array values in in/notIn operators', () => {
			const invalidArrayRule = {
				category: { in: 'Electronics' as any },
			};
			expect(evaluator.evaluateRule(testProducts[0], invalidArrayRule)).toBe(false);
		});

		it('should handle empty batch evaluation', () => {
			const rule = {
				price: {
					gt: 1000,
				},
			};
			expect(evaluator.evaluateRuleBatch([], rule)).toEqual([]);
		});

		it('should handle unknown comparison operators', () => {
			const rule = {
				price: {
					unknown: 100,
				} as any,
			} as Rule;
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
		});

		it('should handle multiple operators with some invalid', () => {
			const rule = {
				price: {
					gt: 1000,
					unknown: 100,
				} as any,
			} as Rule;
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
		});

		it('should handle all numeric comparison operators with type mismatches', () => {
			const rule = {
				price: {
					gt: '1000' as any,
					gte: '1000' as any,
					lt: '1000' as any,
					lte: '1000' as any,
				} as any,
			} as Rule;
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
		});

		it('should handle array operators with non-array values', () => {
			const rule = {
				category: {
					in: 'electronics' as any,
					notIn: 'clothing' as any,
				} as any,
			} as Rule;
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
		});

		it('should handle evaluateRules with empty rules array', () => {
			expect(evaluator.evaluateRules(testProducts[0], [])).toBe(false);
		});

		it('should handle invalid operator types', () => {
			const rule = {
				price: {
					[Symbol('invalid') as any]: 100,
					gt: 1000,
				} as any,
			} as Rule;
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
		});

		it('should handle non-string operator keys', () => {
			const rule = {
				price: {
					[123 as any]: 100,
					gt: 1000,
				} as any,
			} as Rule;
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
		});

		it('should handle undefined operator values', () => {
			const rule = {
				price: {
					gt: undefined as any,
				} as any,
			} as Rule;
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
		});

		it('should handle non-array values for array operators', () => {
			const rule = {
				category: {
					in: 123 as any,
				} as any,
			} as Rule;
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
		});

		it('should handle array values with non-array target for ne operator', () => {
			const productWithArrayValue: Entity = {
				id: '1',
				name: 'Test Product',
				attributes: {
					tags: ['tag1', 'tag2'],
					__validated: true,
				},
			};

			const rule: Rule = {
				tags: { ne: 'tag3' },
			};

			expect(evaluator.evaluateRule(productWithArrayValue, rule)).toBe(true);
		});

		it('should handle array values with non-array target for array operators', () => {
			const productWithArrayValue: Entity = {
				id: '1',
				name: 'Test Product',
				attributes: {
					categories: ['Electronics', 'Gadgets'],
					__validated: true,
				},
			};

			const inRule: Rule = {
				categories: { in: 'Electronics' as any },
			};

			const notInRule: Rule = {
				categories: { notIn: 'Electronics' as any },
			};

			expect(evaluator.evaluateRule(productWithArrayValue, inRule)).toBe(false);
			expect(evaluator.evaluateRule(productWithArrayValue, notInRule)).toBe(false);
		});

		it('should handle invalid values in array operators', () => {
			const rule = {
				category: {
					in: [Symbol('invalid')] as any,
				} as any,
			} as Rule;
			expect(evaluator.evaluateRule(testProducts[0], rule)).toBe(false);
		});

		it('should call clear method', () => {
			evaluator.clear();
		});
	});
});
