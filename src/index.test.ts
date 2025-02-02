import { describe, it, expect } from 'vitest';
import * as pkg from './index';

describe('Package exports', () => {
	it('should export all required types and classes', () => {
		expect(pkg).toHaveProperty('RuleEngine');
		expect(pkg).toHaveProperty('ComparisonOperators');
		expect(pkg).toHaveProperty('validateRule');
		expect(pkg).toHaveProperty('validateCrossSellingRuleSet');
		expect(pkg).toHaveProperty('validateCrossSellingConfig');
		expect(pkg).toHaveProperty('RuleValidationError');
	});

	it('should export ComparisonOperators with correct values', () => {
		expect(pkg.ComparisonOperators).toEqual({
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

	it('should export Product type with dynamic attributes support', () => {
		// Type checking test - this will fail compilation if Product type doesn't support dynamic attributes
		const validProduct: pkg.Product = {
			id: '1',
			name: 'Test Product',
			attributes: {
				customField: 'value',
				numericField: 123,
				__validated: true,
			},
		};
		expect(validProduct.attributes.__validated).toBe(true);
	});
});
