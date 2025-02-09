import { describe, it, expect } from 'vitest';
import { ComparisonOperators } from '../models/types';
import {
	UIConditionType,
	UIComponentType,
	type UIRuleConfiguration,
	type UIConditionTypeValue,
} from './types';
import { convertUIConfigurationToRules, validateUIConfiguration } from './converter';

describe('UI Configuration Converter', () => {
	describe('convertUIConfigurationToRules', () => {
		it('should convert filters to from rules', () => {
			const config: UIRuleConfiguration = {
				filters: [
					{
						name: 'category',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
								min: 0,
								max: 1,
							},
						],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.fromRules).toHaveLength(1);
			expect(result.fromRules[0]).toEqual({
				attributes: {
					category: {
						[ComparisonOperators.eq]: [1],
					},
				},
			});
		});

		it('should convert matchingFrom configuration to from rules', () => {
			const config: UIRuleConfiguration = {
				matchingFrom: [
					{
						name: 'Product',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
							},
						],
						values: ['Product 1'],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.fromRules).toHaveLength(1);
			expect(result.fromRules[0]).toEqual({
				attributes: {
					Product: {
						[ComparisonOperators.eq]: ['Product 1'],
					},
				},
			});
		});

		it('should convert matchingTo configuration to to rules', () => {
			const config: UIRuleConfiguration = {
				matchingTo: [
					{
						name: 'Category',
						conditions: [
							{
								condition: UIConditionType.IN,
								type: UIComponentType.MULTISELECTOR,
								min: 1,
								max: -1,
							},
						],
						values: ['Category 1', 'Category 2'],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.toRules).toHaveLength(1);
			expect(result.toRules[0]).toEqual({
				attributes: {
					Category: {
						[ComparisonOperators.in]: ['Category 1', 'Category 2'],
					},
				},
			});
		});

		it('should combine multiple conditions with AND', () => {
			const config: UIRuleConfiguration = {
				filters: [
					{
						name: 'price',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.TEXT,
								min: 0,
							},
							{
								condition: UIConditionType.IS_NOT,
								type: UIComponentType.TEXT,
								max: 100,
							},
						],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.fromRules).toHaveLength(1);
			expect(result.fromRules[0]).toHaveProperty('and');
			expect(result.fromRules[0].and).toHaveLength(2);
		});

		it('should handle legacy source rules', () => {
			const config: UIRuleConfiguration = {
				source: [
					{
						name: 'Product',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
							},
						],
						values: ['Legacy Product'],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.fromRules).toHaveLength(1);
			expect(result.fromRules[0]).toEqual({
				attributes: {
					Product: {
						[ComparisonOperators.eq]: ['Legacy Product'],
					},
				},
			});
		});

		it('should handle legacy recommendation rules', () => {
			const config: UIRuleConfiguration = {
				recommendations: [
					{
						name: 'Category',
						conditions: [
							{
								condition: UIConditionType.IN,
								type: UIComponentType.MULTISELECTOR,
							},
						],
						values: ['Legacy Category'],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.toRules).toHaveLength(1);
			expect(result.toRules[0]).toEqual({
				attributes: {
					Category: {
						[ComparisonOperators.in]: ['Legacy Category'],
					},
				},
			});
		});

		it('should handle both legacy source and recommendation rules', () => {
			const config: UIRuleConfiguration = {
				source: [
					{
						name: 'Product',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
							},
						],
						values: ['Legacy Product'],
					},
				],
				recommendations: [
					{
						name: 'Category',
						conditions: [
							{
								condition: UIConditionType.IN,
								type: UIComponentType.MULTISELECTOR,
							},
						],
						values: ['Legacy Category'],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.fromRules).toHaveLength(1);
			expect(result.toRules).toHaveLength(1);
			expect(result.fromRules[0]).toEqual({
				attributes: {
					Product: {
						[ComparisonOperators.eq]: ['Legacy Product'],
					},
				},
			});
			expect(result.toRules[0]).toEqual({
				attributes: {
					Category: {
						[ComparisonOperators.in]: ['Legacy Category'],
					},
				},
			});
		});

		it('should handle numeric string conversions for TEXT components', () => {
			const config: UIRuleConfiguration = {
				filters: [
					{
						name: 'price',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.TEXT,
								max: '100',
							},
						],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.fromRules[0]).toEqual({
				attributes: {
					price: {
						[ComparisonOperators.lte]: 100,
					},
				},
			});
		});

		it('should handle invalid numeric strings', () => {
			const config: UIRuleConfiguration = {
				filters: [
					{
						name: 'price',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.TEXT,
								max: 'not a number',
							},
						],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.fromRules[0]).toEqual({
				attributes: {
					price: {
						[ComparisonOperators.lte]: 'not a number',
					},
				},
			});
		});

		it('should handle numeric operators with array values', () => {
			const config: UIRuleConfiguration = {
				matchingFrom: [
					{
						name: 'price',
						conditions: [
							{
								condition: UIConditionType.IN,
								type: UIComponentType.TEXT,
							},
						],
						values: ['100', '200'],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.fromRules[0]).toEqual({
				attributes: {
					price: {
						[ComparisonOperators.in]: ['100', '200'],
					},
				},
			});
		});

		it('should handle numeric comparison operators with single value arrays', () => {
			const config: UIRuleConfiguration = {
				filters: [
					{
						name: 'price',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.TEXT,
								max: 100,
							},
						],
					},
					{
						name: 'quantity',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.TEXT,
								min: 50,
							},
						],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			// Test that numeric values are handled correctly
			expect(result.fromRules[0]).toEqual({
				attributes: {
					price: {
						[ComparisonOperators.lte]: 100,
					},
				},
			});

			expect(result.fromRules[1]).toEqual({
				attributes: {
					quantity: {
						[ComparisonOperators.gte]: 50,
					},
				},
			});

			// Test with array values
			const configWithArrays: UIRuleConfiguration = {
				matchingFrom: [
					{
						name: 'price',
						conditions: [
							{
								condition: UIConditionType.IN,
								type: UIComponentType.TEXT,
							},
						],
						values: ['100', '200'],
					},
				],
			};

			const resultWithArrays = convertUIConfigurationToRules(configWithArrays);
			expect(resultWithArrays.fromRules[0]).toEqual({
				attributes: {
					price: {
						[ComparisonOperators.in]: ['100', '200'],
					},
				},
			});
		});

		it('should handle null values in TEXT components', () => {
			const config: UIRuleConfiguration = {
				filters: [
					{
						name: 'price',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.TEXT,
								max: null,
							},
						],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.fromRules[0]).toEqual({
				attributes: {
					price: {
						[ComparisonOperators.lte]: null,
					},
				},
			});
		});

		it('should throw error for unknown condition type', () => {
			const config: UIRuleConfiguration = {
				filters: [
					{
						name: 'test',
						conditions: [
							{
								condition: 'UNKNOWN' as UIConditionTypeValue,
								type: UIComponentType.TEXT,
							},
						],
					},
				],
			};

			expect(() => convertUIConfigurationToRules(config)).toThrow(
				'Unknown condition type: UNKNOWN',
			);
		});
	});

	describe('validateUIConfiguration', () => {
		it('should throw error if no rules are provided', () => {
			expect(() => validateUIConfiguration({})).toThrow(
				'Configuration must contain at least one rule type',
			);
		});

		it('should throw error if filter has no name', () => {
			const config: UIRuleConfiguration = {
				filters: [
					{
						name: '',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
							},
						],
					},
				],
			};

			expect(() => validateUIConfiguration(config)).toThrow('Filter must have a name');
		});

		it('should throw error if filter has no conditions', () => {
			const config: UIRuleConfiguration = {
				filters: [
					{
						name: 'test',
						conditions: [],
					},
				],
			};

			expect(() => validateUIConfiguration(config)).toThrow(
				'Filter "test" must have at least one condition',
			);
		});

		it('should throw error if matchingTo has no values', () => {
			const config: UIRuleConfiguration = {
				matchingTo: [
					{
						name: 'test',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
							},
						],
						values: [],
					},
				],
			};

			expect(() => validateUIConfiguration(config)).toThrow(
				'To "test" must have at least one value',
			);
		});

		it('should throw error if matchingFrom has no name', () => {
			const config: UIRuleConfiguration = {
				matchingFrom: [
					{
						name: '',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
							},
						],
						values: ['test'],
					},
				],
			};

			expect(() => validateUIConfiguration(config)).toThrow('From must have a name');
		});

		it('should throw error if matchingFrom has no conditions', () => {
			const config: UIRuleConfiguration = {
				matchingFrom: [
					{
						name: 'test',
						conditions: [],
						values: ['test'],
					},
				],
			};

			expect(() => validateUIConfiguration(config)).toThrow(
				'From "test" must have at least one condition',
			);
		});

		it('should throw error if matchingFrom has no values', () => {
			const config: UIRuleConfiguration = {
				matchingFrom: [
					{
						name: 'test',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
							},
						],
						values: [],
					},
				],
			};

			expect(() => validateUIConfiguration(config)).toThrow(
				'From "test" must have at least one value',
			);
		});

		it('should throw error if legacy source rule has no values', () => {
			const config: UIRuleConfiguration = {
				source: [
					{
						name: 'test',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
							},
						],
						values: [],
					},
				],
			};

			expect(() => validateUIConfiguration(config)).toThrow(
				'From "test" must have at least one value',
			);
		});

		it('should throw error if legacy recommendation rule has no values', () => {
			const config: UIRuleConfiguration = {
				recommendations: [
					{
						name: 'test',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
							},
						],
						values: [],
					},
				],
			};

			expect(() => validateUIConfiguration(config)).toThrow(
				'To "test" must have at least one value',
			);
		});

		it('should handle TEXT component with min value', () => {
			const config: UIRuleConfiguration = {
				filters: [
					{
						name: 'price',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.TEXT,
								min: 50,
							},
						],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);
			expect(result.fromRules[0]).toEqual({
				attributes: {
					price: {
						[ComparisonOperators.gte]: 50,
					},
				},
			});
		});

		it('should handle TEXT component with both min and max values', () => {
			const config: UIRuleConfiguration = {
				filters: [
					{
						name: 'price',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.TEXT,
								min: 50,
								max: 100,
							},
						],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);
			expect(result.fromRules[0]).toEqual({
				attributes: {
					price: {
						[ComparisonOperators.lte]: 100,
					},
				},
			});
		});

		it('should handle non-TEXT component with min/max values', () => {
			const config: UIRuleConfiguration = {
				filters: [
					{
						name: 'category',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
								min: 1,
								max: 5,
							},
						],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);
			expect(result.fromRules[0]).toEqual({
				attributes: {
					category: {
						[ComparisonOperators.eq]: [5],
					},
				},
			});
		});

		it('should handle TEXT component with numeric string values', () => {
			const config: UIRuleConfiguration = {
				filters: [
					{
						name: 'price',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.TEXT,
								max: '100',
							},
						],
					},
					{
						name: 'minPrice',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.TEXT,
								min: '50',
							},
						],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);
			expect(result.fromRules[0]).toEqual({
				attributes: {
					price: {
						[ComparisonOperators.lte]: 100,
					},
				},
			});
			expect(result.fromRules[1]).toEqual({
				attributes: {
					minPrice: {
						[ComparisonOperators.gte]: 50,
					},
				},
			});
		});
	});
});
