import { describe, it, expect } from 'vitest';
import {
	RuleEngine,
	AttributeType,
	ComparisonOperators,
	type Entity,
	type AttributeSchema,
	type ValidationRule,
} from './index';

type MinimalTestSchema = {
	customField: { type: typeof AttributeType.STRING; validation: ValidationRule };
	numericField: { type: typeof AttributeType.NUMBER; validation: ValidationRule };
} & AttributeSchema;

describe('Package exports', () => {
	it('should export the RuleEngine', () => {
		expect(RuleEngine).toBeDefined();
	});

	it('should export AttributeType', () => {
		expect(AttributeType).toBeDefined();
	});

	it('should export ComparisonOperators with correct values', () => {
		// This test was originally in the v3 block, adapted here.
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

	it('should export Entity type', () => {
		// Type checking test using a minimal schema
		const validEntity: Entity<MinimalTestSchema> = {
			id: '1',
			name: 'Test Product',
			attributes: {
				customField: 'value',
				numericField: 123,
				__validated: true, // Assuming __validated is part of the base Entity definition
			},
		};
		expect(validEntity.attributes.__validated).toBe(true);
	});
});
