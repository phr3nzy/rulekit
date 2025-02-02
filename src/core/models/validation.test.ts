import { describe, it, expect } from 'vitest';
import {
	validateRule,
	validateCrossSellingRuleSet,
	validateCrossSellingConfig,
	RuleValidationError,
} from './validation';

describe('Rule Validation', () => {
	describe('validateRule', () => {
		it('should validate simple rules', () => {
			const rule = {
				weight: { gt: 1000 },
				color: { eq: 'red' },
			};
			expect(() => validateRule(rule)).not.toThrow();
		});

		it('should validate rules with AND conditions', () => {
			const rule = {
				and: [{ color: { eq: 'red' } }, { weight: { gt: 1000 } }],
			};
			expect(() => validateRule(rule)).not.toThrow();
		});

		it('should validate rules with OR conditions', () => {
			const rule = {
				or: [{ color: { eq: 'red' } }, { weight: { lt: 100 } }],
			};
			expect(() => validateRule(rule)).not.toThrow();
		});

		it('should validate nested AND/OR conditions', () => {
			const rule = {
				or: [
					{
						and: [{ color: { eq: 'red' } }, { weight: { gt: 1000 } }],
					},
					{
						and: [{ material: { eq: 'leather' } }, { weight: { lt: 100 } }],
					},
				],
			};
			expect(() => validateRule(rule)).not.toThrow();
		});

		it('should reject invalid rules', () => {
			expect(() => validateRule({ invalid: { eq: null } })).toThrow(RuleValidationError);
			expect(() => validateRule({ weight: { invalid: 100 } })).toThrow(RuleValidationError);
			expect(() => validateRule({ and: 'not an array' })).toThrow(RuleValidationError);
			expect(() => validateRule({ or: {} })).toThrow(RuleValidationError);
		});

		it('should validate array operators', () => {
			const rule = {
				category: { in: ['Electronics', 'Accessories'] },
				tags: { notIn: ['Discontinued', 'Clearance'] },
			};
			expect(() => validateRule(rule)).not.toThrow();
		});

		it('should reject invalid rule values', () => {
			expect(() => validateRule({ price: { gt: null } })).toThrow(RuleValidationError);
			expect(() => validateRule({ price: { gt: undefined } })).toThrow(RuleValidationError);
			expect(() => validateRule({ tags: { in: 'not-an-array' } })).toThrow(RuleValidationError);
			expect(() => validateRule({ tags: { notIn: 123 } })).toThrow(RuleValidationError);
		});

		it('should reject non-numeric values for numeric operators', () => {
			const numericOperators = ['gt', 'gte', 'lt', 'lte'];
			for (const op of numericOperators) {
				expect(() => validateRule({ price: { [op]: 'not-a-number' } })).toThrow(
					RuleValidationError,
				);
			}
		});

		it('should reject empty filters', () => {
			expect(() => validateRule({ price: {} })).toThrow(RuleValidationError);
		});

		it('should reject non-object filters', () => {
			expect(() => validateRule({ price: 'not-an-object' })).toThrow(RuleValidationError);
			expect(() => validateRule({ price: null })).toThrow(RuleValidationError);
		});

		it('should reject non-object rules', () => {
			expect(() => validateRule(null)).toThrow(RuleValidationError);
			expect(() => validateRule(undefined)).toThrow(RuleValidationError);
			expect(() => validateRule('not an object')).toThrow(RuleValidationError);
			expect(() => validateRule(123)).toThrow(RuleValidationError);
		});
	});

	describe('validateCrossSellingRuleSet', () => {
		it('should validate valid rule sets', () => {
			const ruleSet = {
				sourceRules: [{ color: { eq: 'red' } }],
				recommendationRules: [{ material: { eq: 'leather' } }],
			};
			expect(() => validateCrossSellingRuleSet(ruleSet)).not.toThrow();
		});

		it('should reject invalid rule sets', () => {
			expect(() => validateCrossSellingRuleSet({})).toThrow(RuleValidationError);
			expect(() => validateCrossSellingRuleSet({ sourceRules: [] })).toThrow(RuleValidationError);
			expect(() =>
				validateCrossSellingRuleSet({
					sourceRules: [{ invalid: true }],
					recommendationRules: [],
				}),
			).toThrow(RuleValidationError);
		});

		it('should reject non-object rule sets', () => {
			expect(() => validateCrossSellingRuleSet(null)).toThrow(RuleValidationError);
			expect(() => validateCrossSellingRuleSet('not-an-object')).toThrow(RuleValidationError);
		});

		it('should reject rule sets with invalid rules', () => {
			const invalidRuleSet = {
				sourceRules: [{ price: { gt: null } }],
				recommendationRules: [{ category: { eq: 'Electronics' } }],
			};
			expect(() => validateCrossSellingRuleSet(invalidRuleSet)).toThrow(RuleValidationError);
		});

		it('should reject rule sets with missing arrays', () => {
			expect(() =>
				validateCrossSellingRuleSet({
					sourceRules: undefined,
					recommendationRules: [],
				}),
			).toThrow(RuleValidationError);

			expect(() =>
				validateCrossSellingRuleSet({
					sourceRules: [],
					recommendationRules: undefined,
				}),
			).toThrow(RuleValidationError);
		});
	});

	describe('validateCrossSellingConfig', () => {
		it('should validate valid configs', () => {
			const config = {
				id: 'cs1',
				name: 'Test Config',
				ruleSet: {
					sourceRules: [{ color: { eq: 'red' } }],
					recommendationRules: [{ material: { eq: 'leather' } }],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(() => validateCrossSellingConfig(config)).not.toThrow();
		});

		it('should validate configs with optional description', () => {
			const config = {
				id: 'cs1',
				name: 'Test Config',
				description: 'Test Description',
				ruleSet: {
					sourceRules: [{ color: { eq: 'red' } }],
					recommendationRules: [{ material: { eq: 'leather' } }],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(() => validateCrossSellingConfig(config)).not.toThrow();
		});

		it('should reject invalid configs', () => {
			expect(() => validateCrossSellingConfig({})).toThrow(RuleValidationError);
			expect(() =>
				validateCrossSellingConfig({
					id: 'cs1',
					name: 'Test',
					ruleSet: {},
					isActive: true,
					createdAt: 'invalid date',
					updatedAt: new Date(),
				}),
			).toThrow(RuleValidationError);
		});

		it('should reject configs with invalid dates', () => {
			const invalidConfig = {
				id: 'cs1',
				name: 'Test Config',
				ruleSet: {
					sourceRules: [{ category: { eq: 'Electronics' } }],
					recommendationRules: [{ price: { lt: 100 } }],
				},
				isActive: true,
				createdAt: 'not-a-date',
				updatedAt: new Date(),
			};
			expect(() => validateCrossSellingConfig(invalidConfig)).toThrow(RuleValidationError);

			const invalidConfig2 = {
				id: 'cs1',
				name: 'Test Config',
				ruleSet: {
					sourceRules: [{ category: { eq: 'Electronics' } }],
					recommendationRules: [{ price: { lt: 100 } }],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: 'not-a-date',
			};
			expect(() => validateCrossSellingConfig(invalidConfig2)).toThrow(RuleValidationError);
		});

		it('should reject configs with invalid description', () => {
			const invalidConfig = {
				id: 'cs1',
				name: 'Test Config',
				description: '', // Empty string
				ruleSet: {
					sourceRules: [{ category: { eq: 'Electronics' } }],
					recommendationRules: [{ price: { lt: 100 } }],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(() => validateCrossSellingConfig(invalidConfig)).toThrow(RuleValidationError);

			const invalidConfig2 = {
				id: 'cs1',
				name: 'Test Config',
				description: 123 as any, // Non-string
				ruleSet: {
					sourceRules: [{ category: { eq: 'Electronics' } }],
					recommendationRules: [{ price: { lt: 100 } }],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(() => validateCrossSellingConfig(invalidConfig2)).toThrow(RuleValidationError);
		});

		it('should reject configs with non-boolean isActive', () => {
			const invalidConfig = {
				id: 'cs1',
				name: 'Test Config',
				ruleSet: {
					sourceRules: [{ category: { eq: 'Electronics' } }],
					recommendationRules: [{ price: { lt: 100 } }],
				},
				isActive: 'true' as any, // String instead of boolean
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(() => validateCrossSellingConfig(invalidConfig)).toThrow(RuleValidationError);
		});

		it('should reject configs with missing required fields', () => {
			const incompleteConfig = {
				id: 'cs1',
				// name is missing
				ruleSet: {
					sourceRules: [{ category: { eq: 'Electronics' } }],
					recommendationRules: [{ price: { lt: 100 } }],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(() => validateCrossSellingConfig(incompleteConfig)).toThrow(RuleValidationError);
		});

		it('should reject non-object configs', () => {
			expect(() => validateCrossSellingConfig(null)).toThrow(RuleValidationError);
			expect(() => validateCrossSellingConfig(undefined)).toThrow(RuleValidationError);
			expect(() => validateCrossSellingConfig('not an object')).toThrow(RuleValidationError);
			expect(() => validateCrossSellingConfig(123)).toThrow(RuleValidationError);
		});
	});
});
