import { describe, it, expect } from 'vitest';
import { AttributeType, type AttributeTypeValue } from '../../core/attributes/types';
import type { AttributeSchema, TypedEntity } from '../types/schema';
import { TypedRuleEngine } from '../engine/rule-engine';

describe('TypedRuleEngine', () => {
	const CATEGORIES = ['electronics', 'furniture', 'clothing'] as const;

	// Test schema definition
	type ProductSchema = {
		category: {
			type: AttributeTypeValue;
			validation: {
				type: AttributeTypeValue;
				required: true;
				enum: (typeof CATEGORIES)[number][];
			};
		};
		price: {
			type: AttributeTypeValue;
			validation: {
				type: AttributeTypeValue;
				required: true;
				min: 0;
			};
		};
		inStock: {
			type: AttributeTypeValue;
			validation: {
				type: AttributeTypeValue;
				required: true;
			};
		};
		tags: {
			type: AttributeTypeValue;
			validation: {
				type: AttributeTypeValue;
				arrayType: AttributeTypeValue;
				required: false;
				max: 10;
			};
		};
	} & AttributeSchema;

	const productSchema: ProductSchema = {
		category: {
			type: AttributeType.STRING,
			validation: {
				type: AttributeType.STRING,
				required: true,
				enum: Array.from(CATEGORIES),
			},
		},
		price: {
			type: AttributeType.NUMBER,
			validation: {
				type: AttributeType.NUMBER,
				required: true,
				min: 0,
			},
		},
		inStock: {
			type: AttributeType.BOOLEAN,
			validation: {
				type: AttributeType.BOOLEAN,
				required: true,
			},
		},
		tags: {
			type: AttributeType.ARRAY,
			validation: {
				type: AttributeType.ARRAY,
				arrayType: AttributeType.STRING,
				required: false,
				max: 10,
			},
		},
	};

	const createProduct = (
		id: string,
		category: (typeof CATEGORIES)[number],
		price: number,
		inStock: boolean,
		tags: string[] = [],
	): TypedEntity<ProductSchema> => ({
		id,
		name: `Product ${id}`,
		attributes: {
			category,
			price,
			inStock,
			tags,
			__validated: true,
		},
	});

	describe('findMatchingFrom', () => {
		const engine = new TypedRuleEngine(productSchema);

		it('matches entities with simple attribute rules', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true),
				createProduct('2', 'furniture', 200, false),
				createProduct('3', 'electronics', 300, true),
			];

			const rules = [
				{
					attributes: {
						category: { eq: 'electronics' },
						inStock: { eq: true },
					},
				},
			];

			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(2);
			expect(matches.map(m => m.id)).toEqual(['1', '3']);
		});

		it('matches entities with AND conditions', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true),
				createProduct('2', 'electronics', 200, false),
				createProduct('3', 'electronics', 300, true),
			];

			const rules = [
				{
					and: [
						{ attributes: { category: { eq: 'electronics' } } },
						{ attributes: { price: { lt: 250 } } },
					],
				},
			];

			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(2);
			expect(matches.map(m => m.id)).toEqual(['1', '2']);
		});

		it('matches entities with OR conditions', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true),
				createProduct('2', 'furniture', 200, false),
				createProduct('3', 'clothing', 300, true),
			];

			const rules = [
				{
					or: [
						{ attributes: { category: { eq: 'electronics' } } },
						{ attributes: { category: { eq: 'furniture' } } },
					],
				},
			];

			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(2);
			expect(matches.map(m => m.id)).toEqual(['1', '2']);
		});

		it('matches entities with array conditions', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true, ['new', 'featured']),
				createProduct('2', 'furniture', 200, false, ['sale']),
				createProduct('3', 'electronics', 300, true, ['new']),
			];

			const rules = [
				{
					attributes: {
						tags: { in: ['featured'] },
					},
				},
			];

			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(1);
			expect(matches[0].id).toBe('1');
		});

		it('handles empty rules', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true),
				createProduct('2', 'furniture', 200, false),
			];

			const matches = engine.findMatchingFrom(entities, [{}]);
			expect(matches).toEqual([]);
		});

		it('handles invalid entities', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true),
				{
					id: '2',
					name: 'Invalid',
					attributes: {
						category: 'invalid',
						__validated: true,
					},
				} as TypedEntity<ProductSchema>,
			];

			const rules = [{ attributes: { category: { eq: 'electronics' } } }];

			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(1);
			expect(matches[0].id).toBe('1');
		});
	});

	describe('findMatchingTo', () => {
		const engine = new TypedRuleEngine(productSchema);

		it('finds matching target entities', () => {
			const fromEntities = [createProduct('1', 'electronics', 100, true)];
			const allEntities = [
				...fromEntities,
				createProduct('2', 'furniture', 200, false),
				createProduct('3', 'electronics', 300, true),
			];

			const toRules = [
				{
					attributes: {
						category: { ne: 'electronics' },
					},
				},
			];

			const matches = engine.findMatchingTo(fromEntities, toRules, allEntities);
			expect(matches).toHaveLength(1);
			expect(matches[0].id).toBe('2');
		});

		it('excludes source entities from matches', () => {
			const fromEntities = [createProduct('1', 'electronics', 100, true)];
			const allEntities = [...fromEntities, createProduct('2', 'electronics', 200, true)];

			const toRules = [
				{
					attributes: {
						category: { eq: 'electronics' },
					},
				},
			];

			const matches = engine.findMatchingTo(fromEntities, toRules, allEntities);
			expect(matches).toHaveLength(1);
			expect(matches[0].id).toBe('2');
		});
	});

	describe('numeric comparisons', () => {
		const engine = new TypedRuleEngine(productSchema);
		const entities = [
			createProduct('1', 'electronics', 100, true),
			createProduct('2', 'electronics', 200, true),
			createProduct('3', 'electronics', 300, true),
		];

		it('handles gt operator', () => {
			const rules = [{ attributes: { price: { gt: 150 } } }];
			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(2);
			expect(matches.map(m => m.id)).toEqual(['2', '3']);
		});

		it('handles gte operator', () => {
			const rules = [{ attributes: { price: { gte: 200 } } }];
			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(2);
			expect(matches.map(m => m.id)).toEqual(['2', '3']);
		});

		it('handles lt operator', () => {
			const rules = [{ attributes: { price: { lt: 250 } } }];
			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(2);
			expect(matches.map(m => m.id)).toEqual(['1', '2']);
		});

		it('handles lte operator', () => {
			const rules = [{ attributes: { price: { lte: 200 } } }];
			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(2);
			expect(matches.map(m => m.id)).toEqual(['1', '2']);
		});
	});

	describe('array operations', () => {
		const engine = new TypedRuleEngine(productSchema);
		const entities = [
			createProduct('1', 'electronics', 100, true, ['new', 'featured']),
			createProduct('2', 'electronics', 200, true, ['sale']),
			createProduct('3', 'electronics', 300, true, ['clearance']),
		];

		it('handles notIn operator with arrays', () => {
			const rules = [{ attributes: { tags: { notIn: ['sale', 'clearance'] } } }];
			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(1);
			expect(matches[0].id).toBe('1');
		});

		it('handles invalid operator', () => {
			const rules = [{ attributes: { tags: { invalid: ['test'] } as any } }];
			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(0);
		});

		it('handles array values with non-array target for in/notIn operators', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true, ['electronics', 'gadgets']),
				createProduct('2', 'electronics', 200, true, ['furniture', 'home']),
			];

			// Test 'in' operator with non-array target
			const inRules = [{ attributes: { tags: { in: 'electronics' as any } } }];
			const inMatches = engine.findMatchingFrom(entities, inRules);
			expect(inMatches).toHaveLength(0);

			// Test 'notIn' operator with non-array target
			const notInRules = [{ attributes: { tags: { notIn: 'electronics' as any } } }];
			const notInMatches = engine.findMatchingFrom(entities, notInRules);
			expect(notInMatches).toHaveLength(0);
		});

		it('handles array operations with empty arrays', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true, []),
				createProduct('2', 'electronics', 200, true, ['tag']),
			];

			// Test 'in' operator with empty array
			const inRules = [{ attributes: { tags: { in: [] } } }];
			const inMatches = engine.findMatchingFrom(entities, inRules);
			expect(inMatches).toHaveLength(0);

			// Test 'notIn' operator with empty array
			const notInRules = [{ attributes: { tags: { notIn: [] } } }];
			const notInMatches = engine.findMatchingFrom(entities, notInRules);
			expect(notInMatches).toHaveLength(2);
		});

		it('handles array operations with null/undefined values', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true, ['tag1']),
				createProduct('2', 'electronics', 200, true, ['tag2']),
			];

			// Test 'in' operator with null/undefined values
			const inRules = [{ attributes: { tags: { in: [null, undefined] as any } } }];
			const inMatches = engine.findMatchingFrom(entities, inRules);
			expect(inMatches).toHaveLength(0);

			// Test 'notIn' operator with null/undefined values
			const notInRules = [{ attributes: { tags: { notIn: [null, undefined] as any } } }];
			const notInMatches = engine.findMatchingFrom(entities, notInRules);
			expect(notInMatches).toHaveLength(2);
		});

		it('handles array operations with mixed value types', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true, ['tag1']),
				createProduct('2', 'electronics', 200, true, ['tag2']),
			];

			// Test 'in' operator with mixed value types
			const inRules = [{ attributes: { tags: { in: ['tag1', 123, null, undefined] as any } } }];
			const inMatches = engine.findMatchingFrom(entities, inRules);
			expect(inMatches).toHaveLength(1);

			// Test 'notIn' operator with mixed value types
			const notInRules = [
				{ attributes: { tags: { notIn: ['tag1', 123, null, undefined] as any } } },
			];
			const notInMatches = engine.findMatchingFrom(entities, notInRules);
			expect(notInMatches).toHaveLength(1);
		});

		it('handles array operations with object values', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true, ['{"id":"nested1"}', '{"id":"nested2"}']),
				createProduct('2', 'electronics', 200, true, ['{"id":"nested3"}']),
			];

			// Test 'in' operator with object values
			const inRules = [{ attributes: { tags: { in: ['{"id":"nested1"}'] } } }];
			const inMatches = engine.findMatchingFrom(entities, inRules);
			expect(inMatches).toHaveLength(1);

			// Test 'notIn' operator with object values
			const notInRules = [{ attributes: { tags: { notIn: ['{"id":"nested1"}'] } } }];
			const notInMatches = engine.findMatchingFrom(entities, notInRules);
			expect(notInMatches).toHaveLength(1);
		});

		it('handles array operations with mixed array/non-array values', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true, ['tag1', 'tag2']), // Array value
				createProduct('2', 'electronics', 200, true, ['tag3']), // Array value
			];

			// Test array value with non-array expected
			const nonArrayExpectedRules = [{ attributes: { tags: { in: 'tag1' as any } } }];
			const nonArrayExpectedMatches = engine.findMatchingFrom(entities, nonArrayExpectedRules);
			expect(nonArrayExpectedMatches).toHaveLength(0);

			// Test non-array value with array expected
			const arrayExpectedRules = [{ attributes: { category: { in: ['electronics'] } } }];
			const arrayExpectedMatches = engine.findMatchingFrom(entities, arrayExpectedRules);
			expect(arrayExpectedMatches).toHaveLength(2);
		});

		it('handles array operations with non-array value but array expected', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true), // Non-array value
				createProduct('2', 'furniture', 200, true), // Non-array value
			];

			// Test non-array value with array expected for 'in'
			const inRules = [{ attributes: { category: { in: ['electronics', 'furniture'] } } }];
			const inMatches = engine.findMatchingFrom(entities, inRules);
			expect(inMatches).toHaveLength(2);

			// Test non-array value with array expected for 'notIn'
			const notInRules = [{ attributes: { category: { notIn: ['electronics', 'furniture'] } } }];
			const notInMatches = engine.findMatchingFrom(entities, notInRules);
			expect(notInMatches).toHaveLength(0);
		});

		it('handles array operations with non-array values for both value and expected', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true), // Non-array value
				createProduct('2', 'furniture', 200, true), // Non-array value
			];

			// Test non-array value with non-array expected for 'in'
			const inRules = [{ attributes: { category: { in: 'electronics' as any } } }];
			const inMatches = engine.findMatchingFrom(entities, inRules);
			expect(inMatches).toHaveLength(0);

			// Test non-array value with non-array expected for 'notIn'
			const notInRules = [{ attributes: { category: { notIn: 'electronics' as any } } }];
			const notInMatches = engine.findMatchingFrom(entities, notInRules);
			expect(notInMatches).toHaveLength(0);
		});

		it('handles missing attributes', () => {
			const entities = [
				{
					id: '1',
					name: 'Test',
					attributes: {
						__validated: true,
					},
				} as TypedEntity<ProductSchema>,
			];

			const rules = [{ attributes: { category: { eq: 'electronics' } } }];
			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(0);
		});
	});

	describe('batch processing', () => {
		const engine = new TypedRuleEngine(productSchema, { maxBatchSize: 10 });

		it('handles very complex rules with batch size adjustments', () => {
			// Create a very complex set of rules (complexity > 20)
			const complexRules = [
				{
					or: [
						{
							and: [
								{ attributes: { price: { gte: 0 } } },
								{ attributes: { price: { lt: 100 } } },
								{ attributes: { category: { eq: 'electronics' } } },
								{ attributes: { inStock: { eq: true } } },
							],
						},
						{
							and: [
								{ attributes: { price: { gte: 100 } } },
								{ attributes: { price: { lt: 200 } } },
								{ attributes: { category: { eq: 'furniture' } } },
								{ attributes: { inStock: { eq: true } } },
							],
						},
					],
				},
				{
					or: [
						{
							and: [
								{ attributes: { price: { gte: 200 } } },
								{ attributes: { price: { lt: 300 } } },
								{ attributes: { category: { eq: 'electronics' } } },
								{ attributes: { inStock: { eq: true } } },
							],
						},
						{
							and: [
								{ attributes: { price: { gte: 300 } } },
								{ attributes: { price: { lt: 400 } } },
								{ attributes: { category: { eq: 'furniture' } } },
								{ attributes: { inStock: { eq: true } } },
							],
						},
					],
				},
			];

			// Create entities that should match the rules
			const entities = [
				createProduct('1', 'electronics', 50, true),
				createProduct('2', 'furniture', 150, true),
				createProduct('3', 'electronics', 250, true),
				createProduct('4', 'furniture', 350, true),
			];

			const matches = engine.findMatchingFrom(entities, complexRules);
			expect(matches.length).toBeGreaterThan(0);
		});

		it('handles complex rules with batch size adjustments', () => {
			// Create a simpler set of complex rules
			const complexRules = [
				{
					or: [
						{
							and: [
								{ attributes: { price: { gte: 0 } } },
								{ attributes: { price: { lt: 100 } } },
								{ attributes: { category: { eq: 'electronics' } } },
							],
						},
						{
							and: [
								{ attributes: { price: { gte: 100 } } },
								{ attributes: { price: { lt: 200 } } },
								{ attributes: { category: { eq: 'furniture' } } },
							],
						},
					],
				},
				{
					or: [
						{
							and: [
								{ attributes: { price: { gte: 200 } } },
								{ attributes: { price: { lt: 300 } } },
								{ attributes: { category: { eq: 'electronics' } } },
							],
						},
						{
							and: [
								{ attributes: { price: { gte: 300 } } },
								{ attributes: { price: { lt: 400 } } },
								{ attributes: { category: { eq: 'furniture' } } },
							],
						},
					],
				},
			];

			// Create entities that should match the rules
			const entities = [
				createProduct('1', 'electronics', 50, true),
				createProduct('2', 'furniture', 150, true),
				createProduct('3', 'electronics', 250, true),
				createProduct('4', 'furniture', 350, true),
			];

			const matches = engine.findMatchingFrom(entities, complexRules);
			expect(matches.length).toBeGreaterThan(0);
		});

		it('handles empty rule sets', () => {
			const entities = Array.from({ length: 20 }, (_, i) =>
				createProduct(i.toString(), 'electronics', i * 100, true),
			);

			const matches = engine.findMatchingFrom(entities, []);
			expect(matches).toHaveLength(0);
		});

		it('handles rules with empty attributes', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true),
				createProduct('2', 'furniture', 200, true),
			];

			const rules = [{ attributes: {} }];
			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(0);
		});
	});
});
