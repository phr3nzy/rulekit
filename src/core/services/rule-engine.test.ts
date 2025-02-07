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
		it('should find entities matching from rules', async () => {
			const rules: Rule[] = [
				{
					and: [
						{ attributes: { category: { eq: 'Electronics' } } },
						{ attributes: { price: { gt: 1000 } } },
					],
				},
			];

			const fromEntities = await engine.findMatchingFrom(testEntities, rules);
			expect(fromEntities).toHaveLength(2);
			expect(fromEntities.map(e => e.id).sort()).toEqual(['1', '4']); // Laptop and Desktop PC
		});

		it('should handle complex from rules with OR conditions', async () => {
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

			const fromEntities = await engine.findMatchingFrom(testEntities, rules);
			expect(fromEntities).toHaveLength(4);
			expect(fromEntities.map(e => e.id).sort()).toEqual(['1', '3', '4', '5']); // All TechBrand products and Electronics
		});
	});

	describe('matching to', () => {
		it('should find matching to entities excluding from entities', async () => {
			const fromEntities = testEntities.filter(e => e.attributes.category === 'Electronics');
			const toRules: Rule[] = [
				{
					and: [
						{ attributes: { category: { eq: 'Accessories' } } },
						{ attributes: { brand: { eq: 'TechBrand' } } },
					],
				},
			];

			const toEntities = await engine.findMatchingTo(fromEntities, toRules, testEntities);

			expect(toEntities).toHaveLength(2);
			expect(toEntities.map(e => e.id).sort()).toEqual(['3', '5']); // Wireless Mouse and Keyboard
		});

		it('should handle price range matching', async () => {
			const fromEntities = [testEntities[0]]; // Laptop
			const toRules: Rule[] = [
				{
					and: [
						{ attributes: { category: { eq: 'Accessories' } } },
						{ attributes: { price: { lt: 100 } } },
					],
				},
			];

			const toEntities = await engine.findMatchingTo(fromEntities, toRules, testEntities);

			expect(toEntities).toHaveLength(3);
			expect(toEntities.map(e => e.id).sort()).toEqual(['2', '3', '5']); // All accessories
		});
	});

	describe('matching configuration', () => {
		it('should process active matching config', async () => {
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

			const result = await engine.processConfig(config, testEntities);

			expect(result.fromEntities).toHaveLength(2); // Laptop and Desktop PC
			expect(result.toEntities).toHaveLength(2); // TechBrand accessories
			expect(result.fromEntities.map(e => e.id).sort()).toEqual(['1', '4']);
			expect(result.toEntities.map(e => e.id).sort()).toEqual(['3', '5']);
		});

		it('should return empty results for inactive config', async () => {
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

			const result = await engine.processConfig(config, testEntities);

			expect(result.fromEntities).toHaveLength(0);
			expect(result.toEntities).toHaveLength(0);
		});
	});
});
