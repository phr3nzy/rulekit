import { describe, it, expect, vi } from 'vitest';
import { runExample, uiConfig } from './example';
import { convertUIConfigurationToRules } from './converter';
import { RuleEngine } from '../services/rule-engine';

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

	it('should handle errors during processing', async () => {
		// Mock console.error to prevent actual logging
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

		// Mock RuleEngine to throw an error
		const originalProcessConfig = RuleEngine.prototype.processConfig;
		RuleEngine.prototype.processConfig = vi.fn().mockRejectedValue(new Error('Test error'));

		// Expect runExample to throw
		await expect(runExample()).rejects.toThrow('Test error');

		// Verify error was logged
		expect(consoleError).toHaveBeenCalledWith('Error processing rules:', expect.any(Error));

		// Restore mocks
		consoleError.mockRestore();
		RuleEngine.prototype.processConfig = originalProcessConfig;
	});
});
