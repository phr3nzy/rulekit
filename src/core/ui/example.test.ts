import { describe, it, expect } from 'vitest';
import { runExample, uiConfig } from './example';
import { convertUIConfigurationToRules } from './converter';

describe('UI Configuration Example', () => {
	it('should convert UI configuration to valid rules', () => {
		const { sourceRules, recommendationRules } = convertUIConfigurationToRules(uiConfig);

		// Verify source rules
		expect(sourceRules).toHaveLength(2);
		expect(sourceRules[0]).toEqual({
			attributes: {
				category: {
					eq: 'Outdoor furniture',
				},
			},
		});
		expect(sourceRules[1]).toEqual({
			attributes: {
				price: {
					lte: 1500000,
				},
			},
		});

		// Verify recommendation rules
		expect(recommendationRules).toHaveLength(2);
		expect(recommendationRules[0]).toEqual({
			attributes: {
				category: {
					eq: 'Indoor furniture',
				},
			},
		});
		expect(recommendationRules[1]).toEqual({
			attributes: {
				price: {
					lte: 500000,
				},
			},
		});
	});

	it('should process example configuration correctly', async () => {
		const result = await runExample();

		// Verify source products (Outdoor furniture)
		expect(result.sourceProducts).toHaveLength(1);
		expect(result.sourceProducts[0].name).toBe('Outdoor Chair');
		expect(result.sourceProducts[0].attributes.category).toBe('Outdoor furniture');

		// Verify recommended products (Indoor furniture)
		expect(result.recommendedProducts).toHaveLength(1);
		expect(result.recommendedProducts[0].name).toBe('Indoor Chair');
		expect(result.recommendedProducts[0].attributes.category).toBe('Indoor furniture');
	});
});
