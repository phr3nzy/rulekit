import { describe, it, expect } from 'vitest';
import * as v3 from './v3';
import { v2 } from './index';
import { ComparisonOperators, type Entity } from './core/models/types';

describe('Package exports', () => {
	describe('v2 (legacy)', () => {
		it('should export all required types and classes', () => {
			expect(v2).toHaveProperty('ruleEngine');
			expect(ComparisonOperators).toBeDefined();
			expect(v2.validation).toBeDefined();
		});

		it('should export ComparisonOperators with correct values', () => {
			expect(ComparisonOperators).toEqual({
				eq: 'eq',
				ne: 'ne',
				gt: 'gt',
				gte: 'gte',
				lt: 'lt',
				lte: 'lte',
				in: 'in',
				notIn: 'notIn',
			});
		});

		it('should export Entity type with dynamic attributes support', () => {
			// Type checking test - this will fail compilation if Entity type doesn't support dynamic attributes
			const validEntity: Entity = {
				id: '1',
				name: 'Test Product',
				attributes: {
					customField: 'value',
					numericField: 123,
					__validated: true,
				},
			};
			expect(validEntity.attributes.__validated).toBe(true);
		});
	});

	describe('v3', () => {
		it('should export type-safe API', () => {
			expect(v3.RuleEngine).toBeDefined();
			expect(v3.AttributeType).toBeDefined();
		});

		it('should export schema types', () => {
			expect(v3.ComparisonOperators).toEqual({
				eq: 'eq',
				ne: 'ne',
				gt: 'gt',
				gte: 'gte',
				lt: 'lt',
				lte: 'lte',
				in: 'in',
				notIn: 'notIn',
			});
		});
	});
});
