import { bench, describe } from 'vitest';
import { RuleEngine } from '../../index';
import type { Entity, Rule } from '../models/types';

/**
 * Type-safe product categories for consistent testing
 */
const PRODUCT_CATEGORIES = {
	ELECTRONICS: 'Electronics',
	CLOTHING: 'Clothing',
	HOME_GARDEN: 'Home & Garden',
	SPORTS: 'Sports',
	BEAUTY: 'Beauty',
	BOOKS: 'Books',
	TOYS: 'Toys',
} as const;

/**
 * Type-safe product brands for consistent testing
 */
const PRODUCT_BRANDS = {
	APPLE: 'Apple',
	SAMSUNG: 'Samsung',
	NIKE: 'Nike',
	ADIDAS: 'Adidas',
	SONY: 'Sony',
	LG: 'LG',
	DELL: 'Dell',
	HP: 'HP',
} as const;

/**
 * Type-safe product conditions for consistent testing
 */
const PRODUCT_CONDITIONS = {
	NEW: 'New',
	REFURBISHED: 'Refurbished',
	USED: 'Used',
} as const;

/**
 * Type-safe availability states for consistent testing
 */
const AVAILABILITY_STATES = {
	IN_STOCK: 'In Stock',
	LIMITED: 'Limited Stock',
	PRE_ORDER: 'Pre-order',
} as const;

type ProductCategory = (typeof PRODUCT_CATEGORIES)[keyof typeof PRODUCT_CATEGORIES];
type ProductBrand = (typeof PRODUCT_BRANDS)[keyof typeof PRODUCT_BRANDS];
type ProductCondition = (typeof PRODUCT_CONDITIONS)[keyof typeof PRODUCT_CONDITIONS];
type AvailabilityState = (typeof AVAILABILITY_STATES)[keyof typeof AVAILABILITY_STATES];

/**
 * Generates realistic product data for benchmarking
 * @param count Number of products to generate
 * @returns Array of typed Product objects
 */
const generateRealisticEntities = (count: number): Entity[] => {
	const categories = Object.values(PRODUCT_CATEGORIES);
	const brands = Object.values(PRODUCT_BRANDS);
	const conditions = Object.values(PRODUCT_CONDITIONS);
	const availability = Object.values(AVAILABILITY_STATES);

	return Array.from({ length: count }, (_, i) => ({
		id: `prod_${i + 1}`,
		name: `Product ${i + 1}`,
		attributes: {
			price: Math.floor(Math.random() * 2000) + 1,
			category: categories[Math.floor(Math.random() * categories.length)] as ProductCategory,
			brand: brands[Math.floor(Math.random() * brands.length)] as ProductBrand,
			condition: conditions[Math.floor(Math.random() * conditions.length)] as ProductCondition,
			availability: availability[
				Math.floor(Math.random() * availability.length)
			] as AvailabilityState,
			rating: Math.floor(Math.random() * 5) + 1,
			inStock: Math.random() > 0.2,
			tags: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => `tag${i + 1}`),
			weight: Number((Math.random() * 10).toFixed(2)),
			dimensions: {
				length: Number((Math.random() * 100).toFixed(2)),
				width: Number((Math.random() * 100).toFixed(2)),
				height: Number((Math.random() * 100).toFixed(2)),
			},
			__validated: true,
		},
	}));
};

/**
 * Creates a rule for finding premium electronics
 * @returns Rule for premium electronics
 */
const createPremiumElectronicsRule = (): Rule => ({
	and: [
		{ attributes: { category: { eq: PRODUCT_CATEGORIES.ELECTRONICS } } },
		{ attributes: { price: { gt: 500 } } },
		{ attributes: { rating: { gte: 4 } } },
		{ attributes: { inStock: { eq: true } } },
		{
			or: [
				{ attributes: { brand: { eq: PRODUCT_BRANDS.APPLE } } },
				{ attributes: { brand: { eq: PRODUCT_BRANDS.SAMSUNG } } },
			],
		},
	],
});

/**
 * Creates a complex nested rule for multi-category filtering
 * @returns Complex nested rule
 */
const createComplexNestedRule = (): Rule => ({
	or: [
		{
			and: [
				{ attributes: { category: { eq: PRODUCT_CATEGORIES.ELECTRONICS } } },
				{ attributes: { price: { gt: 1000 } } },
				{ attributes: { condition: { eq: PRODUCT_CONDITIONS.NEW } } },
			],
		},
		{
			and: [
				{ attributes: { category: { eq: PRODUCT_CATEGORIES.CLOTHING } } },
				{ attributes: { price: { lt: 100 } } },
				{ attributes: { brand: { in: [PRODUCT_BRANDS.NIKE, PRODUCT_BRANDS.ADIDAS] } } },
			],
		},
		{
			and: [
				{ attributes: { rating: { gte: 4 } } },
				{ attributes: { availability: { eq: AVAILABILITY_STATES.IN_STOCK } } },
				{ attributes: { 'dimensions.height': { lt: 50 } } },
			],
		},
	],
});

describe('RuleEngine Performance Benchmarks', () => {
	// Pre-generate datasets to ensure consistent benchmarking
	const smallDataset = generateRealisticEntities(100);
	const mediumDataset = generateRealisticEntities(1000);
	const largeDataset = generateRealisticEntities(10000);

	describe('Entity Matching Benchmarks', () => {
		bench('Real-world entity matching (100 entities)', async () => {
			const engine = new RuleEngine();
			await engine.findMatchingFrom(smallDataset, [createPremiumElectronicsRule()]);
		});

		bench('Complex nested rules (1000 entities)', async () => {
			const engine = new RuleEngine();
			await engine.findMatchingFrom(mediumDataset, [createComplexNestedRule()]);
		});

		bench('Large dataset processing (10000 entities)', async () => {
			const engine = new RuleEngine();
			const rules: Rule[] = [
				{
					and: [
						{ attributes: { inStock: { eq: true } } },
						{
							or: [
								{
									attributes: {
										category: {
											in: [PRODUCT_CATEGORIES.ELECTRONICS, PRODUCT_CATEGORIES.SPORTS],
										},
									},
								},
								{ attributes: { rating: { gte: 4 } } },
							],
						},
						{
							and: [
								{ attributes: { price: { gte: 100 } } },
								{ attributes: { price: { lte: 1000 } } },
							],
						},
					],
				},
			];

			await engine.findMatchingFrom(largeDataset, rules);
		});
	});

	describe('Matching Benchmarks', () => {
		bench('Matching with multiple from entities', async () => {
			const engine = new RuleEngine();
			const fromEntities = mediumDataset.filter(
				(p: Entity): p is Entity =>
					p.attributes.category === PRODUCT_CATEGORIES.ELECTRONICS &&
					(p.attributes.price as number) > 1000,
			);

			const toRules: Rule[] = [
				{
					or: [
						{
							and: [
								{ attributes: { category: { eq: PRODUCT_CATEGORIES.ELECTRONICS } } },
								{ attributes: { price: { lt: 200 } } },
								{ attributes: { brand: { eq: 'source.attributes.brand' } } },
							],
						},
						{
							and: [
								{ attributes: { category: { eq: 'Accessories' } } },
								{ attributes: { rating: { gte: 4 } } },
							],
						},
					],
				},
			];

			await engine.findMatchingTo(fromEntities, toRules, mediumDataset);
		});
	});
});
