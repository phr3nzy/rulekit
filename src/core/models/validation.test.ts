import { describe, it, expect } from 'vitest';
import {
	validateRule,
	validateRuleSet,
	validateMatchingConfig,
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

		it('should reject arrays with invalid values', () => {
			// Array with null values
			expect(() => validateRule({ tags: { in: [null] } })).toThrow(RuleValidationError);
			// Array with undefined values
			expect(() => validateRule({ tags: { in: [undefined] } })).toThrow(RuleValidationError);
			// Array with object values
			expect(() => validateRule({ tags: { in: [{}] } })).toThrow(RuleValidationError);
			// Array with mixed valid and invalid values
			expect(() => validateRule({ tags: { in: ['valid', null, 123] } })).toThrow(
				RuleValidationError,
			);
			// Array with symbol values
			expect(() => validateRule({ tags: { in: [Symbol('test')] } })).toThrow(RuleValidationError);
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

	describe('validateRuleSet', () => {
		it('should validate valid rule sets', () => {
			const ruleSet = {
				fromRules: [{ color: { eq: 'red' } }],
				toRules: [{ material: { eq: 'leather' } }],
			};
			expect(() => validateRuleSet(ruleSet)).not.toThrow();
		});

		it('should reject invalid rule sets', () => {
			expect(() => validateRuleSet({})).toThrow(RuleValidationError);
			expect(() => validateRuleSet({ fromRules: [] })).toThrow(RuleValidationError);
			expect(() =>
				validateRuleSet({
					fromRules: [{ invalid: true }],
					toRules: [],
				}),
			).toThrow(RuleValidationError);
		});

		it('should reject non-object rule sets', () => {
			expect(() => validateRuleSet(null)).toThrow(RuleValidationError);
			expect(() => validateRuleSet('not-an-object')).toThrow(RuleValidationError);
		});

		it('should reject rule sets with invalid rules', () => {
			const invalidRuleSet = {
				fromRules: [{ price: { gt: null } }],
				toRules: [{ category: { eq: 'Electronics' } }],
			};
			expect(() => validateRuleSet(invalidRuleSet)).toThrow(RuleValidationError);
		});

		it('should reject rule sets with missing arrays', () => {
			expect(() =>
				validateRuleSet({
					fromRules: undefined,
					toRules: [],
				}),
			).toThrow(RuleValidationError);

			expect(() =>
				validateRuleSet({
					fromRules: [],
					toRules: undefined,
				}),
			).toThrow(RuleValidationError);
		});
	});

	describe('validateMatchingConfig', () => {
		it('should validate valid configs', () => {
			const config = {
				id: 'match1',
				name: 'Test Config',
				ruleSet: {
					fromRules: [{ color: { eq: 'red' } }],
					toRules: [{ material: { eq: 'leather' } }],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(() => validateMatchingConfig(config)).not.toThrow();
		});

		it('should validate configs with optional description', () => {
			const config = {
				id: 'match1',
				name: 'Test Config',
				description: 'Test Description',
				ruleSet: {
					fromRules: [{ color: { eq: 'red' } }],
					toRules: [{ material: { eq: 'leather' } }],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(() => validateMatchingConfig(config)).not.toThrow();
		});

		it('should reject invalid configs', () => {
			expect(() => validateMatchingConfig({})).toThrow(RuleValidationError);
			expect(() =>
				validateMatchingConfig({
					id: 'match1',
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
				id: 'match1',
				name: 'Test Config',
				ruleSet: {
					fromRules: [{ category: { eq: 'Electronics' } }],
					toRules: [{ price: { lt: 100 } }],
				},
				isActive: true,
				createdAt: 'not-a-date',
				updatedAt: new Date(),
			};
			expect(() => validateMatchingConfig(invalidConfig)).toThrow(RuleValidationError);

			const invalidConfig2 = {
				id: 'match1',
				name: 'Test Config',
				ruleSet: {
					fromRules: [{ category: { eq: 'Electronics' } }],
					toRules: [{ price: { lt: 100 } }],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: 'not-a-date',
			};
			expect(() => validateMatchingConfig(invalidConfig2)).toThrow(RuleValidationError);
		});

		it('should reject configs with invalid description', () => {
			const invalidConfig = {
				id: 'match1',
				name: 'Test Config',
				description: '', // Empty string
				ruleSet: {
					fromRules: [{ category: { eq: 'Electronics' } }],
					toRules: [{ price: { lt: 100 } }],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(() => validateMatchingConfig(invalidConfig)).toThrow(RuleValidationError);

			const invalidConfig2 = {
				id: 'match1',
				name: 'Test Config',
				description: 123 as any, // Non-string
				ruleSet: {
					fromRules: [{ category: { eq: 'Electronics' } }],
					toRules: [{ price: { lt: 100 } }],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(() => validateMatchingConfig(invalidConfig2)).toThrow(RuleValidationError);
		});

		it('should reject configs with non-boolean isActive', () => {
			const invalidConfig = {
				id: 'match1',
				name: 'Test Config',
				ruleSet: {
					fromRules: [{ category: { eq: 'Electronics' } }],
					toRules: [{ price: { lt: 100 } }],
				},
				isActive: 'true' as any, // String instead of boolean
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(() => validateMatchingConfig(invalidConfig)).toThrow(RuleValidationError);
		});

		it('should reject configs with missing required fields', () => {
			const incompleteConfig = {
				id: 'match1',
				// name is missing
				ruleSet: {
					fromRules: [{ category: { eq: 'Electronics' } }],
					toRules: [{ price: { lt: 100 } }],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(() => validateMatchingConfig(incompleteConfig)).toThrow(RuleValidationError);
		});

		it('should reject non-object configs', () => {
			expect(() => validateMatchingConfig(null)).toThrow(RuleValidationError);
			expect(() => validateMatchingConfig(undefined)).toThrow(RuleValidationError);
			expect(() => validateMatchingConfig('not an object')).toThrow(RuleValidationError);
			expect(() => validateMatchingConfig(123)).toThrow(RuleValidationError);
		});
	});
});
