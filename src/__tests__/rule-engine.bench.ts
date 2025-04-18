import { bench } from 'vitest';
import { AttributeType } from '../attributes/types';
import type { Entity } from '../types/schema';
import { RuleEngine } from '../engine/rule-engine';

// Test schema definition
const CATEGORIES = ['electronics', 'furniture', 'clothing'] as const;

const productSchema = {
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
): Entity<typeof productSchema> => ({
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

const engine = new RuleEngine(productSchema);

// Generate test data
const generateEntities = (count: number): Entity<typeof productSchema>[] => {
	return Array.from({ length: count }, (_, i) =>
		createProduct(
			`${i}`,
			i % 2 === 0 ? 'electronics' : 'furniture',
			100 + i * 10,
			i % 3 === 0,
			i % 4 === 0 ? ['featured'] : [],
		),
	);
};

const simpleRule = {
	attributes: {
		category: { eq: 'electronics' },
		inStock: { eq: true },
	},
};

const complexRule = {
	and: [
		{
			or: [
				{ attributes: { category: { eq: 'electronics' } } },
				{ attributes: { category: { eq: 'furniture' } } },
			],
		},
		{
			attributes: {
				price: { gte: 200, lte: 500 },
				tags: { in: ['featured'] },
			},
		},
	],
};

bench(
	'simple rule with 1000 entities',
	() => {
		const entities = generateEntities(1000);
		engine.findMatchingFrom(entities, [simpleRule]);
	},
	{ iterations: 100 },
);

bench(
	'complex rule with 1000 entities',
	() => {
		const entities = generateEntities(1000);
		engine.findMatchingFrom(entities, [complexRule]);
	},
	{ iterations: 100 },
);

bench(
	'batch processing with 10000 entities',
	() => {
		const entities = generateEntities(10000);
		engine.findMatchingFrom(entities, [simpleRule]);
	},
	{ iterations: 10 },
);
