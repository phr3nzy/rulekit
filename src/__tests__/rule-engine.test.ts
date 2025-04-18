import { describe, it, expect } from 'vitest';
import { AttributeType, type AttributeTypeValue } from '../attributes/types';
import type { AttributeSchema, Entity } from '../types/schema';
import { RuleEngine } from '../engine/rule-engine';

describe('RuleEngine', () => {
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
	): Entity<ProductSchema> => ({
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
		const engine = new RuleEngine(productSchema);

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

		it('matches entities with numeric comparison operators (gt, gte, lt, lte)', () => {
			const entities = [
				createProduct('1', 'electronics', 50, true),
				createProduct('2', 'furniture', 100, false),
				createProduct('3', 'electronics', 150, true),
				createProduct('4', 'clothing', 100, true),
			];

			// GT
			const rulesGt = [{ attributes: { price: { gt: 100 } } }];
			const matchesGt = engine.findMatchingFrom(entities, rulesGt);
			expect(matchesGt).toHaveLength(1);
			expect(matchesGt[0].id).toBe('3');

			// GTE
			const rulesGte = [{ attributes: { price: { gte: 100 } } }];
			const matchesGte = engine.findMatchingFrom(entities, rulesGte);
			expect(matchesGte).toHaveLength(3);
			expect(matchesGte.map(m => m.id)).toEqual(['2', '3', '4']);

			// LT (already tested, but included for completeness)
			const rulesLt = [{ attributes: { price: { lt: 100 } } }];
			const matchesLt = engine.findMatchingFrom(entities, rulesLt);
			expect(matchesLt).toHaveLength(1);
			expect(matchesLt[0].id).toBe('1');

			// LTE
			const rulesLte = [{ attributes: { price: { lte: 100 } } }];
			const matchesLte = engine.findMatchingFrom(entities, rulesLte);
			expect(matchesLte).toHaveLength(3);
			expect(matchesLte.map(m => m.id)).toEqual(['1', '2', '4']);
		});

		it('matches entities with "in" operator on non-array attributes', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true),
				createProduct('2', 'furniture', 200, false),
				createProduct('3', 'clothing', 300, true),
			];
			const rules = [{ attributes: { category: { in: ['electronics', 'clothing'] } } }];
			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(2);
			expect(matches.map(m => m.id)).toEqual(['1', '3']);
		});

		it('matches entities with "notIn" operator', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true, ['new', 'featured']),
				createProduct('2', 'furniture', 200, false, ['sale']),
				createProduct('3', 'clothing', 300, true, ['new']),
			];

			// notIn on non-array
			const rulesNotInNonArray = [
				{ attributes: { category: { notIn: ['electronics', 'furniture'] } } },
			];
			const matchesNotInNonArray = engine.findMatchingFrom(entities, rulesNotInNonArray);
			expect(matchesNotInNonArray).toHaveLength(1);
			expect(matchesNotInNonArray[0].id).toBe('3');

			// notIn on array
			const rulesNotInArray = [{ attributes: { tags: { notIn: ['featured', 'sale'] } } }];
			const matchesNotInArray = engine.findMatchingFrom(entities, rulesNotInArray);
			expect(matchesNotInArray).toHaveLength(1);
			expect(matchesNotInArray[0].id).toBe('3'); // Only product 3 has 'new' but not 'featured' or 'sale'
		});

		it('handles empty rules', () => {
			const entities = [
				createProduct('1', 'electronics', 100, true),
				createProduct('2', 'furniture', 200, false),
			];

			const matches = engine.findMatchingFrom(entities, [{}]);
			expect(matches).toEqual(entities);
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
				} as Entity<ProductSchema>,
			];

			const rules = [{ attributes: { category: { eq: 'electronics' } } }];

			const matches = engine.findMatchingFrom(entities, rules);
			expect(matches).toHaveLength(1);
			expect(matches[0].id).toBe('1');
		});
	});

	describe('findMatchingTo', () => {
		const engine = new RuleEngine(productSchema);

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
});
