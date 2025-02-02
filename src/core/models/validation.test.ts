import { describe, it, expect } from 'vitest';
import {
	ruleSchema,
	ruleValueSchema,
	crossSellingRuleSetSchema,
	crossSellingConfigSchema,
} from './validation';

describe('Rule Schemas', () => {
	describe('ruleValueSchema', () => {
		it('should validate string values', () => {
			expect(() => ruleValueSchema.parse('test')).not.toThrow();
		});

		it('should validate number values', () => {
			expect(() => ruleValueSchema.parse(123)).not.toThrow();
		});

		it('should validate boolean values', () => {
			expect(() => ruleValueSchema.parse(true)).not.toThrow();
		});

		it('should validate arrays of strings or numbers', () => {
			expect(() => ruleValueSchema.parse(['test', 123])).not.toThrow();
		});

		it('should reject invalid values', () => {
			expect(() => ruleValueSchema.parse({})).toThrow();
			expect(() => ruleValueSchema.parse([{}])).toThrow();
			expect(() => ruleValueSchema.parse([true])).toThrow();
		});
	});

	describe('ruleSchema', () => {
		it('should validate simple rules', () => {
			const rule = {
				category: { eq: 'Electronics' },
				price: { gt: 1000 },
			};
			expect(() => ruleSchema.parse(rule)).not.toThrow();
		});

		it('should validate rules with AND conditions', () => {
			const rule = {
				and: [{ category: { eq: 'Electronics' } }, { price: { gt: 1000 } }],
			};
			expect(() => ruleSchema.parse(rule)).not.toThrow();
		});

		it('should validate rules with OR conditions', () => {
			const rule = {
				or: [{ category: { eq: 'Electronics' } }, { price: { lt: 100 } }],
			};
			expect(() => ruleSchema.parse(rule)).not.toThrow();
		});

		it('should validate nested AND/OR conditions', () => {
			const rule = {
				or: [
					{
						and: [{ category: { eq: 'Electronics' } }, { price: { gt: 1000 } }],
					},
					{
						and: [{ category: { eq: 'Accessories' } }, { price: { lt: 100 } }],
					},
				],
			};
			expect(() => ruleSchema.parse(rule)).not.toThrow();
		});

		it('should reject invalid rules', () => {
			expect(() => ruleSchema.parse({ invalid: { eq: 'test' } })).toThrow();
			expect(() => ruleSchema.parse({ price: { invalid: 100 } })).toThrow();
			expect(() => ruleSchema.parse({ and: 'not an array' })).toThrow();
			expect(() => ruleSchema.parse({ or: {} })).toThrow();
		});
	});

	describe('crossSellingRuleSetSchema', () => {
		it('should validate valid rule sets', () => {
			const ruleSet = {
				sourceRules: [{ category: { eq: 'Electronics' } }],
				recommendationRules: [{ category: { eq: 'Accessories' } }],
			};
			expect(() => crossSellingRuleSetSchema.parse(ruleSet)).not.toThrow();
		});

		it('should reject invalid rule sets', () => {
			expect(() => crossSellingRuleSetSchema.parse({})).toThrow();
			expect(() => crossSellingRuleSetSchema.parse({ sourceRules: [] })).toThrow();
			expect(() =>
				crossSellingRuleSetSchema.parse({
					sourceRules: [{ invalid: true }],
					recommendationRules: [],
				}),
			).toThrow();
		});
	});

	describe('crossSellingConfigSchema', () => {
		it('should validate valid configs', () => {
			const config = {
				id: 'cs1',
				name: 'Test Config',
				ruleSet: {
					sourceRules: [{ category: { eq: 'Electronics' } }],
					recommendationRules: [{ category: { eq: 'Accessories' } }],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(() => crossSellingConfigSchema.parse(config)).not.toThrow();
		});

		it('should validate configs with optional description', () => {
			const config = {
				id: 'cs1',
				name: 'Test Config',
				description: 'Test Description',
				ruleSet: {
					sourceRules: [{ category: { eq: 'Electronics' } }],
					recommendationRules: [{ category: { eq: 'Accessories' } }],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(() => crossSellingConfigSchema.parse(config)).not.toThrow();
		});

		it('should reject invalid configs', () => {
			expect(() => crossSellingConfigSchema.parse({})).toThrow();
			expect(() =>
				crossSellingConfigSchema.parse({
					id: 'cs1',
					name: 'Test',
					ruleSet: {},
					isActive: true,
					createdAt: 'invalid date',
					updatedAt: new Date(),
				}),
			).toThrow();
		});
	});
});
