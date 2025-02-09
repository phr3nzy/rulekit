import { describe, it, expect, beforeEach } from 'vitest';
import { RuleEngine } from './rule-engine';
import type { Entity, Rule, MatchingConfig } from '../models/types';

describe('RuleEngine', () => {
	let engine: RuleEngine;

	const testEntities: Entity[] = [
		{
			id: '1',
			name: 'Laptop',
			attributes: {
				price: 1200,
				category: 'Electronics',
				brand: 'TechBrand',
				color: 'blue',
				weight: 50,
				__validated: true,
			},
		},
		{
			id: '2',
			name: 'Laptop Bag',
			attributes: {
				price: 50,
				category: 'Accessories',
				brand: 'BagBrand',
				color: 'red',
				weight: 10,
				__validated: true,
			},
		},
		{
			id: '3',
			name: 'Wireless Mouse',
			attributes: {
				price: 30,
				category: 'Accessories',
				brand: 'TechBrand',
				color: 'red',
				weight: 10,
				__validated: true,
			},
		},
		{
			id: '4',
			name: 'Desktop PC',
			attributes: {
				price: 2000,
				category: 'Electronics',
				brand: 'TechBrand',
				color: 'blue',
				weight: 50,
				__validated: true,
			},
		},
		{
			id: '5',
			name: 'Keyboard',
			attributes: {
				price: 80,
				category: 'Accessories',
				brand: 'TechBrand',
				color: 'blue',
				weight: 50,
				__validated: true,
			},
		},
	];

	beforeEach(() => {
		engine = new RuleEngine();
	});

	describe('matching from', () => {
		it('should find entities matching from rules', () => {
			const rules: Rule[] = [
				{
					and: [
						{ attributes: { category: { eq: 'Electronics' } } },
						{ attributes: { price: { gt: 1000 } } },
					],
				},
			];

			const fromEntities = engine.findMatchingFrom(testEntities, rules);
			expect(fromEntities).toHaveLength(2);
			expect(fromEntities.map(e => e.id).sort()).toEqual(['1', '4']); // Laptop and Desktop PC
		});

		it('should handle complex from rules with OR conditions', () => {
			const rules: Rule[] = [
				{
					or: [
						{ attributes: { category: { eq: 'Electronics' } } },
						{
							and: [
								{ attributes: { category: { eq: 'Accessories' } } },
								{ attributes: { brand: { eq: 'TechBrand' } } },
							],
						},
					],
				},
			];

			const fromEntities = engine.findMatchingFrom(testEntities, rules);
			expect(fromEntities).toHaveLength(4);
			expect(fromEntities.map(e => e.id).sort()).toEqual(['1', '3', '4', '5']); // All TechBrand products and Electronics
		});

		it('should handle very complex rules that reduce batch size', () => {
			// Create a complex rule with many conditions to trigger batch size reduction
			const complexRule: Rule = {
				and: Array.from({ length: 5 }, () => ({
					or: Array.from({ length: 5 }, () => ({
						attributes: {
							category: { eq: 'Electronics' },
							price: { gt: 1000 },
							brand: { eq: 'TechBrand' },
							color: { eq: 'blue' },
							weight: { eq: 50 },
						},
					})),
				})),
			};

			const fromEntities = engine.findMatchingFrom(testEntities, [complexRule]);
			expect(fromEntities).toHaveLength(2);
			expect(fromEntities.map(e => e.id).sort()).toEqual(['1', '4']); // Laptop and Desktop PC
		});

		it('should handle extremely complex rules that reduce batch size further', () => {
			// Create an even more complex rule to trigger maximum batch size reduction
			const complexRule: Rule = {
				and: Array.from({ length: 15 }, () => ({
					or: Array.from({ length: 15 }, () => ({
						and: Array.from({ length: 5 }, () => ({
							attributes: {
								category: { eq: 'Electronics' },
								price: { gt: 1000 },
								brand: { eq: 'TechBrand' },
								color: { eq: 'blue' },
								weight: { eq: 50 },
							},
						})),
					})),
				})),
			};

			const fromEntities = engine.findMatchingFrom(testEntities, [complexRule]);
			expect(fromEntities).toHaveLength(2);
			expect(fromEntities.map(e => e.id).sort()).toEqual(['1', '4']); // Laptop and Desktop PC
		});
	});

	describe('matching to', () => {
		it('should find matching to entities excluding from entities', () => {
			const fromEntities = testEntities.filter(e => e.attributes.category === 'Electronics');
			const toRules: Rule[] = [
				{
					and: [
						{ attributes: { category: { eq: 'Accessories' } } },
						{ attributes: { brand: { eq: 'TechBrand' } } },
					],
				},
			];

			const toEntities = engine.findMatchingTo(fromEntities, toRules, testEntities);

			expect(toEntities).toHaveLength(2);
			expect(toEntities.map(e => e.id).sort()).toEqual(['3', '5']); // Wireless Mouse and Keyboard
		});

		it('should handle duplicate source entities correctly', () => {
			const fromEntities = [testEntities[0], testEntities[0]]; // Duplicate Laptop
			const toRules: Rule[] = [
				{
					attributes: { category: { eq: 'Accessories' } },
				},
			];

			const toEntities = engine.findMatchingTo(fromEntities, toRules, testEntities);
			expect(toEntities).toHaveLength(3);
			expect(toEntities.map(e => e.id).sort()).toEqual(['2', '3', '5']); // All accessories
		});

		it('should handle price range matching', () => {
			const fromEntities = [testEntities[0]]; // Laptop
			const toRules: Rule[] = [
				{
					and: [
						{ attributes: { category: { eq: 'Accessories' } } },
						{ attributes: { price: { lt: 100 } } },
					],
				},
			];

			const toEntities = engine.findMatchingTo(fromEntities, toRules, testEntities);

			expect(toEntities).toHaveLength(3);
			expect(toEntities.map(e => e.id).sort()).toEqual(['2', '3', '5']); // All accessories
		});
	});

	describe('batch processing', () => {
		it('should handle custom batch size configuration', () => {
			const customEngine = new RuleEngine({ maxBatchSize: 2 });
			const rules: Rule[] = [
				{
					attributes: { category: { eq: 'Electronics' } },
				},
			];

			const fromEntities = customEngine.findMatchingFrom(testEntities, rules);
			expect(fromEntities).toHaveLength(2);
			expect(fromEntities.map(e => e.id).sort()).toEqual(['1', '4']); // Laptop and Desktop PC
		});

		it('should handle empty entity list', () => {
			const rules: Rule[] = [
				{
					attributes: { category: { eq: 'Electronics' } },
				},
			];

			const fromEntities = engine.findMatchingFrom([], rules);
			expect(fromEntities).toHaveLength(0);
		});

		it('should handle rules with only attributes', () => {
			const rules: Rule[] = [
				{
					attributes: {
						category: { eq: 'Electronics' },
						price: { gt: 1000 },
					},
				},
			];

			const fromEntities = engine.findMatchingFrom(testEntities, rules);
			expect(fromEntities).toHaveLength(2);
			expect(fromEntities.map(e => e.id).sort()).toEqual(['1', '4']); // Laptop and Desktop PC
		});

		it('should handle rules with no conditions', () => {
			const rules: Rule[] = [
				{
					attributes: {},
				},
			];

			const fromEntities = engine.findMatchingFrom(testEntities, rules);
			expect(fromEntities).toHaveLength(0);
		});

		it('should handle rules with no attributes property', () => {
			const rules: Rule[] = [
				{} as Rule, // Empty rule with no attributes property
			];

			const fromEntities = engine.findMatchingFrom(testEntities, rules);
			expect(fromEntities).toHaveLength(0);
		});

		it('should handle rules with mixed complexity', () => {
			const rules: Rule[] = [
				{
					and: [
						{ attributes: { category: { eq: 'Electronics' } } },
						{ attributes: { price: { gt: 1000 } } },
					],
				},
				{
					or: [
						{ attributes: { brand: { eq: 'TechBrand' } } },
						{ attributes: { color: { eq: 'blue' } } },
					],
				},
				{
					attributes: { weight: { eq: 50 } },
				},
			];

			const fromEntities = engine.findMatchingFrom(testEntities, rules);
			expect(fromEntities).toHaveLength(2);
			expect(fromEntities.map(e => e.id).sort()).toEqual(['1', '4']); // Laptop and Desktop PC
		});
	});

	describe('matching configuration', () => {
		it('should process active matching config', () => {
			const config: MatchingConfig = {
				id: 'match1',
				name: 'Electronics with Accessories',
				ruleSet: {
					fromRules: [{ attributes: { category: { eq: 'Electronics' } } }],
					toRules: [
						{
							and: [
								{ attributes: { category: { eq: 'Accessories' } } },
								{ attributes: { brand: { eq: 'TechBrand' } } },
							],
						},
					],
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = engine.processConfig(config, testEntities);

			expect(result.fromEntities).toHaveLength(2); // Laptop and Desktop PC
			expect(result.toEntities).toHaveLength(2); // TechBrand accessories
			expect(result.fromEntities.map(e => e.id).sort()).toEqual(['1', '4']);
			expect(result.toEntities.map(e => e.id).sort()).toEqual(['3', '5']);
		});

		it('should return empty results for inactive config', () => {
			const config: MatchingConfig = {
				id: 'match1',
				name: 'Electronics with Accessories',
				ruleSet: {
					fromRules: [{ attributes: { category: { eq: 'Electronics' } } }],
					toRules: [{ attributes: { category: { eq: 'Accessories' } } }],
				},
				isActive: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = engine.processConfig(config, testEntities);

			expect(result.fromEntities).toHaveLength(0);
			expect(result.toEntities).toHaveLength(0);
		});
	});
});
