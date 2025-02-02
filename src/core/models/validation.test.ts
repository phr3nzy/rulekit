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
	});
});
