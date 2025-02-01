import { describe, it, expect } from 'vitest';
import * as pkg from '../index';

describe('Package exports', () => {
	it('should export all required types and classes', () => {
		expect(pkg).toHaveProperty('RuleEngine');
		expect(pkg).toHaveProperty('ComparisonOperators');
		expect(pkg).toHaveProperty('ProductAttributes');
		expect(pkg).toHaveProperty('ruleSchema');
		expect(pkg).toHaveProperty('crossSellingRuleSetSchema');
		expect(pkg).toHaveProperty('crossSellingConfigSchema');
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

	it('should export ProductAttributes with correct values', () => {
		expect(pkg.ProductAttributes).toEqual({
			price: 'price',
			category: 'category',
			brand: 'brand',
		});
	});
});
