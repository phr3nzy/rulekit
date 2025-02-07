import { describe, it, expect } from 'vitest';
import { runExample, uiConfig } from './example';
import { convertUIConfigurationToRules } from './converter';

describe('UI Configuration Example', () => {
	it('should convert UI configuration to valid rules', () => {
		const { fromRules, toRules } = convertUIConfigurationToRules(uiConfig);

		// Verify from rules
		expect(fromRules).toHaveLength(2);
		expect(fromRules[0]).toEqual({
			attributes: {
				category: {
					eq: ['Outdoor furniture'],
				},
			},
		});
		expect(fromRules[1]).toEqual({
			attributes: {
				price: {
					lte: 1500000,
				},
			},
		});

		// Verify to rules
		expect(toRules).toHaveLength(2);
		expect(toRules[0]).toEqual({
			attributes: {
				category: {
					eq: ['Indoor furniture'],
				},
			},
		});
		expect(toRules[1]).toEqual({
			attributes: {
				price: {
					lte: 500000,
				},
			},
		});
	});

	it('should process example configuration correctly', async () => {
		const result = await runExample();

		// Verify from entities (Outdoor furniture)
		expect(result.fromEntities).toHaveLength(1);
		expect(result.fromEntities[0].name).toBe('Outdoor Chair');
		expect(result.fromEntities[0].attributes.category).toBe('Outdoor furniture');

		// Verify to entities (Indoor furniture)
		expect(result.toEntities).toHaveLength(1);
		expect(result.toEntities[0].name).toBe('Indoor Chair');
		expect(result.toEntities[0].attributes.category).toBe('Indoor furniture');
	});
});
