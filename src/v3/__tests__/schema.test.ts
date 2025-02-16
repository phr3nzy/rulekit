import { describe, it, expect } from 'vitest';
import { AttributeType } from '../../core/attributes/types';
import {
	isValidAttributeValue,
	isValidSchemaObject,
	type AttributeSchema,
	type Entity,
	type Rule,
} from '../types/schema';

describe('Schema Type System', () => {
	const ROLES = ['admin', 'user', 'guest'] as const;

	// Test schema definition
	type TestSchema = {
		name: {
			type: typeof AttributeType.STRING;
			validation: {
				type: typeof AttributeType.STRING;
				required: true;
				min: 2;
				max: 50;
				pattern: '^[A-Z].*$';
			};
		};
		age: {
			type: typeof AttributeType.NUMBER;
			validation: {
				type: typeof AttributeType.NUMBER;
				required: true;
				min: 0;
				max: 150;
			};
		};
		isActive: {
			type: typeof AttributeType.BOOLEAN;
			validation: {
				type: typeof AttributeType.BOOLEAN;
				required: true;
			};
		};
		role: {
			type: typeof AttributeType.ENUM;
			validation: {
				type: typeof AttributeType.ENUM;
				required: true;
				enum: (typeof ROLES)[number][];
			};
		};
		tags: {
			type: typeof AttributeType.ARRAY;
			validation: {
				type: typeof AttributeType.ARRAY;
				arrayType: typeof AttributeType.STRING;
				required: false;
				max: 5;
			};
		};
		createdAt: {
			type: typeof AttributeType.DATE;
			validation: {
				type: typeof AttributeType.DATE;
				required: true;
			};
		};
	} & AttributeSchema;

	describe('isValidAttributeValue', () => {
		it('validates string values', () => {
			expect(isValidAttributeValue('test', AttributeType.STRING)).toBe(true);
			expect(isValidAttributeValue(123, AttributeType.STRING)).toBe(false);
			expect(isValidAttributeValue(null, AttributeType.STRING)).toBe(false);
			expect(isValidAttributeValue(undefined, AttributeType.STRING)).toBe(false);
		});

		it('validates number values', () => {
			expect(isValidAttributeValue(123, AttributeType.NUMBER)).toBe(true);
			expect(isValidAttributeValue(0, AttributeType.NUMBER)).toBe(true);
			expect(isValidAttributeValue(-123, AttributeType.NUMBER)).toBe(true);
			expect(isValidAttributeValue(NaN, AttributeType.NUMBER)).toBe(false);
			expect(isValidAttributeValue('123', AttributeType.NUMBER)).toBe(false);
			expect(isValidAttributeValue(null, AttributeType.NUMBER)).toBe(false);
		});

		it('validates boolean values', () => {
			expect(isValidAttributeValue(true, AttributeType.BOOLEAN)).toBe(true);
			expect(isValidAttributeValue(false, AttributeType.BOOLEAN)).toBe(true);
			expect(isValidAttributeValue('true', AttributeType.BOOLEAN)).toBe(false);
			expect(isValidAttributeValue(1, AttributeType.BOOLEAN)).toBe(false);
			expect(isValidAttributeValue(null, AttributeType.BOOLEAN)).toBe(false);
		});

		it('validates date values', () => {
			expect(isValidAttributeValue(new Date(), AttributeType.DATE)).toBe(true);
			expect(isValidAttributeValue(new Date('invalid'), AttributeType.DATE)).toBe(false);
			expect(isValidAttributeValue('2024-01-01', AttributeType.DATE)).toBe(false);
			expect(isValidAttributeValue(null, AttributeType.DATE)).toBe(false);
		});

		it('validates enum values', () => {
			expect(isValidAttributeValue('admin', AttributeType.ENUM)).toBe(true);
			expect(isValidAttributeValue('user', AttributeType.ENUM)).toBe(true);
			expect(isValidAttributeValue(123, AttributeType.ENUM)).toBe(false);
			expect(isValidAttributeValue(null, AttributeType.ENUM)).toBe(false);
		});

		it('validates array values', () => {
			expect(isValidAttributeValue([], AttributeType.ARRAY)).toBe(true);
			expect(isValidAttributeValue(['test'], AttributeType.ARRAY, AttributeType.STRING)).toBe(true);
			expect(isValidAttributeValue([1, 2, 3], AttributeType.ARRAY, AttributeType.NUMBER)).toBe(
				true,
			);
			expect(isValidAttributeValue(['test', 123], AttributeType.ARRAY, AttributeType.STRING)).toBe(
				false,
			);
			expect(isValidAttributeValue(null, AttributeType.ARRAY)).toBe(false);
			expect(isValidAttributeValue('not-array', AttributeType.ARRAY)).toBe(false);
		});

		it('handles invalid attribute types', () => {
			expect(isValidAttributeValue('test', 'invalid-type' as any)).toBe(false);
		});
	});

	describe('isValidSchemaObject', () => {
		const testSchema: TestSchema = {
			name: {
				type: AttributeType.STRING,
				validation: {
					type: AttributeType.STRING,
					required: true,
					min: 2,
					max: 50,
					pattern: '^[A-Z].*$',
				},
			},
			age: {
				type: AttributeType.NUMBER,
				validation: {
					type: AttributeType.NUMBER,
					required: true,
					min: 0,
					max: 150,
				},
			},
			isActive: {
				type: AttributeType.BOOLEAN,
				validation: {
					type: AttributeType.BOOLEAN,
					required: true,
				},
			},
			role: {
				type: AttributeType.ENUM,
				validation: {
					type: AttributeType.ENUM,
					required: true,
					enum: Array.from(ROLES),
				},
			},
			tags: {
				type: AttributeType.ARRAY,
				validation: {
					type: AttributeType.ARRAY,
					arrayType: AttributeType.STRING,
					required: false,
					max: 5,
				},
			},
			createdAt: {
				type: AttributeType.DATE,
				validation: {
					type: AttributeType.DATE,
					required: true,
				},
			},
		};

		it('validates valid schema objects', () => {
			const validObject = {
				name: 'Test',
				age: 25,
				isActive: true,
				role: 'admin',
				tags: ['tag1', 'tag2'],
				createdAt: new Date(),
				__validated: true,
			};

			expect(isValidSchemaObject(validObject, testSchema)).toBe(true);
		});

		it('validates objects with optional fields', () => {
			const validObject = {
				name: 'Test',
				age: 25,
				isActive: true,
				role: 'admin',
				createdAt: new Date(),
				__validated: true,
			};

			expect(isValidSchemaObject(validObject, testSchema)).toBe(true);
		});

		it('rejects invalid schema objects', () => {
			const invalidObjects = [
				null,
				undefined,
				'not-an-object',
				{}, // Empty object
				{ __validated: true }, // Missing required fields
				{
					// Invalid types
					name: 123,
					age: 'not-a-number',
					isActive: 'not-a-boolean',
					role: 'invalid-role',
					createdAt: 'not-a-date',
					__validated: true,
				},
				{
					// Missing __validated flag
					name: 'Test',
					age: 25,
					isActive: true,
					role: 'admin',
					createdAt: new Date(),
				},
				{
					// Invalid __validated type
					name: 'Test',
					age: 25,
					isActive: true,
					role: 'admin',
					createdAt: new Date(),
					__validated: 'true',
				},
			];

			invalidObjects.forEach(obj => {
				expect(isValidSchemaObject(obj, testSchema)).toBe(false);
			});
		});

		// Type tests (these will be checked by TypeScript compiler)
		it('provides type safety for entity creation', () => {
			const entity: Entity<TestSchema> = {
				id: 'test-1',
				name: 'Test Entity',
				attributes: {
					name: 'John',
					age: 30,
					isActive: true,
					role: 'admin',
					tags: ['tag1'],
					createdAt: new Date(),
					__validated: true,
				},
			};

			expect(entity).toBeDefined();
		});

		it('provides type safety for rule creation', () => {
			const rule: Rule<TestSchema> = {
				and: [
					{
						attributes: {
							age: { gte: 18 },
							role: { in: ['admin', 'user'] },
							tags: { in: ['important'] },
						},
					},
				],
			};

			expect(rule).toBeDefined();
		});
	});
});
